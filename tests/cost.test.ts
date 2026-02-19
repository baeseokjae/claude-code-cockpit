/**
 * cost.test.ts
 * 비용 계산 테스트
 */

import { describe, it, expect } from 'vitest';
import { calculateCost, formatCost, formatCostShort, getShortModelName } from '../src/data/cost.js';

describe('calculateCost', () => {
  it('should calculate cost for Opus 4.5', () => {
    const result = calculateCost('claude-opus-4-5-20251101', 1000000, 100000);
    // Input: 1M tokens * $5/M = $5
    // Output: 100K tokens * $25/M = $2.5
    expect(result.estimatedCost).toBe(7.5);
    expect(result.pricePerInputMToken).toBe(5.0);
    expect(result.pricePerOutputMToken).toBe(25.0);
  });

  it('should calculate cost for Sonnet 4', () => {
    const result = calculateCost('claude-sonnet-4-20250514', 1000000, 100000);
    // Input: 1M tokens * $3/M = $3
    // Output: 100K tokens * $15/M = $1.5
    expect(result.estimatedCost).toBe(4.5);
  });

  it('should calculate cost for Sonnet 4.6', () => {
    const result = calculateCost('claude-sonnet-4-6', 1000000, 100000);
    // Input: 1M tokens * $3/M = $3
    // Output: 100K tokens * $15/M = $1.5
    expect(result.estimatedCost).toBe(4.5);
    expect(result.pricePerInputMToken).toBe(3.0);
    expect(result.pricePerOutputMToken).toBe(15.0);
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

describe('new model pricing', () => {
  it('should calculate cost for Opus 4.6', () => {
    const result = calculateCost('claude-opus-4-6-20250610', 1000000, 100000);
    expect(result.pricePerInputMToken).toBe(5.0);
    expect(result.pricePerOutputMToken).toBe(25.0);
    expect(result.estimatedCost).toBe(7.5);
  });

  it('should calculate cost for Sonnet 4.5', () => {
    const result = calculateCost('claude-sonnet-4-5-20250929', 1000000, 100000);
    expect(result.pricePerInputMToken).toBe(3.0);
    expect(result.pricePerOutputMToken).toBe(15.0);
    expect(result.estimatedCost).toBe(4.5);
  });

  it('should calculate cost for Haiku 4.5', () => {
    const result = calculateCost('claude-haiku-4-5-20251001', 1000000, 100000);
    expect(result.pricePerInputMToken).toBe(1.0);
    expect(result.pricePerOutputMToken).toBe(5.0);
    expect(result.estimatedCost).toBe(1.5);
  });

  it('should match opus-4.6 pattern', () => {
    const result = calculateCost('some-opus-4.6-model', 1000000, 0);
    expect(result.pricePerInputMToken).toBe(5.0);
  });

  it('should calculate cost for Sonnet 4.6', () => {
    const result = calculateCost('claude-sonnet-4-6', 1000000, 100000);
    expect(result.pricePerInputMToken).toBe(3.0);
    expect(result.pricePerOutputMToken).toBe(15.0);
    expect(result.estimatedCost).toBe(4.5);
  });

  it('should match sonnet-4.6 pattern', () => {
    const result = calculateCost('some-sonnet-4.6-model', 1000000, 0);
    expect(result.pricePerInputMToken).toBe(3.0);
  });

  it('should match sonnet-4.5 pattern', () => {
    const result = calculateCost('some-sonnet-4.5-model', 1000000, 0);
    expect(result.pricePerInputMToken).toBe(3.0);
  });

  it('should match haiku-4.5 pattern', () => {
    const result = calculateCost('some-haiku-4.5-model', 1000000, 0);
    expect(result.pricePerInputMToken).toBe(1.0);
  });

  it('should NOT return Sonnet 4 pricing for 3-sonnet', () => {
    // This was the C1 bug - '3-sonnet' was incorrectly matching Sonnet 4
    const result = calculateCost('claude-3-sonnet-something', 1000000, 0);
    expect(result.pricePerInputMToken).toBe(3.0); // Sonnet 3 pricing
    expect(result.pricePerOutputMToken).toBe(15.0); // Sonnet 3 pricing
  });
});

describe('new model short names', () => {
  it('should return opus-4.6 for Opus 4.6', () => {
    expect(getShortModelName('claude-opus-4-6-20250610')).toBe('opus-4.6');
  });

  it('should return sonnet-4.5 for Sonnet 4.5', () => {
    expect(getShortModelName('claude-sonnet-4-5-20250929')).toBe('sonnet-4.5');
  });

  it('should return sonnet-4.6 for Sonnet 4.6', () => {
    expect(getShortModelName('claude-sonnet-4-6')).toBe('sonnet-4.6');
  });

  it('should return haiku-4.5 for Haiku 4.5', () => {
    expect(getShortModelName('claude-haiku-4-5-20251001')).toBe('haiku-4.5');
  });
});
