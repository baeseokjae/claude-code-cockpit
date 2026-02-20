export interface GitStatus {
  branch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  hasConflicts?: boolean;
  remoteUrl?: string;
  fileStats?: FileStats;
  subRepos?: SubRepoStatus[];
  tag?: string;
  worktrees?: WorktreeInfo[];
}

export interface SubRepoStatus {
  path: string;
  branch: string;
  isDirty: boolean;
}

export interface FileStats {
  modified: number;
  added: number;
  deleted: number;
  renamed: number;
  untracked: number;
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  isDirty: boolean;
  isMain: boolean;
}
