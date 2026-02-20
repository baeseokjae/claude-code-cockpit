/**
 * Render context type (integrates all data)
 */

import type { StdinData } from './stdin.js';
import type { TranscriptData, GitActivity, ToolStats, BashError } from './transcript.js';
import type { GitStatus } from './git.js';
import type { UsageData } from './usage.js';
import type { CockpitConfig, ConfigCounts } from './config.js';
import type { Theme } from './theme.js';
import type { TokenSpeed } from '../data/speed-tracker.js';
import type { LinesData } from './lines.js';
import type { CacheMetrics } from './cache-metrics.js';
import type { CompactSuggestion } from '../data/compact-suggestion.js';
import type { ViolationSummary } from './violations.js';
import type { McpToolInfo } from '../input/mcp-reader.js';
import type { WorkflowState } from './workflow.js';
import type { CoverageSummary } from './test-coverage.js';
import type { PassAtKSummary } from './pass-at-k.js';
import type { McpStatus } from './mcp-status.js';
import type { InstanceSync } from './instance-sync.js';

export interface RenderContext {
  width: number;
  stdin: StdinData;
  transcript: TranscriptData;

  config: CockpitConfig;
  configCounts: ConfigCounts;

  gitStatus: GitStatus | null;
  usageData: UsageData | null;
  tokenSpeed: TokenSpeed | null;

  linesData: LinesData | null;
  cacheMetrics: CacheMetrics | null;

  gitActivity: GitActivity | null;
  toolStats: ToolStats | null;
  bashErrors: BashError[] | null;

  compactSuggestion: CompactSuggestion | null;

  violations: ViolationSummary | null;
  mcpInfo: McpToolInfo | null;

  workflowState: WorkflowState | null;

  testCoverage: CoverageSummary | null;
  passAtK: PassAtKSummary | null;
  mcpStatus: McpStatus | null;
  instanceSync: InstanceSync | null;

  sessionDuration: string;

  theme: Theme;
  detailMode: boolean;
  tier: 1 | 2 | 3;
}
