/**
 * Instance sync type definitions
 * For syncing state across multiple Claude instances
 */

export interface InstanceInfo {
  instanceId: string;
  hostname: string;
  sessionId: string;
  lastActive: Date;
  projectPath: string;
  branch: string;
  pid: number;
}

/** Serialized form stored in JSON file */
export interface InstanceInfoSerialized {
  instanceId: string;
  hostname: string;
  sessionId: string;
  lastActive: string; // ISO string
  projectPath: string;
  branch: string;
  pid: number;
}

export interface InstanceConflict {
  /** Instances sharing the same project + branch */
  instances: InstanceInfo[];
  projectPath: string;
  branch: string;
}

export interface SyncStatus {
  enabled: boolean;
  lastSync: Date | null;
  instances: InstanceInfo[];
  currentInstance: InstanceInfo;
  conflicts: InstanceConflict[];
}

export interface InstanceSync {
  hasMultipleInstances: boolean;
  syncEnabled: boolean;
  instanceCount: number;
  conflictCount: number;
  /** True when instances are detected as team agents (same host, active team) */
  hasActiveTeam: boolean;
  status: SyncStatus;
}
