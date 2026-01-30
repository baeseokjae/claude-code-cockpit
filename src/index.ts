#!/usr/bin/env node

/**
 * Claude Code Cockpit main entry point
 */

import type { RenderContext, TranscriptData } from './types/index.js';
import { readStdin, getCwd } from './input/stdin.js';
import { parseTranscript } from './input/transcript.js';
import { countConfigs } from './input/config-reader.js';
import { parseExtraCmdArg } from './input/cli.js';
import { getGitStatus } from './data/git.js';
import { formatSessionDuration } from './data/time.js';
import { fetchUsage } from './data/usage-api.js';
import { checkAlerts } from './data/alerts.js';
import { loadConfig } from './config/loader.js';
import { loadTheme } from './themes/index.js';
import { writeOutput } from './output/writer.js';
import { createDebug } from './utils/debug.js';

const debug = createDebug('main');

export interface MainDeps {
  readStdin: typeof readStdin;
  parseTranscript: typeof parseTranscript;
  countConfigs: typeof countConfigs;
  getGitStatus: typeof getGitStatus;
  fetchUsage: typeof fetchUsage;
  checkAlerts: typeof checkAlerts;
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
  checkAlerts,
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
    const transcript: TranscriptData = await deps.parseTranscript(transcriptPath);

    const cwd = getCwd(stdin);
    const configCounts = deps.countConfigs(cwd);

    const gitStatus = await deps.getGitStatus(cwd || undefined);

    const durationMs = stdin.cost?.total_duration_ms || 0;
    const sessionDuration = formatSessionDuration(durationMs);

    const extraLabel = null;

    const usageData = config.display.showUsage ? await deps.fetchUsage() : null;

    const alerts = deps.checkAlerts(stdin, usageData);

    const ctx: RenderContext = {
      stdin,
      transcript,
      config,
      configCounts,
      gitStatus,
      usageData,
      extraLabel,
      sessionDuration,
      theme,
      detailMode: config.detailMode,
      alerts,
    };

    const lines = theme.render(ctx);

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
