/**
 * Anthropic Usage API client
 * OAuth token from macOS Keychain or ~/.claude/.credentials.json
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { request as httpsRequest } from 'node:https';
import type { UsageData } from '../types/index.js';
import { createDebug } from '../utils/debug.js';
import { getClaudeConfigDir } from '../utils/paths.js';

const debug = createDebug('usage-api');

const USAGE_API_URL = 'https://api.anthropic.com/api/oauth/usage';
const KEYCHAIN_SERVICE = 'Claude Code-credentials';
const CREDENTIALS_FILENAME = '.credentials.json';

const REQUEST_TIMEOUT = 5000;
const CACHE_TTL_SUCCESS = 60000;
const CACHE_TTL_FAILURE = 15000;
const KEYCHAIN_BACKOFF_MS = 60000;

interface Credentials {
  accessToken: string;
  expiresAt: number;
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

let cache: CacheEntry | null = null;
let keychainLastFailure = 0;

export class UsageAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'UsageAPIError';
  }
}

export async function fetchUsage(): Promise<UsageData | null> {
  if (cache) {
    const ttl = cache.success ? CACHE_TTL_SUCCESS : CACHE_TTL_FAILURE;
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

    if (credentials.expiresAt <= Date.now()) {
      debug('credentials expired');
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
    cacheResult(null, false);
    return null;
  }
}

function cacheResult(data: UsageData | null, success: boolean): void {
  cache = { data, timestamp: Date.now(), success };
}

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

    const parsed = JSON.parse(trimmed) as { claudeAiOauth?: { accessToken?: string; expiresAt?: number } };
    const accessToken = parsed.claudeAiOauth?.accessToken;
    const expiresAt = parsed.claudeAiOauth?.expiresAt;

    if (!accessToken || typeof expiresAt !== 'number') {
      debug('invalid keychain credentials structure');
      keychainLastFailure = Date.now();
      return null;
    }

    debug('got credentials from keychain');
    return { accessToken, expiresAt };
  } catch (error) {
    debug('keychain read failed');
    keychainLastFailure = Date.now();
    return null;
  }
}

function readFileCredentials(): Credentials | null {
  try {
    // Start with .claude directory (respects CLAUDE_CONFIG_DIR)
    const claudeDir = getClaudeConfigDir();
    
    // Resolve .claude directory if it's a symlink
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
    
    // Also resolve the credentials file itself if it's a symlink
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
    const parsed = JSON.parse(content) as { claudeAiOauth?: { accessToken?: string; expiresAt?: number } };
    const accessToken = parsed.claudeAiOauth?.accessToken;
    const expiresAt = parsed.claudeAiOauth?.expiresAt;

    if (!accessToken || typeof expiresAt !== 'number') {
      debug('invalid file credentials structure');
      return null;
    }

    debug('got credentials from file');
    return { accessToken, expiresAt };
  } catch {
    debug('file credentials not found or invalid');
    return null;
  }
}

function makeRequest(accessToken: string): Promise<UsageAPIResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(USAGE_API_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'anthropic-beta': 'oauth-2025-04-20',
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

export function formatUsagePercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

export function formatResetTime(isoTimestamp: string | null, mode: 'full' | 'compact' = 'full'): string {
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
      if (mode === 'compact') {
        return `${diffHours}h`;
      }
      const remainingMins = diffMins % 60;
      return remainingMins > 0 ? `${diffHours}h${remainingMins}m` : `${diffHours}h`;
    }

    return `${diffMins}m`;
  } catch {
    return '';
  }
}
