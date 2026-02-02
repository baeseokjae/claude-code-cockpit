/**
 * Token generation speed tracking
 */

import type { StdinData } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('speed-tracker');

export interface TokenSpeed {
  outputTokensPerSecond: number;
  inputTokensPerSecond: number;
  totalTokensPerSecond: number;
}

/**
 * Calculate token generation speed based on session duration
 */
export function calculateTokenSpeed(stdin: StdinData): TokenSpeed | null {
  const usage = stdin.context_window?.current_usage;
  const durationMs = stdin.cost?.total_duration_ms;

  if (!usage || !durationMs || durationMs === 0) {
    debug('insufficient data for speed calculation');
    return null;
  }

  const durationSec = durationMs / 1000;

  const outputTokens = usage.output_tokens || 0;
  const inputTokens = (usage.input_tokens || 0) +
                      (usage.cache_creation_input_tokens || 0) +
                      (usage.cache_read_input_tokens || 0);
  const totalTokens = outputTokens + inputTokens;

  const outputTokensPerSecond = outputTokens / durationSec;
  const inputTokensPerSecond = inputTokens / durationSec;
  const totalTokensPerSecond = totalTokens / durationSec;

  debug(`speed: out=${outputTokensPerSecond.toFixed(1)} in=${inputTokensPerSecond.toFixed(1)} total=${totalTokensPerSecond.toFixed(1)} tok/s`);

  return {
    outputTokensPerSecond,
    inputTokensPerSecond,
    totalTokensPerSecond,
  };
}

/**
 * Format token speed for display
 */
export function formatTokenSpeed(speed: TokenSpeed | null, mode: 'output' | 'input' | 'total' = 'output'): string {
  if (!speed) return '';

  const value = mode === 'output' ? speed.outputTokensPerSecond :
                mode === 'input' ? speed.inputTokensPerSecond :
                speed.totalTokensPerSecond;

  if (value < 1) return '0 tok/s';
  if (value < 10) return `${value.toFixed(1)} tok/s`;
  return `${Math.round(value)} tok/s`;
}
