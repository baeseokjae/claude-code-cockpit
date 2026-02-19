/**
 * Calculate cache metrics from stdin context window data
 */
import type { StdinData, CacheMetrics } from '../types/index.js';
import { createDebug } from '../utils/debug.js';
import { getModelInfo } from './models.js';

const debug = createDebug('cache-metrics');

export function calculateCacheMetrics(stdin: StdinData): CacheMetrics | null {
  try {
    const usage = stdin.context_window?.current_usage;
    if (!usage) {
      debug('no usage data available');
      return null;
    }

    const inputTokens = usage.input_tokens || 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
    const cacheReadTokens = usage.cache_read_input_tokens || 0;
    const totalCacheTokens = cacheCreationTokens + cacheReadTokens;
    const totalInputTokens = inputTokens + cacheCreationTokens + cacheReadTokens;

    if (totalCacheTokens === 0) {
      debug('no cache tokens');
      return null;
    }

    // Cache hit rate: percentage of total input that came from cache reads
    const cacheHitRate = totalInputTokens > 0 ? (cacheReadTokens / totalInputTokens) * 100 : 0;

    const pricing = getModelInfo(stdin.model?.id || '');
    const normalCost = (cacheReadTokens / 1_000_000) * pricing.input;
    const cacheCost = (cacheReadTokens / 1_000_000) * pricing.cacheRead;
    const estimatedSavings = normalCost - cacheCost;

    debug(`cache metrics: hit rate ${cacheHitRate.toFixed(1)}% (${cacheReadTokens}/${totalInputTokens}), savings $${estimatedSavings.toFixed(2)}`);

    return {
      cacheCreationTokens,
      cacheReadTokens,
      totalCacheTokens,
      cacheHitRate,
      estimatedSavings,
    };
  } catch (error) {
    debug('failed to calculate cache metrics:', error);
    return null;
  }
}

export function formatCacheHitRate(metrics: CacheMetrics): string {
  return `${Math.round(metrics.cacheHitRate)}%`;
}

export function formatCacheSavings(metrics: CacheMetrics): string {
  if (metrics.estimatedSavings < 0.01) {
    return '<$0.01';
  }
  return `$${metrics.estimatedSavings.toFixed(2)}`;
}

export function formatCacheMetricsCompact(metrics: CacheMetrics): string {
  return `${formatCacheHitRate(metrics)} ~${formatCacheSavings(metrics)}`;
}
