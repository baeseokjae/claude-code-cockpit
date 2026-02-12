#!/usr/bin/env node

/**
 * Claude Code Cockpit main entry point
 */

import type { RenderContext } from './types/index.js';
import { readStdin, getCwd } from './input/stdin.js';
import { parseTranscript } from './input/transcript.js';
import { countConfigs } from './input/config-reader.js';
import { parseExtraCmdArg } from './input/cli.js';
import { getGitStatus } from './data/git.js';
import { formatSessionDuration } from './data/time.js';
import { fetchUsage } from './data/usage-api.js';
import { calculateTokenSpeed } from './data/speed-tracker.js';
import { calculateSessionDuration } from './data/session-time.js';
import { getLinesData } from './data/lines.js';
import { calculateCacheMetrics } from './data/cache-metrics.js';
import { calculateCompactSuggestion } from './data/compact-suggestion.js';
import { extractViolations } from './data/rule-violations.js';
import { readMcpConfig } from './input/mcp-reader.js';
import { detectWorkflowPhase } from './data/workflow-phase.js';
import { getTestCoverageSummary } from './data/test-coverage.js';
import { getPassAtKSummary } from './data/pass-at-k.js';
import { getPerformanceMetrics } from './data/performance-metrics.js';
import { analyzeMcpStatus } from './data/mcp-status.js';
import { getInstanceSync } from './data/instance-sync.js';
import { loadConfig } from './config/loader.js';
import { loadTheme } from './themes/index.js';
import { writeOutput } from './output/writer.js';
import { writeSessionFile } from './output/session-file.js';
import { createDebug } from './utils/debug.js';
import { getTerminalWidth } from './utils/terminal-width.js';

const debug = createDebug('main');

export function getTier(width: number, layout: { compactWidth: number; fullWidth: number }): 1 | 2 | 3 {
  if (width < layout.compactWidth) return 1;
  if (width < layout.fullWidth) return 2;
  return 3;
}

export interface MainDeps {
  readStdin: typeof readStdin;
  parseTranscript: typeof parseTranscript;
  countConfigs: typeof countConfigs;
  getGitStatus: typeof getGitStatus;
  fetchUsage: typeof fetchUsage;
  loadConfig: typeof loadConfig;
  loadTheme: typeof loadTheme;
  parseExtraCmdArg: typeof parseExtraCmdArg;
  writeOutput: typeof writeOutput;
  now: () => number;
}

const defaultDeps: MainDeps = {
  readStdin,
  parseTranscript,
  countConfigs,
  getGitStatus,
  fetchUsage,
  loadConfig,
  loadTheme,
  parseExtraCmdArg,
  writeOutput,
  now: () => Date.now(),
};

export async function main(deps: MainDeps = defaultDeps): Promise<void> {
  try {
    debug('starting claude-code-cockpit');

    const stdin = await deps.readStdin();
    if (!stdin) {
      debug('no stdin data, exiting');
      return;
    }

    const config = deps.loadConfig();

    const theme = deps.loadTheme(config.theme);

    const transcriptPath = stdin.transcript_path || null;
    const transcript = await deps.parseTranscript(transcriptPath);

    const cwd = getCwd(stdin);
    const width = getTerminalWidth();
    const tier = getTier(width, theme.layout);
    const isDetailed = tier >= 3 || config.detailMode || config.preset === 'full';

    // Tier 2+: config counts require filesystem reads
    const configCounts = tier >= 2
      ? deps.countConfigs(cwd)
      : { claudeMdCount: 0, rulesCount: 0, mcpCount: 0, hooksCount: 0 };

    // Git: limit expensive options by tier
    const gitStatus = await deps.getGitStatus(cwd || undefined, {
      showAllBranches: tier >= 3 && config.display.showAllBranches,
      showAllBranchesDepth: config.display.showAllBranchesDepth,
      includeTag: tier >= 2 && config.display.showGitTag,
      includeWorktrees: tier >= 3 && config.display.showGitWorktrees,
    });

    const durationMs = stdin.cost?.total_duration_ms ||
      stdin.cost?.total_api_duration_ms ||
      calculateSessionDuration(stdin.session_id);
    const sessionDuration = formatSessionDuration(durationMs);

    const extraLabel = null;

    // Tier 2+: usage API call
    const usageData = tier >= 2 && config.display.showUsage ? await deps.fetchUsage() : null;

    const tokenSpeed = calculateTokenSpeed(stdin, durationMs);

    const linesData = getLinesData(stdin);
    const cacheMetrics = calculateCacheMetrics(stdin);

    const compactSuggestion = config.display.showCompactSuggestion
      ? calculateCompactSuggestion(
          transcript.tools,
          config.notifications.compactSuggestionThreshold
        )
      : null;

    const violations = config.display.showViolations
      ? extractViolations(transcript.tools)
      : null;

    // Tier 2+: MCP config requires filesystem reads
    const mcpInfo = tier >= 2 && config.display.showMcpImpact
      ? readMcpConfig(cwd || undefined)
      : null;

    // Analytics: Tier 3 or detailMode
    const workflowState = isDetailed && config.display.showWorkflowPhase
      ? detectWorkflowPhase(transcript.tools, transcript.agents, transcript.todos)
      : null;

    const testCoverage = isDetailed && config.display.showTestCoverage
      ? getTestCoverageSummary(cwd || undefined)
      : null;

    const passAtK = isDetailed && config.display.showPassAtK
      ? getPassAtKSummary(transcript.tools)
      : null;

    const performanceMetrics = isDetailed && config.display.showPerformanceMetrics
      ? getPerformanceMetrics(cwd || undefined)
      : null;

    const mcpStatus = isDetailed && config.display.showMcpStatus
      ? analyzeMcpStatus(transcript.tools, mcpInfo)
      : null;

    const instanceSync = isDetailed && config.display.showInstanceSync
      ? getInstanceSync(stdin.session_id, cwd || undefined, gitStatus?.branch)
      : null;

    const ctx: RenderContext = {
      width,
      stdin,
      transcript,
      config,
      configCounts,
      gitStatus,
      usageData,
      tokenSpeed,
      extraLabel,
      linesData,
      cacheMetrics,
      gitActivity: transcript.gitActivity || null,
      toolStats: transcript.toolStats || null,
      bashErrors: transcript.bashErrors || null,
      compactSuggestion,
      violations,
      mcpInfo,
      workflowState,
      testCoverage,
      passAtK,
      performanceMetrics,
      mcpStatus,
      instanceSync,
      sessionDuration,
      theme,
      detailMode: config.detailMode,
      tier,
    };

    const lines = theme.render(ctx);

    // Write session file
    writeSessionFile(ctx);

    deps.writeOutput(lines);

    debug('claude-code-cockpit finished');
  } catch (error) {
    debug('error:', error);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
