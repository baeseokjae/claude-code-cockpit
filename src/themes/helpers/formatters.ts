/**
 * Display formatters for individual data items
 */

import type { RenderContext, ColorPalette, IconSet } from '../../types/index.js';
import { hex } from '../../render/colors.js';
import { formatLines, formatLinesCompact } from '../../data/lines.js';
import { formatCacheHitRate, formatCacheSavings } from '../../data/cache-metrics.js';
import type { TextTransform } from './data-extraction.js';

// ============================================
// Detail Summary Types & Functions
// ============================================

export interface DetailSummaryOptions {
  palette: ColorPalette;
  icons: IconSet;
  transform?: TextTransform;
  useColor?: boolean;
}

export function formatDetailToolsSummary(
  tools: RenderContext['transcript']['tools'],
  options: DetailSummaryOptions
): string | null {
  if (tools.length === 0) return null;
  const { palette, icons } = options;
  const counts = new Map<string, number>();
  for (const tool of tools) {
    counts.set(tool.name, (counts.get(tool.name) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const items = sorted.slice(0, 5).map(([name, count]) => {
    const displayName = options.transform?.case === 'upper' ? name.toUpperCase() : name;
    return options.useColor !== false
      ? hex(palette.text, `${displayName} x${count}`)
      : `${displayName} x${count}`;
  });
  const label = options.useColor !== false
    ? hex(palette.categoryTools, icons.categoryTools + ' Tools: ')
    : icons.categoryTools + ' Tools: ';
  return label + items.join('  ') +
    (options.useColor !== false
      ? hex(palette.muted, ` (${tools.length})`)
      : ` (${tools.length})`);
}

export function formatDetailAgentsSummary(
  agents: RenderContext['transcript']['agents'],
  options: DetailSummaryOptions
): string | null {
  if (agents.length === 0) return null;
  const { palette, icons } = options;

  // Dedup by type with models, tools, status
  const agentMap = new Map<string, { count: number; totalTools: number; isRunning: boolean; errorCount: number; models: Set<string> }>();
  for (const agent of agents) {
    const key = agent.type;
    const existing = agentMap.get(key);
    const modelChar = agent.model ? agent.model[0].toUpperCase() : '';
    const toolCount = agent.subagentToolCount || 0;
    const isRunning = agent.status === 'running';
    const hasError = agent.status === 'error';
    if (existing) {
      existing.count++;
      existing.totalTools += toolCount;
      if (isRunning) existing.isRunning = true;
      if (hasError) existing.errorCount++;
      if (modelChar) existing.models.add(modelChar);
    } else {
      const models = new Set<string>();
      if (modelChar) models.add(modelChar);
      agentMap.set(key, { count: 1, totalTools: toolCount, isRunning, errorCount: hasError ? 1 : 0, models });
    }
  }

  const sorted = [...agentMap.entries()].sort((a, b) => b[1].count - a[1].count);
  const items = sorted.slice(0, 3).map(([type, info]) => {
    const displayType = options.transform?.case === 'upper' ? type.toUpperCase() : type;
    const modelStr = info.models.size > 0 ? `[${[...info.models].join('/')}]` : '';
    const toolStr = info.totalTools > 0 ? `⚡${info.totalTools}` : '';
    const errorStr = info.errorCount > 0 ? `✗${info.errorCount}` : '';
    const detail = modelStr + toolStr + errorStr;

    if (options.useColor !== false) {
      return hex(palette.text, `${displayType} x${info.count}`) +
        (detail ? ' ' + hex(palette.muted, detail) : '');
    }
    return `${displayType} x${info.count}` + (detail ? ` ${detail}` : '');
  });

  const label = options.useColor !== false
    ? hex(palette.categoryAgents, icons.categoryAgents + ' Agents: ')
    : icons.categoryAgents + ' Agents: ';
  return label + items.join('  ') +
    (options.useColor !== false
      ? hex(palette.muted, ` (${agents.length})`)
      : ` (${agents.length})`);
}

export function formatDetailTodosSummary(
  todos: RenderContext['transcript']['todos'],
  options: DetailSummaryOptions
): string | null {
  if (todos.length === 0) return null;
  const { palette, icons } = options;
  const total = todos.length;
  const completed = todos.filter((t) => t.status === 'completed').length;
  const inProgress = todos.find((t) => t.status === 'in_progress');
  const label = options.useColor !== false
    ? hex(palette.categoryTodos, icons.categoryTodos + ' Todos: ')
    : icons.categoryTodos + ' Todos: ';
  if (inProgress) {
    const content = inProgress.content.substring(0, 20) + (inProgress.content.length > 20 ? '...' : '');
    return label +
      (options.useColor !== false
        ? hex(palette.yellow, '▶ ') + hex(palette.text, content) + hex(palette.muted, ` (${completed}/${total})`)
        : `▶ ${content} (${completed}/${total})`);
  }
  if (completed === total && total > 0) {
    return label +
      (options.useColor !== false
        ? hex(palette.green, '✓ ') + hex(palette.text, 'All completed') + hex(palette.muted, ` (${total}/${total})`)
        : `✓ All completed (${total}/${total})`);
  }
  return label + (options.useColor !== false ? hex(palette.muted, `${completed}/${total}`) : `${completed}/${total}`);
}

// ============================================
// Lines Display Helpers
// ============================================

export function formatLinesDisplay(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet,
  mode: 'full' | 'compact' = 'full'
): string | null {
  if (!ctx.config.display.showLines || !ctx.linesData) {
    return null;
  }

  const formatted = mode === 'compact'
    ? formatLinesCompact(ctx.linesData)
    : formatLines(ctx.linesData);

  return hex(palette.blue, icons.lines) + ' ' + hex(palette.text, formatted);
}

// ============================================
// Cache Metrics Display Helpers
// ============================================

export function formatCacheDisplay(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet,
  mode: 'compact' | 'full' = 'full'
): string | null {
  if (!ctx.config.display.showCacheMetrics || !ctx.cacheMetrics) {
    return null;
  }

  const hitRate = formatCacheHitRate(ctx.cacheMetrics);
  const savings = formatCacheSavings(ctx.cacheMetrics);

  if (mode === 'compact') {
    return hex(palette.teal, icons.cache) + ' ' + hex(palette.text, hitRate);
  }

  return hex(palette.teal, icons.cache) + ' ' + hex(palette.text, `${hitRate} ~${savings}`);
}

// ============================================
// Git Tag Display Helper
// ============================================

export function formatGitTagDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.config.display.showGitTag || !ctx.gitStatus?.tag) {
    return null;
  }

  return hex(palette.mauve, ctx.gitStatus.tag);
}

// ============================================
// Git Activity Display Helper
// ============================================

export function formatGitActivityDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.config.display.showGitActivity || !ctx.gitActivity) {
    return null;
  }

  const { commits, pullRequests } = ctx.gitActivity;

  if (commits === 0 && pullRequests === 0) {
    return null;
  }

  const parts: string[] = [];
  if (commits > 0) {
    parts.push(hex(palette.green, `+${commits} commit${commits > 1 ? 's' : ''}`));
  }
  if (pullRequests > 0) {
    parts.push(hex(palette.blue, `+${pullRequests} PR${pullRequests > 1 ? 's' : ''}`));
  }

  return parts.join('  ');
}

