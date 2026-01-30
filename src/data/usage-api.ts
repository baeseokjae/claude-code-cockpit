/**
 * Anthropic Usage API client
 */

import { request as httpsRequest } from 'node:https';
import type { UsageData } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('usage-api');

const USAGE_API_URL = 'https://api.claude.ai/api/usage';

const REQUEST_TIMEOUT = 3000;

interface UsageAPIResponse {
  plan_name?: string;
  five_hour?: {
    usage_percent: number;
    reset_at: string | null;
  };
  seven_day?: {
    usage_percent: number;
    reset_at: string | null;
  };
}

export class UsageAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'UsageAPIError';
  }
}

export async function fetchUsage(sessionKey?: string): Promise<UsageData | null> {
  const key = sessionKey || process.env.CLAUDE_SESSION_KEY;

  if (!key) {
    debug('no session key available, skipping usage fetch');
    return null;
  }

  try {
    const response = await makeRequest(key);
    return parseResponse(response);
  } catch (error) {
    if (error instanceof UsageAPIError) {
      debug(`usage api error [${error.code}]: ${error.message}`);
    } else {
      debug('usage api request failed:', error);
    }
    return null;
  }
}

function makeRequest(sessionKey: string): Promise<UsageAPIResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(USAGE_API_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        Cookie: `sessionKey=${sessionKey}`,
        Accept: 'application/json',
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
  return {
    planName: response.plan_name || 'Unknown',
    fiveHour: response.five_hour?.usage_percent ?? 0,
    sevenDay: response.seven_day?.usage_percent ?? 0,
    fiveHourResetAt: response.five_hour?.reset_at || null,
    sevenDayResetAt: response.seven_day?.reset_at || null,
  };
}

export function formatUsagePercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

export function formatResetTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '';

  try {
    const resetTime = new Date(isoTimestamp);
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
