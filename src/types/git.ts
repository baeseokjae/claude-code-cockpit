/**
 * Git status information types
 */

export interface GitStatus {
  branch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  hasConflicts?: boolean;
}

export interface FileStats {
  modified: number;
  added: number;
  deleted: number;
  renamed: number;
  untracked: number;
}