// ============================================
// Tool Stats Display Helper
// ============================================

export function formatToolStatsDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.config.display.showToolStats || !ctx.toolStats) {
    return null;
  }

  const { total, success, error } = ctx.toolStats;

  if (total === 0) {
    return null;
  }

  return hex(palette.text, 'Tools: ') +
    hex(palette.text, `${total}`) + ' ' +
    `(${hex(palette.green, `✓${success}`)} ${hex(palette.red, `✗${error}`)})`;
}

// ============================================
// Bash Errors Display Helper
// ============================================

export function formatBashErrorsDisplay(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet
): string | null {
  if (!ctx.config.display.showBashErrors || !ctx.bashErrors || ctx.bashErrors.length === 0) {
    return null;
  }

  const count = ctx.bashErrors.length;
  const exitCodes = [...new Set(ctx.bashErrors.map(e => e.exitCode))];
  const codesStr = exitCodes.slice(0, 2).join(', ');

  return hex(palette.red, icons.error) + ' ' +
    hex(palette.red, `Bash: ${count} error${count > 1 ? 's' : ''}`) +
    hex(palette.muted, ` (${codesStr}${exitCodes.length > 2 ? '...' : ''})`);
}

// ============================================
// Compact Suggestion Display Helper
// ============================================

export function formatCompactSuggestionDisplay(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet
): string | null {
  if (!ctx.compactSuggestion?.shouldSuggest) {
    return null;
  }

  const { totalToolCalls } = ctx.compactSuggestion;
  return hex(palette.yellow, icons.warning) + ' ' +
    hex(palette.yellow, `${totalToolCalls} calls`) + ' ' +
    hex(palette.muted, 'try /compact');
}

// ============================================
// Violations Display Helper
// ============================================

