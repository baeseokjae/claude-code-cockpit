/**
 * Theme helper functions
 * Common logic extracted from individual themes
 */

import type { RenderContext, ColorPalette, IconSet } from '../types/index.js';
import { fileUrl, githubBranchUrl } from '../render/links.js';
import { hex } from '../render/colors.js';
import { formatLines, formatLinesCompact } from '../data/lines.js';
import { formatCacheHitRate, formatCacheSavings } from '../data/cache-metrics.js';

// ============================================
// Types
// ============================================

export interface TextTransform {
  case: 'none' | 'upper' | 'lower';
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
