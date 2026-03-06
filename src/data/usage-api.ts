/**
 * Anthropic Usage API client
 * OAuth token from macOS Keychain or ~/.claude/.credentials.json
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { request as httpsRequest } from 'node:https';
import type { UsageData } from '../types/index.js';
import { createDebug } from '../utils/debug.js';
import { getClaudeConfigDir } from '../utils/paths.js';

const debug = createDebug('usage-api');

// API endpoints
const USAGE_API_URL = 'https://api.anthropic.com/api/oauth/usage';

// OAuth config
const OAUTH_BETA_HEADER = 'oauth-2025-04-20';

// Storage — Claude Code appends a hash suffix when CLAUDE_CONFIG_DIR is set
const KEYCHAIN_SERVICE_BASE = 'Claude Code-credentials';
const KEYCHAIN_SERVICE = (() => {
  const configDir = process.env.CLAUDE_CONFIG_DIR;
  if (!configDir) return KEYCHAIN_SERVICE_BASE;
  const suffix = createHash('sha256').update(configDir).digest('hex').substring(0, 8);
  return `${KEYCHAIN_SERVICE_BASE}-${suffix}`;
})();
const CREDENTIALS_FILENAME = '.credentials.json';

// Timeouts & caching
const REQUEST_TIMEOUT = 5000;
const CACHE_TTL_SUCCESS = 60000;
const CACHE_TTL_FAILURE = 60000;
const RATE_LIMIT_DEFAULT_BACKOFF = 300000; // 5 minutes
const RATE_LIMIT_MIN_BACKOFF = 10000; // 10 seconds
const KEYCHAIN_BACKOFF_MS = 60000;

// --- Interfaces ---

interface Credentials {
  accessToken: string;
}

interface UsageAPIResponse {
  five_hour?: {
    utilization: number;
    resets_at: string | null;
  };
  seven_day?: {
    utilization: number;
    resets_at: string | null;
  };
}

interface CacheEntry {
  data: UsageData | null;
  timestamp: number;
  success: boolean;
}

// --- Module state ---

let cache: CacheEntry | null = null;
let keychainLastFailure = 0;
let rateLimitUntil = 0;

class UsageAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'UsageAPIError';
  }
}

// --- Main entry point ---

export async function fetchUsage(cacheTtlMs?: number): Promise<UsageData | null> {
  if (Date.now() < rateLimitUntil) {
    debug('rate limit backoff active, returning cached data');
    return cache?.data ?? null;
  }

  if (cache) {
    const ttl = cache.success ? (cacheTtlMs ?? CACHE_TTL_SUCCESS) : CACHE_TTL_FAILURE;
    if (Date.now() - cache.timestamp < ttl) {
      debug('returning cached usage data');
      return cache.data;
    }
  }

  try {
    const credentials = getCredentials();
    if (!credentials) {
      debug('no credentials available');
      cacheResult(null, false);
      return null;
    }

    const response = await makeRequest(credentials.accessToken);
    const data = parseResponse(response);
    cacheResult(data, true);
    return data;
  } catch (error) {
    if (error instanceof UsageAPIError) {
      debug(`usage api error [${error.code}]: ${error.message}`);
    } else {
      debug('usage api request failed:', error);
    }
    if (cache?.data) {
      cache = { data: cache.data, timestamp: Date.now(), success: false };
      return cache.data;
    }
    cacheResult(null, false);
    return null;
  }
}

// --- Cache ---

function cacheResult(data: UsageData | null, success: boolean): void {
  cache = { data, timestamp: Date.now(), success };
}

// --- Credential readers ---

function getCredentials(): Credentials | null {
  const keychain = readKeychainCredentials();
  if (keychain) return keychain;

  const file = readFileCredentials();
  if (file) return file;

  return null;
}

function readKeychainCredentials(): Credentials | null {
  if (process.platform !== 'darwin') {
    return null;
  }

  if (Date.now() - keychainLastFailure < KEYCHAIN_BACKOFF_MS) {
    debug('keychain in backoff period');
    return null;
  }

  try {
    const result = execFileSync('/usr/bin/security', [
      'find-generic-password',
      '-s', KEYCHAIN_SERVICE,
      '-w',
    ], {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const trimmed = result.trim();
    if (!trimmed) {
      keychainLastFailure = Date.now();
      return null;
    }

    const parsed = JSON.parse(trimmed) as {
      claudeAiOauth?: {
        accessToken?: string;
      };
    };
    const oauth = parsed.claudeAiOauth;
    const accessToken = oauth?.accessToken;

    if (!accessToken) {
      debug('invalid keychain credentials structure');
      keychainLastFailure = Date.now();
      return null;
    }

    debug('got credentials from keychain');
    return { accessToken };
  } catch (error) {
    debug('keychain read failed');
    keychainLastFailure = Date.now();
    return null;
  }
}

function readFileCredentials(): Credentials | null {
  try {
    const claudeDir = getClaudeConfigDir();

    let resolvedClaudeDir = claudeDir;
    try {
      if (existsSync(claudeDir)) {
        resolvedClaudeDir = realpathSync(claudeDir);
        debug('resolved .claude directory for credentials:', resolvedClaudeDir);
      }
    } catch (error) {
      debug('failed to resolve .claude symlink for credentials:', error);
    }

    const credentialsPath = join(resolvedClaudeDir, CREDENTIALS_FILENAME);

    let resolvedCredentialsPath = credentialsPath;
    try {
      if (existsSync(credentialsPath)) {
        resolvedCredentialsPath = realpathSync(credentialsPath);
        debug('resolved credentials file path:', resolvedCredentialsPath);
      }
    } catch (error) {
      debug('failed to resolve credentials file symlink:', error);
    }

    const content = readFileSync(resolvedCredentialsPath, 'utf8');
    const parsed = JSON.parse(content) as {
      claudeAiOauth?: {
        accessToken?: string;
      };
    };
    const oauth = parsed.claudeAiOauth;
    const accessToken = oauth?.accessToken;

    if (!accessToken) {
      debug('invalid file credentials structure');
      return null;
    }

    debug('got credentials from file');
    return { accessToken };
  } catch {
    debug('file credentials not found or invalid');
    return null;
  }
}

// --- Usage API request ---

function makeRequest(accessToken: string): Promise<UsageAPIResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(USAGE_API_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'anthropic-beta': OAUTH_BETA_HEADER,
        'Accept': 'application/json',
        'User-Agent': 'claude-code-cockpit/1.0',
      },
      timeout: REQUEST_TIMEOUT,
    };

    const req = httpsRequest(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data) as UsageAPIResponse;
            resolve(json);
          } catch {
            reject(new UsageAPIError('Invalid JSON response', 'PARSE_ERROR'));
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new UsageAPIError('Authentication failed', 'AUTH_ERROR'));
        } else if (res.statusCode === 429) {
          const retryAfter = parseInt(res.headers['retry-after'] as string, 10);
          const backoffMs = (!isNaN(retryAfter) && retryAfter >= 0)
            ? Math.max(retryAfter * 1000, RATE_LIMIT_MIN_BACKOFF)
            : RATE_LIMIT_DEFAULT_BACKOFF;
          rateLimitUntil = Date.now() + backoffMs;
          debug(`rate limited, backing off for ${backoffMs}ms`);
          reject(new UsageAPIError('Rate limited', 'RATE_LIMIT'));
        } else {
          reject(new UsageAPIError(`HTTP ${res.statusCode}`, 'HTTP_ERROR'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new UsageAPIError(error.message, 'NETWORK_ERROR'));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new UsageAPIError('Request timeout', 'TIMEOUT'));
    });

    req.end();
  });
}

// --- Response parsing ---

function parseResponse(response: UsageAPIResponse): UsageData {
  const fiveHour = sanitizePercent(response.five_hour?.utilization);
  const sevenDay = sanitizePercent(response.seven_day?.utilization);

  return {
    planName: 'Pro',
    fiveHour,
    sevenDay,
    fiveHourResetAt: response.five_hour?.resets_at || null,
    sevenDayResetAt: response.seven_day?.resets_at || null,
  };
}

function sanitizePercent(value: unknown): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

// --- Utilities ---

export function formatResetTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '';

  try {
    const resetTime = new Date(isoTimestamp);
    if (isNaN(resetTime.getTime())) return '';

    const now = new Date();
    const diffMs = resetTime.getTime() - now.getTime();

    if (diffMs <= 0) return 'now';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours >= 1) {
      const remainingMins = diffMins % 60;
      return remainingMins > 0 ? `${diffHours}h${remainingMins}m` : `${diffHours}h`;
    }

    return `${diffMins}m`;
  } catch {
    return '';
  }
}

/** Reset internal state (for testing only). */
export function _resetForTesting(): void {
  cache = null;
  keychainLastFailure = 0;
  rateLimitUntil = 0;
}
