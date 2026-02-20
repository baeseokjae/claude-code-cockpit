/**
 * collector.test.ts
 * Feature Collector 단위 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { collectFeatures, _isEnabled } from '../../src/features/collector.js';
import type { FeatureDef, CollectEnv } from '../../src/features/types.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';

function makeEnv(overrides: Partial<CollectEnv> = {}): CollectEnv {
  return {
    stdin: {} as any,
    transcript: { tools: [], agents: [], todos: [], skills: [] } as any,
    config: DEFAULT_CONFIG,
    cwd: '/test',
    tier: 2,
    isDetailed: false,
    durationMs: undefined,
    deps: {} as any,
    ...overrides,
  };
}

describe('isEnabled', () => {
  it('configFlag=false → disabled', () => {
    const feature: FeatureDef = {
      key: 'test',
      configFlag: 'showUsage',
      collect: () => null,
    };
    const env = makeEnv({
      config: { ...DEFAULT_CONFIG, display: { ...DEFAULT_CONFIG.display, showUsage: false } },
    });
    expect(_isEnabled(feature, env)).toBe(false);
  });

  it('configFlag=true → enabled', () => {
    const feature: FeatureDef = {
      key: 'test',
      configFlag: 'showUsage',
      collect: () => null,
    };
    const env = makeEnv({
      config: { ...DEFAULT_CONFIG, display: { ...DEFAULT_CONFIG.display, showUsage: true } },
    });
    expect(_isEnabled(feature, env)).toBe(true);
  });

  it('minTier=2, tier=1 → disabled', () => {
    const feature: FeatureDef = { key: 'test', minTier: 2, collect: () => null };
    expect(_isEnabled(feature, makeEnv({ tier: 1 }))).toBe(false);
  });

  it('minTier=2, tier=2 → enabled', () => {
    const feature: FeatureDef = { key: 'test', minTier: 2, collect: () => null };
    expect(_isEnabled(feature, makeEnv({ tier: 2 }))).toBe(true);
  });

  it('requireDetailed=true, isDetailed=false → disabled', () => {
    const feature: FeatureDef = { key: 'test', requireDetailed: true, collect: () => null };
    expect(_isEnabled(feature, makeEnv({ isDetailed: false }))).toBe(false);
  });

  it('requireDetailed=true, isDetailed=true → enabled', () => {
    const feature: FeatureDef = { key: 'test', requireDetailed: true, collect: () => null };
    expect(_isEnabled(feature, makeEnv({ isDetailed: true }))).toBe(true);
  });

  it('조건 없음 → enabled', () => {
    const feature: FeatureDef = { key: 'test', collect: () => null };
    expect(_isEnabled(feature, makeEnv())).toBe(true);
  });
});

describe('collectFeatures', () => {
  it('disabled feature는 disabledDefault 또는 null 반환', async () => {
    const feature: FeatureDef = {
      key: 'foo',
      minTier: 3,
      disabledDefault: { empty: true },
      collect: () => 'should not be called',
    };
    const results = await collectFeatures([feature], makeEnv({ tier: 1 }));
    expect(results['foo']).toEqual({ empty: true });
  });

  it('disabledDefault 없이 disabled → null 반환', async () => {
    const feature: FeatureDef = {
      key: 'bar',
      minTier: 3,
      collect: () => 'should not be called',
    };
    const results = await collectFeatures([feature], makeEnv({ tier: 1 }));
    expect(results['bar']).toBeNull();
  });

  it('phase 1 features 병렬 실행 (모두 resolve)', async () => {
    const order: string[] = [];
    const features: FeatureDef[] = [
      { key: 'a', collect: async () => { order.push('a'); return 'A'; } },
      { key: 'b', collect: async () => { order.push('b'); return 'B'; } },
      { key: 'c', collect: async () => { order.push('c'); return 'C'; } },
    ];
    const results = await collectFeatures(features, makeEnv());
    expect(results['a']).toBe('A');
    expect(results['b']).toBe('B');
    expect(results['c']).toBe('C');
    expect(order).toHaveLength(3);
  });

  it('phase 2 features는 phase 1 결과에 접근 가능', async () => {
    const features: FeatureDef[] = [
      { key: 'first', collect: async () => 42 },
      {
        key: 'second',
        phase: 2,
        collect: async (_env, resolved) => (resolved['first'] as number) * 2,
      },
    ];
    const results = await collectFeatures(features, makeEnv());
    expect(results['first']).toBe(42);
    expect(results['second']).toBe(84);
  });

  it('실패한 feature는 null 반환, throw 없음', async () => {
    const features: FeatureDef[] = [
      {
        key: 'failing',
        collect: async () => { throw new Error('test error'); },
      },
      { key: 'ok', collect: async () => 'success' },
    ];
    const results = await collectFeatures(features, makeEnv());
    expect(results['failing']).toBeNull();
    expect(results['ok']).toBe('success');
  });

  it('phase 2 실패한 feature는 null 반환', async () => {
    const features: FeatureDef[] = [
      { key: 'dep', collect: async () => 'depValue' },
      {
        key: 'failing2',
        phase: 2,
        collect: async () => { throw new Error('phase2 error'); },
      },
    ];
    const results = await collectFeatures(features, makeEnv());
    expect(results['dep']).toBe('depValue');
    expect(results['failing2']).toBeNull();
  });

  it('async feature 정상 resolve', async () => {
    const feature: FeatureDef = {
      key: 'async',
      collect: async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return { value: 123 };
      },
    };
    const results = await collectFeatures([feature], makeEnv());
    expect(results['async']).toEqual({ value: 123 });
  });

  it('빈 feature 목록 → 빈 결과', async () => {
    const results = await collectFeatures([], makeEnv());
    expect(results).toEqual({});
  });
});
