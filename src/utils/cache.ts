/**
 * File-based cache for I/O results
 * Needed because cockpit runs as a new process per hook invocation,
 * making in-memory caching ineffective.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CACHE_DIR = join(tmpdir(), 'claude-code-cockpit-cache');

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return join(CACHE_DIR, `${safeKey}.json`);
}

export function getCached<T>(key: string): T | undefined {
  try {
    const path = getCachePath(key);
    if (!existsSync(path)) return undefined;
    const raw = readFileSync(path, 'utf8');
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      return undefined;
    }
    return entry.value;
  } catch {
    return undefined;
  }
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  try {
    ensureCacheDir();
    const path = getCachePath(key);
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    writeFileSync(path, JSON.stringify(entry), 'utf8');
  } catch {
    // Cache write failures are non-fatal
  }
}

export function invalidateCache(key: string): void {
  try {
    const path = getCachePath(key);
    if (existsSync(path)) {
      unlinkSync(path);
    }
  } catch {
    // Non-fatal
  }
}
