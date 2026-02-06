/**
 * instance-sync.test.ts
 * Instance synchronization tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { InstanceInfoSerialized, InstanceConflict, InstanceInfo } from '../src/types/instance-sync.js';

// Mock node:fs before importing the module
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  renameSync: vi.fn(),
}));

// Import after mocking
import { getInstanceSync, cleanStaleInstances, detectConflicts, deserializeInstance } from '../src/data/instance-sync.js';
import * as fs from 'node:fs';

// ============================================
// Helper
// ============================================

function createInstance(overrides: Partial<InstanceInfoSerialized> = {}): InstanceInfoSerialized {
  return {
    instanceId: 'inst-1',
    hostname: 'test-host',
    sessionId: 'sess-1',
    lastActive: new Date().toISOString(),
    projectPath: '/home/user/project',
    branch: 'main',
    pid: 1234,
    ...overrides,
  };
}

// ============================================
// Pure function tests
// ============================================

describe('deserializeInstance', () => {
  it('should convert lastActive from ISO string to Date', () => {
    const iso = '2025-01-15T10:30:00.000Z';
    const serialized = createInstance({ lastActive: iso });
    const result = deserializeInstance(serialized);
    expect(result.lastActive).toBeInstanceOf(Date);
    expect(result.lastActive.toISOString()).toBe(iso);
  });

  it('should preserve all other fields', () => {
    const serialized = createInstance({
      instanceId: 'my-id',
      hostname: 'my-host',
      sessionId: 'my-sess',
      projectPath: '/tmp/proj',
      branch: 'develop',
      pid: 9999,
    });
    const result = deserializeInstance(serialized);
    expect(result.instanceId).toBe('my-id');
    expect(result.hostname).toBe('my-host');
    expect(result.sessionId).toBe('my-sess');
    expect(result.projectPath).toBe('/tmp/proj');
    expect(result.branch).toBe('develop');
    expect(result.pid).toBe(9999);
  });

  it('should handle epoch zero date', () => {
    const epochIso = new Date(0).toISOString();
    const serialized = createInstance({ lastActive: epochIso });
    const result = deserializeInstance(serialized);
    expect(result.lastActive).toBeInstanceOf(Date);
    expect(result.lastActive.getTime()).toBe(0);
  });
});

describe('cleanStaleInstances', () => {
  it('should keep fresh instances', () => {
    const now = Date.now();
    const inst = createInstance({ lastActive: new Date(now - 5_000).toISOString() });
    const result = cleanStaleInstances([inst], now);
    expect(result).toHaveLength(1);
    expect(result[0].instanceId).toBe('inst-1');
  });

  it('should remove stale instances', () => {
    const now = Date.now();
    const inst = createInstance({ lastActive: new Date(now - 20_000).toISOString() });
    const result = cleanStaleInstances([inst], now);
    expect(result).toHaveLength(0);
  });

  it('should use custom threshold', () => {
    const now = Date.now();
    const inst = createInstance({ lastActive: new Date(now - 5_000).toISOString() });
    const result = cleanStaleInstances([inst], now, 3_000);
    expect(result).toHaveLength(0);
  });

  it('should handle empty array', () => {
    const result = cleanStaleInstances([], Date.now());
    expect(result).toEqual([]);
  });

  it('should keep instances exactly at threshold boundary', () => {
    const now = Date.now();
    const threshold = 10_000;
    // age === threshold means age is NOT > threshold, so instance is kept
    const inst = createInstance({ lastActive: new Date(now - threshold).toISOString() });
    const result = cleanStaleInstances([inst], now, threshold);
    expect(result).toHaveLength(1);
  });

  it('should filter mixed fresh and stale instances', () => {
    const now = Date.now();
    const fresh1 = createInstance({
      instanceId: 'fresh-1',
      lastActive: new Date(now - 1_000).toISOString(),
    });
    const fresh2 = createInstance({
      instanceId: 'fresh-2',
      lastActive: new Date(now - 10_000).toISOString(),
    });
    const stale = createInstance({
      instanceId: 'stale-1',
      lastActive: new Date(now - 20_000).toISOString(),
    });
    // default threshold is 15_000
    const result = cleanStaleInstances([fresh1, fresh2, stale], now);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.instanceId)).toEqual(['fresh-1', 'fresh-2']);
  });
});

describe('detectConflicts', () => {
  it('should return empty array for single instance', () => {
    const inst = createInstance({ instanceId: 'current' });
    const result = detectConflicts([inst], 'current');
    expect(result).toEqual([]);
  });

  it('should detect conflict when multiple instances share project and branch', () => {
    const inst1 = createInstance({ instanceId: 'current', projectPath: '/proj', branch: 'main' });
    const inst2 = createInstance({ instanceId: 'other', projectPath: '/proj', branch: 'main' });
    const result = detectConflicts([inst1, inst2], 'current');
    expect(result).toHaveLength(1);
    expect(result[0].projectPath).toBe('/proj');
    expect(result[0].branch).toBe('main');
    expect(result[0].instances).toHaveLength(2);
  });

  it('should not return conflict when current instance is not in the group', () => {
    const inst1 = createInstance({ instanceId: 'a', projectPath: '/proj', branch: 'main' });
    const inst2 = createInstance({ instanceId: 'b', projectPath: '/proj', branch: 'main' });
    const result = detectConflicts([inst1, inst2], 'not-in-group');
    expect(result).toEqual([]);
  });

  it('should not detect conflict for different branches', () => {
    const inst1 = createInstance({ instanceId: 'current', projectPath: '/proj', branch: 'main' });
    const inst2 = createInstance({ instanceId: 'other', projectPath: '/proj', branch: 'develop' });
    const result = detectConflicts([inst1, inst2], 'current');
    expect(result).toEqual([]);
  });

  it('should not detect conflict for different projects', () => {
    const inst1 = createInstance({ instanceId: 'current', projectPath: '/projA', branch: 'main' });
    const inst2 = createInstance({ instanceId: 'other', projectPath: '/projB', branch: 'main' });
    const result = detectConflicts([inst1, inst2], 'current');
    expect(result).toEqual([]);
  });

  it('should detect multiple conflicts across different groups', () => {
    const inst1 = createInstance({ instanceId: 'current', projectPath: '/proj1', branch: 'main' });
    const inst2 = createInstance({ instanceId: 'other1', projectPath: '/proj1', branch: 'main' });
    const inst3 = createInstance({ instanceId: 'current', projectPath: '/proj2', branch: 'feat' });
    const inst4 = createInstance({ instanceId: 'other2', projectPath: '/proj2', branch: 'feat' });
    const result = detectConflicts([inst1, inst2, inst3, inst4], 'current');
    expect(result).toHaveLength(2);
    const paths = result.map((c) => c.projectPath).sort();
    expect(paths).toEqual(['/proj1', '/proj2']);
  });
});

// ============================================
// Integration tests
// ============================================

describe('getInstanceSync', () => {
  // Each test needs a unique time to bust the module-level read cache.
  // writeInstancesFile sets lastReadTime = Date.now(), so the next test
  // must have Date.now() at least READ_CACHE_MS (3s) later.
  let epoch = new Date('2025-06-01T00:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    epoch += 10_000; // jump 10s forward from previous test
    vi.setSystemTime(new Date(epoch));
    vi.mocked(fs.readFileSync).mockReset();
    vi.mocked(fs.writeFileSync).mockReset();
    vi.mocked(fs.mkdirSync).mockReset();
    vi.mocked(fs.renameSync).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should register a single instance with no conflicts', () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';
    vi.mocked(fs.readFileSync).mockImplementation(() => { throw enoent; });

    const result = getInstanceSync('sess-1', '/project', 'main');

    expect(result.instanceCount).toBe(1);
    expect(result.conflictCount).toBe(0);
    expect(result.hasMultipleInstances).toBe(false);
    expect(result.syncEnabled).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('should detect conflict when existing instance shares project and branch', () => {
    const existing: InstanceInfoSerialized[] = [
      {
        instanceId: 'sess-existing',
        hostname: 'host',
        sessionId: 'sess-existing',
        lastActive: new Date().toISOString(),
        projectPath: '/project',
        branch: 'main',
        pid: 9999,
      },
    ];
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existing));

    const result = getInstanceSync('sess-new', '/project', 'main');

    expect(result.instanceCount).toBe(2);
    expect(result.conflictCount).toBe(1);
    expect(result.hasMultipleInstances).toBe(true);
  });

  it('should clean stale instances from file', () => {
    const staleInstance: InstanceInfoSerialized[] = [
      {
        instanceId: 'sess-old',
        hostname: 'host',
        sessionId: 'sess-old',
        lastActive: new Date(Date.now() - 20000).toISOString(),
        projectPath: '/other-project',
        branch: 'dev',
        pid: 8888,
      },
    ];
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(staleInstance));

    const result = getInstanceSync('sess-1', '/project', 'main');

    expect(result.instanceCount).toBe(1);
    expect(result.conflictCount).toBe(0);
  });

  it('should handle malformed file gracefully', () => {
    vi.mocked(fs.readFileSync).mockReturnValue('not valid json');

    const result = getInstanceSync('sess-1', '/project', 'main');

    expect(result.instanceCount).toBe(1);
    expect(result.conflictCount).toBe(0);
  });

  it('should create directory and write via atomic rename', () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';
    vi.mocked(fs.readFileSync).mockImplementation(() => { throw enoent; });

    getInstanceSync('sess-1', '/project', 'main');

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true },
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.any(String),
      'utf8',
    );
    expect(fs.renameSync).toHaveBeenCalledTimes(1);
  });
});
