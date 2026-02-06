/**
 * Instance sync - file-based multi-instance discovery
 * Uses ~/.claude/cockpit-instances.json for heartbeat-based instance tracking.
 * Designed for short-lived processes (statusline plugin, runs every ~1-2s).
 */

import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, hostname } from 'node:os';
import type {
  InstanceSync,
  SyncStatus,
  InstanceInfo,
  InstanceInfoSerialized,
  InstanceConflict,
} from '../types/instance-sync.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('instance-sync');

const INSTANCES_DIR = join(homedir(), '.claude');
const INSTANCES_FILE = join(INSTANCES_DIR, 'cockpit-instances.json');
const STALE_THRESHOLD_MS = 15_000; // 15 seconds
const READ_CACHE_MS = 3_000; // re-read file at most every 3 seconds

// Module-level read cache
let cachedInstances: InstanceInfoSerialized[] | null = null;
let lastReadTime = 0;

// ============================================
// Pure helpers (exported for testing)
// ============================================

export function deserializeInstance(s: InstanceInfoSerialized): InstanceInfo {
  return { ...s, lastActive: new Date(s.lastActive) };
}

export function cleanStaleInstances(
  instances: InstanceInfoSerialized[],
  now: number,
  thresholdMs: number = STALE_THRESHOLD_MS,
): InstanceInfoSerialized[] {
  return instances.filter((inst) => {
    const age = now - new Date(inst.lastActive).getTime();
    if (age > thresholdMs) {
      debug(`removing stale instance: ${inst.instanceId} (age: ${age}ms)`);
      return false;
    }
    return true;
  });
}

export function detectConflicts(
  instances: InstanceInfoSerialized[],
  currentInstanceId: string,
): InstanceConflict[] {
  const groups = new Map<string, InstanceInfoSerialized[]>();

  for (const inst of instances) {
    const key = `${inst.projectPath}::${inst.branch}`;
    const group = groups.get(key) || [];
    group.push(inst);
    groups.set(key, group);
  }

  const conflicts: InstanceConflict[] = [];
  for (const [, group] of groups) {
    if (group.length > 1 && group.some((i) => i.instanceId === currentInstanceId)) {
      conflicts.push({
        instances: group.map(deserializeInstance),
        projectPath: group[0].projectPath,
        branch: group[0].branch,
      });
    }
  }

  return conflicts;
}

// ============================================
// File I/O (internal)
// ============================================

function readInstancesFile(): InstanceInfoSerialized[] {
  const now = Date.now();
  if (cachedInstances !== null && now - lastReadTime < READ_CACHE_MS) {
    return cachedInstances;
  }

  try {
    const raw = readFileSync(INSTANCES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    cachedInstances = Array.isArray(parsed) ? parsed : [];
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      debug('failed to read instances file:', err);
    }
    cachedInstances = [];
  }

  lastReadTime = now;
  return cachedInstances;
}

function writeInstancesFile(instances: InstanceInfoSerialized[]): void {
  try {
    mkdirSync(INSTANCES_DIR, { recursive: true });
    const tmpFile = join(INSTANCES_DIR, `.cockpit-instances.json.tmp.${process.pid}`);
    writeFileSync(tmpFile, JSON.stringify(instances, null, 2), 'utf8');
    renameSync(tmpFile, INSTANCES_FILE);
    // Update cache after successful write
    cachedInstances = instances;
    lastReadTime = Date.now();
  } catch (err) {
    debug('failed to write instances file:', err);
  }
}

// ============================================
// Core orchestration
// ============================================

function cleanAndRegister(currentSerialized: InstanceInfoSerialized): InstanceInfoSerialized[] {
  const instances = readInstancesFile();
  const now = Date.now();

  // Remove stale entries
  const alive = cleanStaleInstances(instances, now);

  // Upsert current instance
  const idx = alive.findIndex((inst) => inst.instanceId === currentSerialized.instanceId);
  if (idx >= 0) {
    alive[idx] = currentSerialized;
  } else {
    alive.push(currentSerialized);
  }

  writeInstancesFile(alive);
  return alive;
}

// ============================================
// Public API
// ============================================

export function getInstanceSync(
  sessionId: string | undefined,
  cwd: string | undefined,
  branch: string | undefined,
): InstanceSync {
  const instanceId = sessionId || `${hostname()}-${cwd || process.cwd()}-${branch || 'unknown'}`;
  const projectPath = cwd || process.cwd();
  const branchName = branch || 'unknown';

  const currentSerialized: InstanceInfoSerialized = {
    instanceId,
    hostname: hostname(),
    sessionId: sessionId || 'unknown',
    lastActive: new Date().toISOString(),
    projectPath,
    branch: branchName,
    pid: process.pid,
  };

  const allInstances = cleanAndRegister(currentSerialized);
  const conflicts = detectConflicts(allInstances, instanceId);
  const currentInstance = deserializeInstance(currentSerialized);
  const instanceCount = allInstances.length;

  const status: SyncStatus = {
    enabled: true,
    lastSync: new Date(),
    instances: allInstances.map(deserializeInstance),
    currentInstance,
    conflicts,
  };

  debug('instance sync:', { instanceId, total: instanceCount, conflicts: conflicts.length });

  return {
    hasMultipleInstances: instanceCount > 1,
    syncEnabled: true,
    instanceCount,
    conflictCount: conflicts.length,
    status,
  };
}
