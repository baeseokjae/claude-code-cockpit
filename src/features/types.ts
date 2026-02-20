import type { StdinData, TranscriptData, CockpitConfig } from '../types/index.js';
import type { MainDeps } from '../index.js';

export interface CollectEnv {
  stdin: StdinData;
  transcript: TranscriptData;
  config: CockpitConfig;
  cwd: string | null;
  tier: 1 | 2 | 3;
  isDetailed: boolean;
  durationMs: number | undefined;
  deps: MainDeps;
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
