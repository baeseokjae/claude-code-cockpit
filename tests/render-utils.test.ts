/**
 * render-utils.test.ts
 * 렌더링 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import { createProgressBar, formatPercent, truncate } from '../src/render/utils.js';

describe('createProgressBar', () => {
  it('should create empty bar at 0%', () => {
    expect(createProgressBar(0, 10, '█', '░')).toBe('░░░░░░░░░░');
  });

  it('should create full bar at 100%', () => {
    expect(createProgressBar(100, 10, '█', '░')).toBe('██████████');
  });

  it('should create partial bar at 50%', () => {
    expect(createProgressBar(50, 10, '█', '░')).toBe('█████░░░░░');
  });

  it('should handle different widths', () => {
    expect(createProgressBar(50, 4, '█', '░')).toBe('██░░');
    expect(createProgressBar(50, 20, '█', '░')).toBe('██████████░░░░░░░░░░');
  });

  it('should handle custom characters', () => {
    expect(createProgressBar(30, 10, '▰', '▱')).toBe('▰▰▰▱▱▱▱▱▱▱');
  });

  it('should clamp values above 100', () => {
    expect(createProgressBar(150, 10, '█', '░')).toBe('██████████');
  });

  it('should clamp negative values to 0', () => {
    expect(createProgressBar(-10, 10, '█', '░')).toBe('░░░░░░░░░░');
  });
});

describe('formatPercent', () => {
  it('should format whole numbers', () => {
    expect(formatPercent(50)).toBe('50%');
    expect(formatPercent(100)).toBe('100%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('should round decimals', () => {
    expect(formatPercent(50.4)).toBe('50%');
    expect(formatPercent(50.5)).toBe('51%');
    expect(formatPercent(99.9)).toBe('100%');
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('should truncate long strings with ellipsis', () => {
    // truncate uses '…' (single char) by default
    expect(truncate('hello world', 8)).toBe('hello w…');
    expect(truncate('hello world', 6)).toBe('hello…');
  });

  it('should handle edge cases', () => {
    expect(truncate('', 10)).toBe('');
    expect(truncate('hi', 2)).toBe('hi');
    expect(truncate('hello', 3)).toBe('he…');
  });
});
