/**
 * cost.test.ts
 * 비용 계산 테스트
 */

import { describe, it, expect } from 'vitest';
import { getShortModelName } from '../src/data/models.js';

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
