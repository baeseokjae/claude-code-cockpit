/**
 * time.test.ts
 * 시간 포맷팅 테스트
 */

import { describe, it, expect } from 'vitest';
import { formatSessionDuration } from '../src/data/time.js';

describe('formatSessionDuration', () => {
  it('should format 0ms as 0s', () => {
    expect(formatSessionDuration(0)).toBe('0s');
  });

  it('should format seconds only', () => {
    expect(formatSessionDuration(5000)).toBe('5s');
    expect(formatSessionDuration(59000)).toBe('59s');
  });

  it('should format minutes and seconds', () => {
    expect(formatSessionDuration(60000)).toBe('1m');
    expect(formatSessionDuration(65000)).toBe('1m 5s');
    expect(formatSessionDuration(125000)).toBe('2m 5s');
  });

  it('should format hours and minutes', () => {
    expect(formatSessionDuration(3600000)).toBe('1h');
    expect(formatSessionDuration(3660000)).toBe('1h 1m');
    expect(formatSessionDuration(7265000)).toBe('2h 1m');
  });

  it('should handle large durations', () => {
    // 10 hours
    expect(formatSessionDuration(36000000)).toBe('10h');
    // 24 hours
    expect(formatSessionDuration(86400000)).toBe('24h');
  });

  it('should round down partial seconds', () => {
    expect(formatSessionDuration(5500)).toBe('5s');
    expect(formatSessionDuration(5999)).toBe('5s');
  });
});
