/**
 * Cache metrics tests
 */

import { describe, it, expect } from 'vitest';
import { calculateCacheMetrics, formatCacheHitRate, formatCacheSavings, formatCacheMetricsCompact } from '../src/data/cache-metrics.js';
import type { StdinData } from '../src/types/index.js';

describe('calculateCacheMetrics', () => {
  it('should calculate cache metrics with both creation and read tokens', () => {
    const stdin: StdinData = {
      model: {
        id: 'claude-sonnet-4-5-20250929',
      },
      context_window: {
        current_usage: {
          input_tokens: 0,
          cache_creation_input_tokens: 10000,
          cache_read_input_tokens: 40000,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);

    expect(result).not.toBeNull();
    expect(result?.cacheCreationTokens).toBe(10000);
    expect(result?.cacheReadTokens).toBe(40000);
    expect(result?.totalCacheTokens).toBe(50000);
    // 40000 / (0 + 10000 + 40000) = 80%
    expect(result?.cacheHitRate).toBe(80);
    expect(result?.estimatedSavings).toBeCloseTo(0.108, 3);
  });

  it('should return null when no usage data', () => {
    const stdin: StdinData = {};
    const result = calculateCacheMetrics(stdin);
    expect(result).toBeNull();
  });

  it('should return null when no cache tokens', () => {
    const stdin: StdinData = {
      context_window: {
        current_usage: {
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);
    expect(result).toBeNull();
  });

  it('should handle only cache read tokens', () => {
    const stdin: StdinData = {
      model: {
        id: 'claude-sonnet-4-5',
      },
      context_window: {
        current_usage: {
          input_tokens: 0,
          cache_read_input_tokens: 100000,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);

    expect(result).not.toBeNull();
    expect(result?.cacheReadTokens).toBe(100000);
    expect(result?.totalCacheTokens).toBe(100000);
    // 100000 / (0 + 0 + 100000) = 100%
    expect(result?.cacheHitRate).toBe(100);
  });

  it('should use default pricing for unknown model', () => {
    const stdin: StdinData = {
      model: {
        id: 'unknown-model',
      },
      context_window: {
        current_usage: {
          input_tokens: 0,
          cache_read_input_tokens: 100000,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);
    expect(result).not.toBeNull();
    expect(result?.estimatedSavings).toBeGreaterThan(0);
  });

  it('should use opus pricing for opus model', () => {
    const stdin: StdinData = {
      model: {
        id: 'claude-opus-4',
      },
      context_window: {
        current_usage: {
          input_tokens: 0,
          cache_read_input_tokens: 100000,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);

    expect(result).not.toBeNull();
    // Opus pricing: 15.00 - 1.50 = 13.50 per 1M tokens
    // 100k tokens = 0.1M * 13.50 = 1.35
    expect(result?.estimatedSavings).toBeCloseTo(1.35, 2);
  });

  it('should use haiku pricing for haiku model', () => {
    const stdin: StdinData = {
      model: {
        id: 'claude-haiku-4',
      },
      context_window: {
        current_usage: {
          input_tokens: 0,
          cache_read_input_tokens: 100000,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);

    expect(result).not.toBeNull();
    // Haiku pricing: 1.00 - 0.10 = 0.90 per 1M tokens
    // 100k tokens = 0.1M * 0.90 = 0.09
    expect(result?.estimatedSavings).toBeCloseTo(0.09, 2);
  });

  it('should calculate hit rate against total input tokens including non-cached', () => {
    const stdin: StdinData = {
      model: {
        id: 'claude-sonnet-4-5',
      },
      context_window: {
        current_usage: {
          input_tokens: 50000,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 100000,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);

    expect(result).not.toBeNull();
    // 100000 / (50000 + 0 + 100000) = 66.67%
    expect(result?.cacheHitRate).toBeCloseTo(66.67, 1);
  });

  it('should handle mixed input with creation and read tokens', () => {
    const stdin: StdinData = {
      model: {
        id: 'claude-sonnet-4-5',
      },
      context_window: {
        current_usage: {
          input_tokens: 20000,
          cache_creation_input_tokens: 5000,
          cache_read_input_tokens: 75000,
        },
      },
    };

    const result = calculateCacheMetrics(stdin);

    expect(result).not.toBeNull();
    // 75000 / (20000 + 5000 + 75000) = 75%
    expect(result?.cacheHitRate).toBe(75);
  });
});

describe('formatCacheHitRate', () => {
  it('should format hit rate as percentage', () => {
    const metrics = {
      cacheCreationTokens: 10000,
      cacheReadTokens: 40000,
      totalCacheTokens: 50000,
      cacheHitRate: 80,
      estimatedSavings: 0.108,
    };

    const result = formatCacheHitRate(metrics);
    expect(result).toBe('80%');
  });

  it('should round hit rate', () => {
    const metrics = {
      cacheCreationTokens: 10000,
      cacheReadTokens: 35000,
      totalCacheTokens: 45000,
      cacheHitRate: 77.777,
      estimatedSavings: 0.1,
    };

    const result = formatCacheHitRate(metrics);
    expect(result).toBe('78%');
  });

  it('should handle 100% hit rate', () => {
    const metrics = {
      cacheCreationTokens: 0,
      cacheReadTokens: 50000,
      totalCacheTokens: 50000,
      cacheHitRate: 100,
      estimatedSavings: 0.135,
    };

    const result = formatCacheHitRate(metrics);
    expect(result).toBe('100%');
  });
});

describe('formatCacheSavings', () => {
  it('should format savings as currency', () => {
    const metrics = {
      cacheCreationTokens: 10000,
      cacheReadTokens: 40000,
      totalCacheTokens: 50000,
      cacheHitRate: 80,
      estimatedSavings: 0.42,
    };

    const result = formatCacheSavings(metrics);
    expect(result).toBe('$0.42');
  });

  it('should handle small savings', () => {
    const metrics = {
      cacheCreationTokens: 1000,
      cacheReadTokens: 4000,
      totalCacheTokens: 5000,
      cacheHitRate: 80,
      estimatedSavings: 0.005,
    };

    const result = formatCacheSavings(metrics);
    expect(result).toBe('<$0.01');
  });

  it('should handle large savings', () => {
    const metrics = {
      cacheCreationTokens: 100000,
      cacheReadTokens: 400000,
      totalCacheTokens: 500000,
      cacheHitRate: 80,
      estimatedSavings: 10.8,
    };

    const result = formatCacheSavings(metrics);
    expect(result).toBe('$10.80');
  });
});

describe('formatCacheMetricsCompact', () => {
  it('should format both hit rate and savings', () => {
    const metrics = {
      cacheCreationTokens: 10000,
      cacheReadTokens: 40000,
      totalCacheTokens: 50000,
      cacheHitRate: 80,
      estimatedSavings: 0.42,
    };

    const result = formatCacheMetricsCompact(metrics);
    expect(result).toBe('80% ~$0.42');
  });
});
