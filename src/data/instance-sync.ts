/**
 * Instance sync (placeholder)
 * Multi-instance synchronization would require:
 * - Shared storage (file-based or database)
 * - Conflict resolution
 * - Real-time updates
 *
 * This is a basic structure for future implementation
 */

import type { InstanceSync, SyncStatus, InstanceInfo } from '../types/instance-sync.js';
import { createDebug } from '../utils/debug.js';
import { hostname } from 'node:os';

const debug = createDebug('instance-sync');

/**
 * Get current instance info
 */
function getCurrentInstance(sessionId: string | undefined, cwd: string | undefined, branch: string | undefined): InstanceInfo {
  return {
    instanceId: sessionId || 'unknown',
    hostname: hostname(),
    sessionId: sessionId || 'unknown',
    lastActive: new Date(),
    projectPath: cwd || process.cwd(),
    branch: branch || 'unknown',
  };
}

/**
 * Create instance sync status (placeholder)
 */
export function getInstanceSync(
  sessionId: string | undefined,
  cwd: string | undefined,
  branch: string | undefined
): InstanceSync {
  // TODO: Implement actual instance discovery and synchronization
  // This would require:
  // 1. Shared state file (~/.claude/instances.json)
  // 2. Instance heartbeat mechanism
  // 3. Conflict resolution for concurrent edits
  // 4. Real-time notification system

  const currentInstance = getCurrentInstance(sessionId, cwd, branch);

  const status: SyncStatus = {
    enabled: false, // Disabled by default
    lastSync: null,
    instances: [currentInstance],
    currentInstance,
  };

  debug('instance sync (placeholder):', { instanceId: currentInstance.instanceId });

  return {
    hasMultipleInstances: false,
    syncEnabled: false,
    instanceCount: 1,
    status,
  };
}