export function formatViolationsDisplay(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet
): string | null {
  if (!ctx.violations || ctx.violations.total === 0) {
    return null;
  }

  const { total, byType } = ctx.violations;
  const parts: string[] = [];

  const consoleCount = byType.get('console_log') || 0;
  const secretCount = byType.get('hardcoded_secret') || 0;
  const largeFileCount = byType.get('large_file') || 0;

  if (secretCount > 0) {
    parts.push(hex(palette.red, `${icons.error} ${secretCount} secret${secretCount > 1 ? 's' : ''}`));
  }

  if (consoleCount > 0) {
    parts.push(hex(palette.yellow, `${icons.warning} ${consoleCount} console.log`));
  }

  if (largeFileCount > 0) {
    parts.push(hex(palette.yellow, `${icons.warning} ${largeFileCount} large file${largeFileCount > 1 ? 's' : ''}`));
  }

  if (parts.length === 0 && total > 0) {
    parts.push(hex(palette.yellow, `${icons.warning} ${total} violation${total > 1 ? 's' : ''}`));
  }

  return parts.join(' ');
}

// ============================================
// Workflow Phase Display Helper
// ============================================

export function formatWorkflowPhaseDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.workflowState || ctx.workflowState.currentPhase === 'UNKNOWN') {
    return null;
  }

  const { currentPhase, confidence } = ctx.workflowState;

  const phaseColors: Record<string, string> = {
    'PLAN': palette.blue,
    'IMPLEMENT': palette.green,
    'REVIEW': palette.mauve,
  };

  const color = phaseColors[currentPhase] || palette.muted;
  const confidenceStr = confidence >= 70 ? '' : ` (${confidence}%)`;

  return hex(color, `[${currentPhase}]`) + hex(palette.muted, confidenceStr);
}

// ============================================
// Test Coverage Display Helper
// ============================================

export function formatTestCoverageDisplay(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet
): string | null {
  if (!ctx.testCoverage || !ctx.testCoverage.coverage?.hasData) {
    return null;
  }

  const { overall } = ctx.testCoverage.coverage;
  const avgCoverage = Math.round((overall.statements + overall.branches + overall.functions + overall.lines) / 4);

  const color = avgCoverage >= 80 ? palette.green :
    avgCoverage >= 60 ? palette.yellow :
      palette.red;

  return hex(palette.teal, icons.success) + ' ' + hex(color, `${avgCoverage}%`);
}

// ============================================
// Pass@k Display Helper
// ============================================

export function formatPassAtKDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.passAtK || !ctx.passAtK.hasData || !ctx.passAtK.metrics) {
    return null;
  }

  const { passAt1 } = ctx.passAtK.metrics;

  const color = passAt1 >= 80 ? palette.green :
    passAt1 >= 60 ? palette.yellow :
      palette.red;

  return hex(palette.text, '1st-try: ') + hex(color, `${passAt1}%`);
}

// ============================================
// Git Worktrees Display Helper
// ============================================

export function formatGitWorktreesDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.gitStatus?.worktrees || ctx.gitStatus.worktrees.length <= 1) {
    return null;
  }

  const count = ctx.gitStatus.worktrees.length;
  const dirtyCount = ctx.gitStatus.worktrees.filter(w => w.isDirty).length;

  if (dirtyCount > 0) {
    return hex(palette.yellow, `${count} worktrees`) + ' ' +
      hex(palette.red, `(${dirtyCount} dirty)`);
  }

  return hex(palette.text, `${count} worktrees`);
}

// ============================================
// MCP Status Display Helper
// ============================================

export function formatMcpStatusDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.mcpStatus || !ctx.mcpStatus.hasServers) {
    return null;
  }

  const { serverCount, totalToolCalls } = ctx.mcpStatus;

  if (totalToolCalls === 0) {
    return hex(palette.muted, `${serverCount} MCP servers`);
  }

  return hex(palette.teal, `MCP: ${serverCount} servers`) + ' ' +
    hex(palette.text, `(${totalToolCalls} calls)`);
}

// ============================================
// Instance Sync Display Helper
// ============================================

export function formatInstanceSyncDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.instanceSync || !ctx.instanceSync.hasMultipleInstances) {
    return null;
  }

  const { instanceCount, conflictCount, hasActiveTeam } = ctx.instanceSync;

  if (conflictCount > 0) {
    return hex(palette.mauve, `${instanceCount} instances`) + ' ' +
      hex(palette.red, `(${conflictCount} conflict${conflictCount > 1 ? 's' : ''}!)`);
  }

  if (hasActiveTeam) {
    return hex(palette.mauve, `${instanceCount} instances`) + ' ' +
      hex(palette.teal, '(team)');
  }

  return hex(palette.mauve, `${instanceCount} instances`);
}
