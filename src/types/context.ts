/**
 * Render context type (integrates all data)
 */

import type { StdinData } from './stdin.js';
import type { TranscriptData } from './transcript.js';
import type { GitStatus } from './git.js';
import type { UsageData } from './usage.js';
import type { CockpitConfig, ConfigCounts } from './config.js';
import type { Theme } from './theme.js';
import type { Alert } from '../data/alerts.js';

export interface RenderContext {
  stdin: StdinData;
  transcript: TranscriptData;

  config: CockpitConfig;
  configCounts: ConfigCounts;

  gitStatus: GitStatus | null;
  usageData: UsageData | null;
  extraLabel: string | null;

  sessionDuration: string;

  theme: Theme;
  detailMode: boolean;

  alerts: Alert[];
}
