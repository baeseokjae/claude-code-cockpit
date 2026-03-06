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
import { extractGitActivity } from './data/git-activity.js';
import { calculateToolStats } from './data/tool-stats.js';
import { extractBashErrors } from './data/bash-errors.js';
import { loadConfig } from './config/loader.js';
import { loadTheme } from './themes/index.js';
import { writeOutput } from './output/writer.js';
import { writeSessionFile } from './output/session-file.js';
import { createDebug } from './utils/debug.js';
import { getTerminalWidth } from './utils/terminal-width.js';
import { flushCache } from './utils/cache.js';
import { collectFeatures } from './features/collector.js';
import { FEATURE_REGISTRY } from './features/registry.js';

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
  fetchUsage: (cacheTtlMs?: number) => Promise<import('./types/index.js').UsageData | null>;
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
  let stdin: Awaited<ReturnType<typeof readStdin>> | undefined;
  try {
    debug('starting claude-code-cockpit');

    stdin = await deps.readStdin();
    if (!stdin) {
      debug('no stdin data, exiting');
      return;
    }

    const config = deps.loadConfig();

    const theme = deps.loadTheme(config.theme);

    const transcriptPath = stdin.transcript_path || null;
    const transcript = await deps.parseTranscript(transcriptPath);

    const cwd = getCwd(stdin);
    const rawWidth = getTerminalWidth();
    const width = Math.max(40, rawWidth - config.rightMargin);
    const tier = getTier(rawWidth, theme.layout);
    const isDetailed = tier >= 3 || config.detailMode || config.preset === 'full';

    // Core derived: 순수 계산, 항상 실행
    const gitActivity = extractGitActivity(transcript.tools) || null;
    const toolStats = calculateToolStats(transcript.tools) || null;
    const bashErrors = extractBashErrors(transcript.tools) || null;

    const durationMs = stdin.cost?.total_duration_ms ||
      stdin.cost?.total_api_duration_ms ||
      calculateSessionDuration(stdin.session_id);
    const sessionDuration = formatSessionDuration(durationMs);
    const tokenSpeed = calculateTokenSpeed(stdin, durationMs);
    const linesData = getLinesData(stdin);
    const cacheMetrics = calculateCacheMetrics(stdin);

    // Feature collection: 레지스트리 기반 조건부 수집
    const features = await collectFeatures(FEATURE_REGISTRY, {
      stdin, transcript, config, cwd, tier, isDetailed, durationMs, deps,
    });

    const ctx: RenderContext = {
      width,
      stdin,
      transcript,
      config,
      sessionDuration,
      theme,
      detailMode: config.detailMode,
      tier,
      gitActivity,
      toolStats,
      bashErrors,
      tokenSpeed,
      linesData,
      cacheMetrics,
      ...(features as Pick<RenderContext,
        'configCounts' | 'gitStatus' | 'usageData' | 'compactSuggestion' | 'violations' |
        'mcpInfo' | 'workflowState' | 'testCoverage' | 'passAtK' | 'mcpStatus' | 'instanceSync'
      >),
    };

    const lines = ctx.tier === 1 ? theme.renderMinimal(ctx)
                : ctx.tier === 2 ? theme.renderCompact(ctx)
                : theme.renderFull(ctx);

    // Stable height: pad to prevent input box jitter
    const tierKey = tier === 1 ? 'minimal' : tier === 2 ? 'compact' : 'full';
    const targetHeight = theme.layout.stableHeight[tierKey];
    while (lines.length < targetHeight) {
      lines.push('');
    }

    // Write session file
    writeSessionFile(ctx);

    deps.writeOutput(lines);

    debug('claude-code-cockpit finished');
  } catch (error) {
    debug('error:', error);
    try {
      const msg = stdin?.model?.display_name || 'cockpit';
      deps.writeOutput([`[${msg}] render error`]);
    } catch { /* silent */ }
  } finally {
    flushCache();
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
