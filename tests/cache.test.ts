import { describe, it, expect, afterEach } from 'vitest';
import { getCached, setCache, invalidateCache } from '../src/utils/cache.js';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('File-based cache', () => {
  const CACHE_DIR = join(tmpdir(), 'claude-code-cockpit-cache');

  afterEach(() => {
    try {
      if (existsSync(CACHE_DIR)) {
        rmSync(CACHE_DIR, { recursive: true, force: true });
      }
    } catch {}
  });

  it('returns undefined for cache miss', () => {
    expect(getCached('nonexistent-key')).toBeUndefined();
  });

  it('returns cached value on cache hit', () => {
    setCache('test-key', { foo: 'bar' }, 10000);
    const result = getCached<{ foo: string }>('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('returns undefined for expired cache', () => {
    setCache('expired-key', 'value', 1);
    const start = Date.now();
    while (Date.now() - start < 5) {} // busy wait 5ms
    expect(getCached('expired-key')).toBeUndefined();
  });

  it('invalidates cache entry', () => {
    setCache('invalidate-key', 'value', 10000);
    expect(getCached('invalidate-key')).toBe('value');
    invalidateCache('invalidate-key');
    expect(getCached('invalidate-key')).toBeUndefined();
  });

  it('handles various value types', () => {
    setCache('number', 42, 10000);
    expect(getCached<number>('number')).toBe(42);

    setCache('array', [1, 2, 3], 10000);
    expect(getCached<number[]>('array')).toEqual([1, 2, 3]);

    setCache('null', null, 10000);
    expect(getCached('null')).toBeNull();
  });
});
