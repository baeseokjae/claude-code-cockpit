/**
 * models.test.ts - 통합 모델 레지스트리 테스트
 */
import { describe, it, expect } from 'vitest';
import { getModelInfo, getShortModelName } from '../src/data/models.js';

describe('getModelInfo', () => {
  it('exact prefix match for claude-opus-4-6', () => {
    const info = getModelInfo('claude-opus-4-6-20250610');
    expect(info.input).toBe(5.0);
    expect(info.output).toBe(25.0);
    expect(info.cacheWrite).toBe(6.25);
    expect(info.cacheRead).toBe(0.50);
    expect(info.shortName).toBe('opus-4.6');
  });

  it('prefix match for claude-sonnet-4-6', () => {
    const info = getModelInfo('claude-sonnet-4-6');
    expect(info.input).toBe(3.0);
    expect(info.output).toBe(15.0);
    expect(info.shortName).toBe('sonnet-4.6');
  });

  it('prefix match for claude-haiku-4-5', () => {
    const info = getModelInfo('claude-haiku-4-5-20251001');
    expect(info.input).toBe(1.0);
    expect(info.output).toBe(5.0);
    expect(info.shortName).toBe('haiku-4.5');
  });

  it('prefix match for claude-3-5-sonnet', () => {
    const info = getModelInfo('claude-3-5-sonnet-20241022');
    expect(info.input).toBe(3.0);
    expect(info.shortName).toBe('sonnet-3.5');
  });

  it('generic fallback for unknown model uses default pricing', () => {
    const info = getModelInfo('unknown-model-xyz');
    expect(info.input).toBe(3.0);
    expect(info.output).toBe(15.0);
  });

  it('generic sonnet fallback', () => {
    const info = getModelInfo('some-sonnet-model');
    expect(info.input).toBe(3.0);
  });

  it('generic opus fallback uses claude-3-opus pricing (15.0)', () => {
    const info = getModelInfo('some-opus-model');
    expect(info.input).toBe(15.0);
  });
});

describe('getShortModelName', () => {
  it('returns shortName for known model', () => {
    expect(getShortModelName('claude-opus-4-6-20250610')).toBe('opus-4.6');
    expect(getShortModelName('claude-sonnet-4-6')).toBe('sonnet-4.6');
    expect(getShortModelName('claude-haiku-4-5-20251001')).toBe('haiku-4.5');
  });

  it('returns shortName for claude-3-5-haiku', () => {
    expect(getShortModelName('claude-3-5-haiku-20241022')).toBe('haiku-3.5');
  });

  it('returns first segment for unrecognized model', () => {
    expect(getShortModelName('unknown-model')).toBe('unknown');
  });

  it('returns bare keyword for bare opus/sonnet/haiku', () => {
    expect(getShortModelName('opus')).toBe('opus');
    expect(getShortModelName('sonnet')).toBe('sonnet');
    expect(getShortModelName('haiku')).toBe('haiku');
  });
});
