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
}

export interface SyncStatus {
  enabled: boolean;
  lastSync: Date | null;
  instances: InstanceInfo[];
  currentInstance: InstanceInfo | null;
}

export interface InstanceSync {
  hasMultipleInstances: boolean;
  syncEnabled: boolean;
  instanceCount: number;
  status: SyncStatus;
}
