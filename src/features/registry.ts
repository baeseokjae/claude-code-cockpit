/**
 * Feature Registry: 조건부 수집이 필요한 11개 feature 정의
 */

import type { FeatureDef } from './types.js';
import { calculateCompactSuggestion } from '../data/compact-suggestion.js';
import { extractViolations } from '../data/rule-violations.js';
import { readMcpConfig } from '../input/mcp-reader.js';
import { detectWorkflowPhase } from '../data/workflow-phase.js';
import { getTestCoverageSummary } from '../data/test-coverage.js';
import { getPassAtKSummary } from '../data/pass-at-k.js';
import { analyzeMcpStatus } from '../data/mcp-status.js';
import { getInstanceSync } from '../data/instance-sync.js';
import type { McpToolInfo } from '../input/mcp-reader.js';
import type { GitStatus } from '../types/git.js';

const EMPTY_CONFIG_COUNTS = { claudeMdCount: 0, rulesCount: 0, mcpCount: 0, hooksCount: 0 };

export const FEATURE_REGISTRY: readonly FeatureDef[] = [
  // --- Phase 1: 독립 수집 (병렬 실행) ---
  {
    key: 'configCounts',
    minTier: 2,
    disabledDefault: EMPTY_CONFIG_COUNTS,
    collect: (env) => env.deps.countConfigs(env.cwd),
  },
  {
    key: 'gitStatus',
    collect: (env) => env.deps.getGitStatus(env.cwd || undefined, {
      showAllBranches: env.tier >= 3 && env.config.display.showAllBranches,
      showAllBranchesDepth: env.config.display.showAllBranchesDepth,
      includeTag: env.tier >= 2 && env.config.display.showGitTag,
      includeWorktrees: env.tier >= 3 && env.config.display.showGitWorktrees,
    }),
  },
  {
    key: 'usageData',
    configFlag: 'showUsage',
    collect: (env) => env.deps.fetchUsage(
      env.config.usage.cacheTtlSeconds * 1000,
      env.config.usage.failureCacheTtlSeconds * 1000,
    ),
  },
  {
    key: 'compactSuggestion',
    configFlag: 'showCompactSuggestion',
    collect: (env) => calculateCompactSuggestion(
      env.transcript.tools,
      env.config.notifications.compactSuggestionThreshold,
    ),
  },
  {
    key: 'violations',
    configFlag: 'showViolations',
    collect: (env) => extractViolations(env.transcript.tools),
  },
  {
    key: 'mcpInfo',
    configFlag: 'showMcpImpact',
    minTier: 2,
    collect: (env) => readMcpConfig(env.cwd || undefined),
  },
  {
    key: 'workflowState',
    configFlag: 'showWorkflowPhase',
    requireDetailed: true,
    collect: (env) => detectWorkflowPhase(
      env.transcript.tools,
      env.transcript.agents,
      env.transcript.todos,
    ),
  },
  {
    key: 'testCoverage',
    configFlag: 'showTestCoverage',
    requireDetailed: true,
    collect: (env) => getTestCoverageSummary(env.cwd || undefined),
  },
  {
    key: 'passAtK',
    configFlag: 'showPassAtK',
    requireDetailed: true,
    collect: (env) => getPassAtKSummary(env.transcript.tools),
  },
  // --- Phase 2: 의존성 있음 (Phase 1 완료 후 순차 실행) ---
  {
    key: 'mcpStatus',
    configFlag: 'showMcpStatus',
    requireDetailed: true,
    phase: 2,
    collect: (env, resolved) =>
      analyzeMcpStatus(env.transcript.tools, (resolved['mcpInfo'] ?? null) as McpToolInfo | null),
  },
  {
    key: 'instanceSync',
    configFlag: 'showInstanceSync',
    requireDetailed: true,
    phase: 2,
    collect: (env, resolved) => {
      const git = resolved['gitStatus'] as GitStatus | null;
      return getInstanceSync(env.stdin.session_id, env.cwd || undefined, git?.branch);
    },
  },
];
