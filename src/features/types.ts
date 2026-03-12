import type { StdinData, TranscriptData, CockpitConfig } from '../types/index.js';
import type { GitStatus } from '../types/git.js';
import type { UsageData, ConfigCounts } from '../types/index.js';

export interface FeatureDeps {
  countConfigs: (cwd: string | null) => ConfigCounts;
  getGitStatus: (cwd?: string, options?: {
    showAllBranches?: boolean;
    showAllBranchesDepth?: number;
    includeTag?: boolean;
    includeWorktrees?: boolean;
  }) => Promise<GitStatus | null>;
  fetchUsage: (cacheTtlMs?: number, failureCacheTtlMs?: number) => Promise<UsageData | null>;
}

export interface CollectEnv {
  stdin: StdinData;
  transcript: TranscriptData;
  config: CockpitConfig;
  cwd: string | null;
  tier: 1 | 2 | 3;
  isDetailed: boolean;
  durationMs: number | undefined;
  deps: FeatureDeps;
}

export interface FeatureDef {
  key: string;
  configFlag?: keyof CockpitConfig['display'];
  minTier?: 2 | 3;
  requireDetailed?: boolean;
  phase?: 1 | 2;
  /** disabled일 때 null 대신 반환할 기본값 */
  disabledDefault?: unknown;
  collect: (env: CollectEnv, resolved: Record<string, unknown>) => unknown | Promise<unknown>;
}
