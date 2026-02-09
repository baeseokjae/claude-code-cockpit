/**
 * Tests for getTier() function
 */

import { describe, it, expect } from 'vitest';
import { getTier } from '../src/index.js';

describe('getTier', () => {
  const layout = { compactWidth: 80, fullWidth: 120 };

  it('should return tier 1 for narrow terminals (< compactWidth)', () => {
    expect(getTier(60, layout)).toBe(1);
    expect(getTier(79, layout)).toBe(1);
    expect(getTier(40, layout)).toBe(1);
  });

  it('should return tier 2 for medium terminals (>= compactWidth, < fullWidth)', () => {
    expect(getTier(80, layout)).toBe(2);
    expect(getTier(100, layout)).toBe(2);
    expect(getTier(119, layout)).toBe(2);
  });

  it('should return tier 3 for wide terminals (>= fullWidth)', () => {
    expect(getTier(120, layout)).toBe(3);
    expect(getTier(200, layout)).toBe(3);
    expect(getTier(300, layout)).toBe(3);
  });

  it('should work with different theme layouts', () => {
    const zenLayout = { compactWidth: 50, fullWidth: 80 };
    expect(getTier(40, zenLayout)).toBe(1);
    expect(getTier(60, zenLayout)).toBe(2);
    expect(getTier(100, zenLayout)).toBe(3);

    const monoLayout = { compactWidth: 60, fullWidth: 100 };
    expect(getTier(50, monoLayout)).toBe(1);
    expect(getTier(80, monoLayout)).toBe(2);
    expect(getTier(100, monoLayout)).toBe(3);
  });
});
