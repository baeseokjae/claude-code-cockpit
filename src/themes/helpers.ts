/**
 * Theme helper functions
 * Common logic extracted from individual themes
 */

import type { RenderContext, ColorPalette, IconSet } from '../types/index.js';
import { fileUrl, githubBranchUrl, hyperlink } from '../render/links.js';
import { hex } from '../render/colors.js';
import { formatLines, formatLinesCompact } from '../data/lines.js';
import { formatCacheHitRate, formatCacheSavings } from '../data/cache-metrics.js';

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
  const counts = new Map<string, number>();
  for (const agent of agents) {
    counts.set(agent.type, (counts.get(agent.type) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const items = sorted.slice(0, 3).map(([type, count]) => {
    const displayType = options.transform?.case === 'upper' ? type.toUpperCase() : type;
    return options.useColor !== false
      ? hex(palette.text, `${displayType} x${count}`)
      : `${displayType} x${count}`;
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
  const completed = todos.filter((t: any) => t.status === 'completed').length;
  const inProgress = todos.find((t: any) => t.status === 'in_progress');
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
// Types
// ============================================

export interface TextTransform {
  case: 'none' | 'upper' | 'lower';
}

export interface ActivityWidget {
  text: string;
  category: 'critical' | 'warning' | 'info' | 'analytics';
  priority: number; // 0-99 (낮을수록 우선순위 높음)
}

// ============================================
// Percent Color (fully identical across themes)
// ============================================

export function getPercentColor(
  percent: number | null,
  palette: ColorPalette
): string {
  if (percent === null) return palette.text;
  if (percent >= 90) return palette.progressCritical;
  if (percent >= 75) return palette.progressHigh;
  if (percent >= 50) return palette.progressMid;
  return palette.progressLow;
}

// ============================================
// Text Transform Helper
// ============================================

export function applyTextTransform(text: string, transform: TextTransform): string {
  switch (transform.case) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    default: return text;
  }
}

// ============================================
// Session Name Helper
// ============================================

export function getSessionName(ctx: RenderContext): string | null {
  if (!ctx.config.display.showSessionName) return null;
  return ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8) || null;
}

// ============================================
// Tool Count Aggregation (pure logic)
// ============================================

export interface ToolCounts {
  counts: Map<string, number>;
  runningTool: string | null;
  total: number;
}

export function aggregateToolCounts(ctx: RenderContext): ToolCounts {
  const counts = new Map<string, number>();
  let runningTool: string | null = null;

  for (const tool of ctx.transcript.tools) {
    counts.set(tool.name, (counts.get(tool.name) || 0) + 1);
    if (tool.status === 'running') {
      runningTool = tool.name;
    }
  }

  return { counts, runningTool, total: ctx.transcript.tools.length };
}

// ============================================
// Agent Aggregation (pure logic)
// ============================================

export interface AgentSummary {
  type: string;
  model: string | null;
  isRunning: boolean;
}

export function aggregateAgents(ctx: RenderContext, limit = 2): AgentSummary[] {
  return ctx.transcript.agents.slice(0, limit).map((agent) => ({
    type: agent.type,
    model: agent.model || null,
    isRunning: agent.status === 'running',
  }));
}

// ============================================
// Todo Aggregation (pure logic)
// ============================================

export interface TodoSummary {
  total: number;
  completed: number;
  inProgress: { content: string } | null;
}

export function aggregateTodos(ctx: RenderContext): TodoSummary {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgressTodo = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  return {
    total,
    completed,
    inProgress: inProgressTodo ? { content: inProgressTodo.content } : null,
  };
}

// ============================================
// Project/Git Data Extraction (pure data)
// ============================================

export interface ProjectGitResult {
  project: string | null;
  projectUrl: string | null;
  branch: string | null;
  branchUrl: string | null;
  dirty: boolean;
  subRepos: Array<{ path: string; branch: string; isDirty: boolean }>;
}

/**
 * Extract project/git data from context (pure data, no formatting)
 */
export function extractProjectGitData(ctx: RenderContext): ProjectGitResult {
  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() || null : null;
  const projectUrl = ctx.stdin.cwd ? fileUrl(ctx.stdin.cwd) : null;
  const branch = ctx.gitStatus?.branch || null;
  const branchUrl = ctx.gitStatus?.remoteUrl && branch
    ? githubBranchUrl(ctx.gitStatus.remoteUrl, branch)
    : null;
  const dirty = ctx.gitStatus?.isDirty || false;
  const subRepos = ctx.gitStatus?.subRepos || [];

  return { project, projectUrl, branch, branchUrl, dirty, subRepos };
}

// ============================================
// Project/Git Formatting
// ============================================

export interface FormatProjectGitOptions {
  transform?: TextTransform;
  branchColor?: string;
  showFileStats?: boolean;
  prefix?: string;
  projectPrefix?: string;
  branchPrefix?: string;
  subrepoStyle?: 'full' | 'minimal';
}

/**
 * Format project and git information with theme-specific options
 */
export function formatProjectGit(
  ctx: RenderContext,
  palette: ColorPalette | null,
  _icons: IconSet | null,
  options: FormatProjectGitOptions = {}
): string {
  const {
    transform = { case: 'none' },
    branchColor,
    showFileStats = false,
    prefix = '',
    projectPrefix = '',
    branchPrefix = '',
    subrepoStyle = 'full',
  } = options;

  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : null;
  const git = ctx.config.display.showGit ? (ctx.gitStatus?.branch || '') : '';
  const dirty = ctx.gitStatus?.isDirty ? '*' : '';

  if (!project && !git) return '';

  let result = prefix;

  // Project name with file:// link
  if (project && ctx.stdin.cwd) {
    const projectName = applyTextTransform(project, transform);
    const projectLink = hyperlink(fileUrl(ctx.stdin.cwd), projectName);

    if (palette) {
      result += hex(palette.teal, projectPrefix + projectLink);
    } else {
      result += projectPrefix + projectLink;
    }
  }

  // Git branch with GitHub link (if available)
  if (git) {
    let branchText = applyTextTransform(git, transform);

    // Add tag if available
    if (ctx.gitStatus?.tag) {
      const tagText = applyTextTransform(ctx.gitStatus.tag, transform);
      branchText += ` ${tagText}`;
    }

    branchText += dirty;

    // Add file stats if enabled (Aurora feature)
    if (showFileStats && ctx.config.display.showGitFileStats && ctx.gitStatus?.fileStats) {
      const stats = ctx.gitStatus.fileStats;
      const parts: string[] = [];

      if (stats.modified > 0) parts.push(`!${stats.modified}`);
      if (stats.added > 0) parts.push(`+${stats.added}`);
      if (stats.deleted > 0) parts.push(`✘${stats.deleted}`);
      if (stats.untracked > 0) parts.push(`?${stats.untracked}`);

      if (parts.length > 0) {
        branchText += ` ${parts.join(' ')}`;
      }
    }

    if (ctx.gitStatus?.remoteUrl) {
      const branchUrl = githubBranchUrl(ctx.gitStatus.remoteUrl, ctx.gitStatus.branch || git);
      const branchLink = hyperlink(branchUrl, branchText);

      if (palette) {
        const color = branchColor || palette.teal;
        result += hex(color, `${branchPrefix ? '  ' + branchPrefix : ''} (${branchLink})`);
      } else {
        result += `${branchPrefix ? '  ' + branchPrefix : ''} (${branchLink})`;
      }
    } else {
      if (palette) {
        const color = branchColor || palette.teal;
        result += hex(color, `${branchPrefix ? '  ' + branchPrefix : ''} (${branchText})`);
      } else {
        result += `${branchPrefix ? '  ' + branchPrefix : ''} (${branchText})`;
      }
    }
  }

  // Subdirectory repos (monorepo support)
  if (ctx.config.display.showAllBranches && ctx.gitStatus?.subRepos && ctx.gitStatus.subRepos.length > 0) {
    const limit = subrepoStyle === 'minimal' ? 2 : 3;
    const subItems = ctx.gitStatus.subRepos.slice(0, limit).map((sub) => {
      const subDirty = sub.isDirty ? '*' : '';
      const path = applyTextTransform(sub.path, transform);
      const branch = applyTextTransform(sub.branch, transform);

      if (subrepoStyle === 'minimal') {
        return `${path}:${branch}${subDirty}`;
      }
      return `${path}(${branch}${subDirty})`;
    });

    const remaining = ctx.gitStatus.subRepos.length - limit;
    const moreText = remaining > 0 ? ` +${remaining}` : '';

    const label = subrepoStyle === 'minimal' ? '' :
                  transform.case === 'upper' ? 'SUBS: ' : 'sub: ';

    if (palette) {
      result += hex(palette.muted, `  ${label}${subItems.join(' ')}${moreText}`);
    } else {
      result += ` ${label}${subItems.join(' ')}${moreText}`;
    }
  }

  return result;
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

  return hex(palette.text, 'Pass@1: ') + hex(color, `${passAt1}%`);
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
// Performance Metrics Display Helper
// ============================================

export function formatPerformanceMetricsDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.performanceMetrics || !ctx.performanceMetrics.hasData) {
    return null;
  }

  const parts: string[] = [];

  if (ctx.performanceMetrics.build.hasBuildScript && ctx.performanceMetrics.build.lastBuildTime) {
    const timeS = Math.round(ctx.performanceMetrics.build.lastBuildTime / 1000);
    parts.push(hex(palette.text, `Build: ${timeS}s`));
  }

  if (ctx.performanceMetrics.test.hasTestScript && ctx.performanceMetrics.test.lastTestTime) {
    const timeS = Math.round(ctx.performanceMetrics.test.lastTestTime / 1000);
    const status = ctx.performanceMetrics.test.lastTestStatus;
    const color = status === 'pass' ? palette.green :
                  status === 'fail' ? palette.red :
                  palette.muted;
    parts.push(hex(color, `Test: ${timeS}s`));
  }

  return parts.length > 0 ? parts.join(' ') : null;
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
// Security Dashboard Display Helper
// ============================================

export function formatSecurityDashboardDisplay(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet
): string | null {
  if (!ctx.securityDashboard || !ctx.securityDashboard.hasIssues) {
    return null;
  }

  const { score, criticalCount, highCount } = ctx.securityDashboard;

  const scoreColor = score.overall >= 80 ? palette.green :
                     score.overall >= 60 ? palette.yellow :
                     palette.red;

  if (criticalCount > 0) {
    return hex(palette.red, icons.error) + ' ' +
           hex(palette.red, `${criticalCount} critical`) + ' ' +
           hex(scoreColor, `(${score.overall})`);
  }

  if (highCount > 0) {
    return hex(palette.yellow, icons.warning) + ' ' +
           hex(palette.yellow, `${highCount} high`) + ' ' +
           hex(scoreColor, `(${score.overall})`);
  }

  return hex(scoreColor, `Security: ${score.overall}`);
}

// ============================================
// Learning Tracker Display Helper
// ============================================

export function formatLearningTrackerDisplay(
  ctx: RenderContext,
  palette: ColorPalette
): string | null {
  if (!ctx.learningTracker || !ctx.learningTracker.hasLearnings) {
    return null;
  }

  const { patterns, improvements } = ctx.learningTracker;

  if (patterns.length > 0) {
    return hex(palette.blue, `${patterns.length} patterns`) + ' ' +
           hex(palette.muted, `learned`);
  }

  if (improvements.length > 0) {
    return hex(palette.yellow, `${improvements.length} suggestions`);
  }

  return null;
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

// ============================================
// Collect Activity Widgets (Common Function)
// ============================================

export function collectActivityWidgets(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet
): ActivityWidget[] {
  const widgets: ActivityWidget[] = [];

  // P0: Critical errors (priority 0-19)
  const bashErrorsText = formatBashErrorsDisplay(ctx, palette, icons);
  if (bashErrorsText) {
    const priority = ctx.bashErrors && ctx.bashErrors.length > 0 ? 0 : 10;
    widgets.push({ text: bashErrorsText, category: 'critical', priority });
  }

  const violationsText = formatViolationsDisplay(ctx, palette, icons);
  if (violationsText) {
    // secrets는 priority 5, 나머지는 15
    const hasSecrets = (ctx.violations?.byType.get('hardcoded_secret') || 0) > 0;
    const priority = hasSecrets ? 5 : 15;
    widgets.push({ text: violationsText, category: 'critical', priority });
  }

  const securityText = formatSecurityDashboardDisplay(ctx, palette, icons);
  if (securityText && ctx.config.display.showSecurityDashboard) {
    const priority = (ctx.securityDashboard?.criticalCount || 0) > 0 ? 8 : 18;
    widgets.push({ text: securityText, category: 'analytics', priority });
  }

  // P1: Warnings (priority 20-39)
  const compactText = formatCompactSuggestionDisplay(ctx, palette, icons);
  if (compactText) {
    widgets.push({ text: compactText, category: 'warning', priority: 25 });
  }

  // P2: Info (priority 40-59)
  if (ctx.config.display.showGitActivity) {
    const t = formatGitActivityDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 45 });
  }

  if (ctx.config.display.showToolStats) {
    const t = formatToolStatsDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 50 });
  }

  if (ctx.config.display.showWorkflowPhase) {
    const t = formatWorkflowPhaseDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 65 });
  }

  // P3: Analytics (priority 60-79)
  if (ctx.config.display.showTestCoverage) {
    const t = formatTestCoverageDisplay(ctx, palette, icons);
    if (t) widgets.push({ text: t, category: 'analytics', priority: 60 });
  }

  if (ctx.config.display.showPassAtK) {
    const t = formatPassAtKDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'analytics', priority: 70 });
  }

  if (ctx.config.display.showPerformanceMetrics) {
    const t = formatPerformanceMetricsDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'analytics', priority: 75 });
  }

  // P4: Low priority (priority 80-99)
  if (ctx.config.display.showGitWorktrees) {
    const t = formatGitWorktreesDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 80 });
  }

  if (ctx.config.display.showMcpStatus) {
    const t = formatMcpStatusDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 85 });
  }

  if (ctx.config.display.showLearningTracker) {
    const t = formatLearningTrackerDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'analytics', priority: 90 });
  }

  if (ctx.config.display.showInstanceSync) {
    const t = formatInstanceSyncDisplay(ctx, palette);
    if (t) {
      const hasConflict = (ctx.instanceSync?.conflictCount || 0) > 0;
      const priority = hasConflict ? 35 : 95; // 충돌 시 P1으로 부스트
      widgets.push({ text: t, category: 'analytics', priority });
    }
  }

  // 정렬: priority 낮은 순 (0이 최우선)
  return widgets.sort((a, b) => a.priority - b.priority);
}

// ============================================
// Conditional Display Model
// ============================================

export function hasAbnormalState(ctx: RenderContext): boolean {
  return (ctx.bashErrors && ctx.bashErrors.length > 0) ||
         (ctx.violations && ctx.violations.total > 0) ||
         (ctx.transcript.tools.some(t => t.status === 'error'));
}

export function getVisibleWidgets(
  widgets: ActivityWidget[],
  detailMode: boolean,
  hasAbnormalState: boolean
): ActivityWidget[] {
  if (detailMode) return widgets;

  if (hasAbnormalState) {
    // Show critical, warning, and info (exclude analytics)
    return widgets.filter(w => w.category !== 'analytics');
  }

  // Normal state: only critical and warning
  return widgets.filter(w =>
    w.category === 'critical' || w.category === 'warning'
  );
}
