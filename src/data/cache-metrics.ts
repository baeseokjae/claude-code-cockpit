/**
 * Calculate cache metrics from stdin context window data
 */

import type { StdinData, CacheMetrics } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('cache-metrics');

interface CachePricing {
  cacheWrite: number;
  cacheRead: number;
  normalInput: number;
}

const MODEL_PRICING: Record<string, CachePricing> = {
  'claude-sonnet-4-5': {
    cacheWrite: 3.75,
    cacheRead: 0.30,
    normalInput: 3.00,
  },
  'claude-sonnet-4': {
    cacheWrite: 3.75,
    cacheRead: 0.30,
    normalInput: 3.00,
  },
  'claude-opus-4': {
    cacheWrite: 18.75,
    cacheRead: 1.50,
    normalInput: 15.00,
  },
  'claude-haiku-4': {
    cacheWrite: 1.25,
    cacheRead: 0.10,
    normalInput: 1.00,
  },
  default: {
    cacheWrite: 3.75,
    cacheRead: 0.30,
    normalInput: 3.00,
  },
};

function getPricing(stdin: StdinData): CachePricing {
  const modelId = stdin.model?.id;
  if (!modelId) return MODEL_PRICING.default;

  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelId.includes(key)) {
      return pricing;
    }
  }

  return MODEL_PRICING.default;
}

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

    const pricing = getPricing(stdin);

    const normalCost = (cacheReadTokens / 1_000_000) * pricing.normalInput;
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
