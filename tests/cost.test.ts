/**
 * cost.test.ts
 * 비용 계산 테스트
 */

import { describe, it, expect } from 'vitest';
import { calculateCost, formatCost, formatCostShort, getShortModelName } from '../src/data/cost.js';

describe('calculateCost', () => {
  it('should calculate cost for Opus 4.5', () => {
    const result = calculateCost('claude-opus-4-5-20251101', 1000000, 100000);
    // Input: 1M tokens * $15/M = $15
    // Output: 100K tokens * $75/M = $7.5
    expect(result.estimatedCost).toBe(22.5);
    expect(result.pricePerInputMToken).toBe(15.0);
    expect(result.pricePerOutputMToken).toBe(75.0);
  });

  it('should calculate cost for Sonnet 4', () => {
    const result = calculateCost('claude-sonnet-4-20250514', 1000000, 100000);
    // Input: 1M tokens * $3/M = $3
    // Output: 100K tokens * $15/M = $1.5
    expect(result.estimatedCost).toBe(4.5);
  });

  it('should calculate cost for Haiku 3.5', () => {
    const result = calculateCost('claude-3-5-haiku-20241022', 1000000, 100000);
    // Input: 1M tokens * $0.8/M = $0.8
    // Output: 100K tokens * $4/M = $0.4
    expect(result.estimatedCost).toBeCloseTo(1.2, 2);
  });

  it('should handle partial model names', () => {
    const result = calculateCost('opus', 1000000, 0);
    expect(result.pricePerInputMToken).toBe(15.0);
  });

  it('should use default pricing for unknown models', () => {
    const result = calculateCost('unknown-model-xyz', 1000000, 100000);
    // Default: $3 input, $15 output
    expect(result.estimatedCost).toBe(4.5);
  });
});

describe('formatCost', () => {
  it('should format small costs with 4 decimals', () => {
    expect(formatCost(0.0001)).toBe('$0.0001');
    expect(formatCost(0.0099)).toBe('$0.0099');
  });

  it('should format medium costs with 3 decimals', () => {
    expect(formatCost(0.01)).toBe('$0.010');
    expect(formatCost(0.123)).toBe('$0.123');
    expect(formatCost(0.999)).toBe('$0.999');
  });

  it('should format large costs with 2 decimals', () => {
    expect(formatCost(1.0)).toBe('$1.00');
    expect(formatCost(10.5)).toBe('$10.50');
    expect(formatCost(100.99)).toBe('$100.99');
  });
});

describe('formatCostShort', () => {
  it('should format tiny costs as <1¢', () => {
    expect(formatCostShort(0.001)).toBe('<1¢');
    expect(formatCostShort(0.009)).toBe('<1¢');
  });

  it('should format cents', () => {
    expect(formatCostShort(0.01)).toBe('1¢');
    expect(formatCostShort(0.10)).toBe('10¢');
    expect(formatCostShort(0.99)).toBe('99¢');
  });

  it('should format dollars', () => {
    expect(formatCostShort(1.0)).toBe('$1.00');
    expect(formatCostShort(10.5)).toBe('$10.50');
  });
});

describe('getShortModelName', () => {
  it('should extract short names', () => {
    expect(getShortModelName('claude-opus-4-5-20251101')).toBe('opus-4.5');
    expect(getShortModelName('claude-opus-4-20250514')).toBe('opus-4');
    expect(getShortModelName('claude-sonnet-4-20250514')).toBe('sonnet-4');
    expect(getShortModelName('claude-3-5-sonnet-20241022')).toBe('sonnet-3.5');
    expect(getShortModelName('claude-3-5-haiku-20241022')).toBe('haiku-3.5');
  });

  it('should handle generic names', () => {
    expect(getShortModelName('opus')).toBe('opus');
    expect(getShortModelName('sonnet')).toBe('sonnet');
    expect(getShortModelName('haiku')).toBe('haiku');
  });

  it('should return first part for unknown models', () => {
    expect(getShortModelName('unknown-model')).toBe('unknown');
  });
});
