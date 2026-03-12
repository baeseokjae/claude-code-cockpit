/**
 * Unified file-based cache for I/O results
 * Uses a single store.json file instead of per-key files to minimize syscalls.
 * Cockpit runs as a new process per hook invocation, so:
 * - First access loads the entire store from disk (1 read)
 * - Subsequent accesses use in-memory store
 * - flushCache() writes back once at process exit (1 write, only if dirty)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createDebug } from './debug.js';
import { getClaudeConfigDir } from './paths.js';

const debug = createDebug('cache');

/**
 * Lazy cache file path — computed on first use so that CLAUDE_CONFIG_DIR
 * can be set after module import (e.g. in tests).
 */
let _cacheFile: string | null = null;

function getCacheFile(): string {
  if (_cacheFile === null) {
    _cacheFile = join(getClaudeConfigDir(), 'plugins', 'claude-code-cockpit', '.cache.json');
  }
  return _cacheFile;
}

interface CacheEntry {
  value: unknown;
  expiresAt?: number;  // TTL-based expiry (epoch ms)
  mtimeMs?: number;    // mtime-based validity
  createdAt?: number;  // entry creation time (for mtime entry eviction)
}

const MAX_MTIME_AGE_MS = 3600_000; // evict mtime entries older than 1 hour

let _store: Record<string, CacheEntry> | null = null; // null = not loaded
let _dirty = false;

function loadStore(): Record<string, CacheEntry> {
  if (_store !== null) return _store;

  try {
    const cacheFile = getCacheFile();
    if (existsSync(cacheFile)) {
      const raw = readFileSync(cacheFile, 'utf8');
      _store = JSON.parse(raw) as Record<string, CacheEntry>;
    } else {
      _store = {};
    }
  } catch (e) {
    debug('loadStore parse failed:', e);
    _store = {};
  }

  return _store;
}

export function getCached<T>(key: string): T | undefined {
  try {
    const store = loadStore();
    const entry = store[key];
    if (!entry) return undefined;

    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      delete store[key];
      _dirty = true;
      return undefined;
    }

    return entry.value as T;
  } catch (e) {
    debug('getCached error:', e);
    return undefined;
  }
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  try {
    const store = loadStore();
    store[key] = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    _dirty = true;
  } catch (e) {
    debug('setCache error:', e);
  }
}

export function invalidateCache(key: string): void {
  try {
    const store = loadStore();
    if (key in store) {
      delete store[key];
      _dirty = true;
    }
  } catch (e) {
    debug('invalidateCache error:', e);
  }
}

/**
 * Get cached value validated by file mtime.
 * Returns cached value only if the file's mtime hasn't changed.
 */
export function getCachedByMtime<T>(key: string, filePath: string): T | undefined {
  try {
    const store = loadStore();
    const entry = store[key];
    if (!entry || entry.mtimeMs === undefined) return undefined;

    const currentMtime = statSync(filePath).mtimeMs;
    if (currentMtime !== entry.mtimeMs) {
      delete store[key];
      _dirty = true;
      return undefined;
    }

    return entry.value as T;
  } catch (e) {
    debug('getCachedByMtime error:', e);
    return undefined;
  }
}

/**
 * Set cached value with file mtime as the validity key.
 */
export function setCacheByMtime<T>(key: string, value: T, filePath: string): void {
  try {
    const currentMtime = statSync(filePath).mtimeMs;
    const store = loadStore();
    store[key] = {
      value,
      mtimeMs: currentMtime,
      createdAt: Date.now(),
    };
    _dirty = true;
  } catch (e) {
    debug('setCacheByMtime error:', e);
  }
}

/**
 * Flush the in-memory store to disk (single write).
 * Evicts expired TTL entries before writing to prevent unbounded growth.
 * Uses atomic write (temp file + rename) to prevent corruption on crash.
 * Call this once at process exit.
 */
export function flushCache(): void {
  if (!_dirty || _store === null) return;

  try {
    // Evict stale entries before writing
    const now = Date.now();
    for (const key of Object.keys(_store)) {
      const entry = _store[key];
      // TTL-based: expired
      if (entry.expiresAt !== undefined && now > entry.expiresAt) {
        delete _store[key];
        continue;
      }
      // mtime-based: older than max age (prevents unbounded growth from session-unique keys)
      if (entry.mtimeMs !== undefined && entry.createdAt !== undefined
          && now - entry.createdAt > MAX_MTIME_AGE_MS) {
        delete _store[key];
      }
    }

    const cacheFile = getCacheFile();
    const cacheDir = join(cacheFile, '..');
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    const tmpFile = cacheFile + '.tmp';
    writeFileSync(tmpFile, JSON.stringify(_store), 'utf8');
    renameSync(tmpFile, cacheFile);
    _dirty = false;
  } catch (e) {
    debug('flushCache error:', e);
  }
}

// --- File-based API lock ---

const LOCK_STALE_MS = 30_000;

function getLockFile(): string {
  return getCacheFile() + '.lock';
}

export function acquireApiLock(): boolean {
  const lockFile = getLockFile();
  try {
    if (existsSync(lockFile)) {
      const stat = statSync(lockFile);
      if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
        unlinkSync(lockFile);
      } else {
        return false;
      }
    }
    writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

export function releaseApiLock(): void {
  try {
    const lockFile = getLockFile();
    if (existsSync(lockFile)) {
      unlinkSync(lockFile);
    }
  } catch { /* ignore */ }
}

/**
 * Reset internal state (for testing only).
 */
export function resetCacheState(): void {
  _store = null;
  _dirty = false;
  _cacheFile = null;
}
