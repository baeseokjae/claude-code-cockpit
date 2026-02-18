import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCached, setCache, invalidateCache,
  getCachedByMtime, setCacheByMtime,
  flushCache, resetCacheState,
} from '../src/utils/cache.js';
import { existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Unified file-based cache', () => {
  const CACHE_DIR = join(tmpdir(), 'claude-code-cockpit-cache');
  const STORE_FILE = join(CACHE_DIR, 'store.json');

  beforeEach(() => {
    resetCacheState();
    try {
      if (existsSync(CACHE_DIR)) {
        rmSync(CACHE_DIR, { recursive: true, force: true });
      }
    } catch {}
  });

  afterEach(() => {
    resetCacheState();
    try {
      if (existsSync(CACHE_DIR)) {
        rmSync(CACHE_DIR, { recursive: true, force: true });
      }
    } catch {}
  });

  it('returns undefined for cache miss', () => {
    expect(getCached('nonexistent-key')).toBeUndefined();
  });

  it('returns cached value on cache hit (after flush)', () => {
    setCache('test-key', { foo: 'bar' }, 10000);

    // Before flush, in-memory should work
    expect(getCached<{ foo: string }>('test-key')).toEqual({ foo: 'bar' });

    // Flush to disk
    flushCache();
    expect(existsSync(STORE_FILE)).toBe(true);

    // Reset in-memory state and reload from disk
    resetCacheState();
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

  it('writes a single store.json file (not per-key files)', () => {
    setCache('key-a', 'alpha', 10000);
    setCache('key-b', 'beta', 10000);
    flushCache();

    expect(existsSync(STORE_FILE)).toBe(true);
    // Should NOT have per-key files
    expect(existsSync(join(CACHE_DIR, 'key-a.json'))).toBe(false);
    expect(existsSync(join(CACHE_DIR, 'key-b.json'))).toBe(false);
  });

  it('does not write to disk if nothing changed', () => {
    // No set/invalidate calls → flushCache should be a no-op
    flushCache();
    expect(existsSync(STORE_FILE)).toBe(false);
  });

  describe('mtime-based cache', () => {
    const testDir = join(tmpdir(), 'cockpit-mtime-test');
    const testFile = join(testDir, 'test.txt');

    beforeEach(() => {
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
      writeFileSync(testFile, 'initial content', 'utf8');
    });

    afterEach(() => {
      try {
        if (existsSync(testDir)) {
          rmSync(testDir, { recursive: true, force: true });
        }
      } catch {}
    });

    it('returns cached value when mtime unchanged', () => {
      setCacheByMtime('mtime-key', { data: 42 }, testFile);
      const result = getCachedByMtime<{ data: number }>('mtime-key', testFile);
      expect(result).toEqual({ data: 42 });
    });

    it('returns undefined when file is modified', () => {
      setCacheByMtime('mtime-key', { data: 42 }, testFile);

      // Modify the file (change mtime)
      const start = Date.now();
      while (Date.now() - start < 10) {} // ensure mtime changes
      writeFileSync(testFile, 'modified content', 'utf8');

      const result = getCachedByMtime<{ data: number }>('mtime-key', testFile);
      expect(result).toBeUndefined();
    });

    it('returns undefined for non-existent file', () => {
      setCacheByMtime('mtime-key', 'value', testFile);
      rmSync(testFile);
      const result = getCachedByMtime('mtime-key', testFile);
      expect(result).toBeUndefined();
    });

    it('persists mtime cache through flush/reload', () => {
      setCacheByMtime('persist-key', 'persisted', testFile);
      flushCache();

      resetCacheState();
      const result = getCachedByMtime<string>('persist-key', testFile);
      expect(result).toBe('persisted');
    });
  });
});
