/**
 * Unified file-based cache for I/O results
 * Uses a single store.json file instead of per-key files to minimize syscalls.
 * Cockpit runs as a new process per hook invocation, so:
 * - First access loads the entire store from disk (1 read)
 * - Subsequent accesses use in-memory store
 * - flushCache() writes back once at process exit (1 write, only if dirty)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDebug } from './debug.js';

const debug = createDebug('cache');

const CACHE_DIR = join(tmpdir(), 'claude-code-cockpit-cache');
const CACHE_FILE = join(CACHE_DIR, 'store.json');

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
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, 'utf8');
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

    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    const tmpFile = CACHE_FILE + '.tmp';
    writeFileSync(tmpFile, JSON.stringify(_store), 'utf8');
    renameSync(tmpFile, CACHE_FILE);
    _dirty = false;
  } catch (e) {
    debug('flushCache error:', e);
  }
}

/**
 * Reset internal state (for testing only).
 */
export function resetCacheState(): void {
  _store = null;
  _dirty = false;
}
