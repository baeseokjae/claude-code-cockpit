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
  // Opus 4.5/4.6 — $5 input, $6.25 cache write, $0.50 cache read
  'claude-opus-4-6': {
    cacheWrite: 6.25,
    cacheRead: 0.50,
    normalInput: 5.00,
  },
  'claude-opus-4-5': {
    cacheWrite: 6.25,
    cacheRead: 0.50,
    normalInput: 5.00,
  },
  // Opus 4/4.1 — $15 input, $18.75 cache write, $1.50 cache read
  'claude-opus-4-1': {
    cacheWrite: 18.75,
    cacheRead: 1.50,
    normalInput: 15.00,
  },
  'claude-opus-4': {
    cacheWrite: 18.75,
    cacheRead: 1.50,
    normalInput: 15.00,
  },
  // Sonnet 4/4.5 — $3 input, $3.75 cache write, $0.30 cache read
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
  // Sonnet 3.7 (deprecated) — same pricing as Sonnet 4
  'claude-sonnet-3-7': {
    cacheWrite: 3.75,
    cacheRead: 0.30,
    normalInput: 3.00,
  },
  // Haiku 4.5 — $1 input, $1.25 cache write, $0.10 cache read
  'claude-haiku-4-5': {
    cacheWrite: 1.25,
    cacheRead: 0.10,
    normalInput: 1.00,
  },
  // Haiku 4 — same as Haiku 4.5
  'claude-haiku-4': {
    cacheWrite: 1.25,
    cacheRead: 0.10,
    normalInput: 1.00,
  },
  // Haiku 3.5 — $0.80 input, $1.00 cache write, $0.08 cache read
  'claude-haiku-3-5': {
    cacheWrite: 1.00,
    cacheRead: 0.08,
    normalInput: 0.80,
  },
  // Haiku 3 — $0.25 input, $0.30 cache write, $0.03 cache read
  'claude-haiku-3': {
    cacheWrite: 0.30,
    cacheRead: 0.03,
    normalInput: 0.25,
  },
  // Default fallback (Sonnet-tier pricing)
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
