/**
 * speed-tracker.test.ts
 * Token speed calculation tests
 */

import { describe, it, expect } from 'vitest';
import { calculateTokenSpeed, formatTokenSpeed } from '../src/data/speed-tracker.js';
import type { StdinData } from '../src/types/index.js';

function createStdinData(overrides: Partial<StdinData> = {}): StdinData {
  return {
    context_window: {
      current_usage: {
        input_tokens: 10000,
        output_tokens: 5000,
        cache_creation_input_tokens: 1000,
        cache_read_input_tokens: 2000,
      },
      ...overrides.context_window,
    },
    cost: {
      total_duration_ms: 10000,
      ...overrides.cost,
    },
    ...overrides,
  } as StdinData;
}

describe('calculateTokenSpeed', () => {
  it('should calculate correct speeds with valid data', () => {
    const stdin = createStdinData();
    const result = calculateTokenSpeed(stdin);

    expect(result).not.toBeNull();
    expect(result!.outputTokensPerSecond).toBe(500); // 5000/10s
    expect(result!.inputTokensPerSecond).toBe(1300); // (10000+1000+2000)/10s
    expect(result!.totalTokensPerSecond).toBe(1800); // 18000/10s
  });

  it('should return null with no usage data', () => {
    const stdin = { context_window: {}, cost: { total_duration_ms: 10000 } } as StdinData;
    const result = calculateTokenSpeed(stdin);
    expect(result).toBeNull();
  });

  it('should return null with 0 duration', () => {
    const stdin = createStdinData({ cost: { total_duration_ms: 0 } } as any);
    const result = calculateTokenSpeed(stdin);
    expect(result).toBeNull();
  });

  it('should return null with no duration', () => {
    const stdin = createStdinData({ cost: {} } as any);
    const result = calculateTokenSpeed(stdin);
    expect(result).toBeNull();
  });

  it('should use fallbackDurationMs when no cost duration', () => {
    const stdin = createStdinData({ cost: {} } as any);
    const result = calculateTokenSpeed(stdin, 5000);

    expect(result).not.toBeNull();
    expect(result!.outputTokensPerSecond).toBe(1000); // 5000/5s
  });

  it('should prefer total_duration_ms over fallback', () => {
    const stdin = createStdinData();
    const result = calculateTokenSpeed(stdin, 5000);

    expect(result).not.toBeNull();
    // Should use total_duration_ms=10000, not fallback=5000
    expect(result!.outputTokensPerSecond).toBe(500);
  });

  it('should use total_api_duration_ms as second priority', () => {
    const stdin = createStdinData({ cost: { total_api_duration_ms: 8000 } } as any);
    const result = calculateTokenSpeed(stdin);

    expect(result).not.toBeNull();
    expect(result!.outputTokensPerSecond).toBeCloseTo(625, 0); // 5000/8s
  });

  it('should handle zero output tokens', () => {
    const stdin = createStdinData();
    stdin.context_window!.current_usage!.output_tokens = 0;
    const result = calculateTokenSpeed(stdin);

    expect(result).not.toBeNull();
    expect(result!.outputTokensPerSecond).toBe(0);
  });
});

describe('formatTokenSpeed', () => {
  it('should return empty string for null', () => {
    expect(formatTokenSpeed(null)).toBe('');
  });

  it('should format output mode by default', () => {
    const speed = { outputTokensPerSecond: 50, inputTokensPerSecond: 100, totalTokensPerSecond: 150 };
    expect(formatTokenSpeed(speed)).toBe('50 tok/s');
  });

  it('should format input mode', () => {
    const speed = { outputTokensPerSecond: 50, inputTokensPerSecond: 100, totalTokensPerSecond: 150 };
    expect(formatTokenSpeed(speed, 'input')).toBe('100 tok/s');
  });

  it('should format total mode', () => {
    const speed = { outputTokensPerSecond: 50, inputTokensPerSecond: 100, totalTokensPerSecond: 150 };
    expect(formatTokenSpeed(speed, 'total')).toBe('150 tok/s');
  });

  it('should return "0 tok/s" for values less than 1', () => {
    const speed = { outputTokensPerSecond: 0.5, inputTokensPerSecond: 0, totalTokensPerSecond: 0.5 };
    expect(formatTokenSpeed(speed)).toBe('0 tok/s');
  });

  it('should format single digit with decimal', () => {
    const speed = { outputTokensPerSecond: 5.5, inputTokensPerSecond: 0, totalTokensPerSecond: 5.5 };
    expect(formatTokenSpeed(speed)).toBe('5.5 tok/s');
  });
});
