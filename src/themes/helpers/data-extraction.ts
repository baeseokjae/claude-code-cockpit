/**
 * Data extraction and transformation helpers
 */

import type { RenderContext, ColorPalette, AgentEntry } from '../../types/index.js';
import { getModelName, getContextPercent, getAbsoluteTokens } from '../../input/stdin.js';
import { hex, bold } from '../../render/colors.js';
import { formatPercent } from '../../render/utils.js';

const MAX_LENGTHS = {
  sessionName:  { minimal: 10, compact: 20, full: 30 },
  projectName:  { minimal: 12, compact: 25, full: 30 },
  branchName:   { minimal: 15, compact: 25, full: 40 },
} as const;

function tierMaxLen(tier: 1 | 2 | 3, limits: { minimal: number; compact: number; full: number }): number {
  return tier === 1 ? limits.minimal : tier === 2 ? limits.compact : limits.full;
}

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
// Context Action Hint (90%+ -> /compact)
// ============================================

export function formatContextHint(
  percent: number | null,
  palette: ColorPalette
): string | null {
  if (percent === null || percent < 90) return null;
  return hex(palette.progressCritical, ' /compact');
}

export function formatContextHintPlain(
  percent: number | null
): string | null {
  if (percent === null || percent < 90) return null;
  return bold(' /compact');
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
  const name = ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8) || null;
  if (!name) return null;
  const maxLen = tierMaxLen(ctx.tier, MAX_LENGTHS.sessionName);
  return name.length > maxLen ? name.substring(0, maxLen - 1) + '\u2026' : name;
}

// ============================================
// Context Text (absolute tokens vs percentage)
// ============================================

export interface FormatContextTextOptions {
  uppercase?: boolean;    // 'K' vs 'k' for token suffix
  wrap?: (text: string) => string;  // e.g., bold() for neon
}

/**
 * Format context display text: absolute tokens (e.g. "45k/200k") or percentage.
 * Returns plain string (caller wraps with color).
 */
export function formatContextText(
  ctx: RenderContext,
  percentStr: string,
  options: FormatContextTextOptions = {}
): string {
  const { uppercase = false, wrap } = options;
  const absoluteTokens = getAbsoluteTokens(ctx.stdin);
  const suffix = uppercase ? 'K' : 'k';

  let text: string;
  if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
    text = `${Math.round(absoluteTokens.used / 1000)}${suffix}/${Math.round(absoluteTokens.total / 1000)}${suffix}`;
  } else {
    text = percentStr;
  }

  return wrap ? wrap(text) : text;
}

// ============================================
// Agent Deduplication
// ============================================

export interface AgentDedup {
  count: number;
  totalTools: number;
  isRunning: boolean;
  errorCount: number;
  models: Set<string>;
}

export function deduplicateAgents(agents: AgentEntry[]): Map<string, AgentDedup> {
  const agentMap = new Map<string, AgentDedup>();
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
  return agentMap;
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

export interface ProjectGitParts {
  project: string;
  branch: string;
}

/**
 * Format project and git information as separate parts for width-aware layout.
 * project: colored project name (e.g., "claude-code-cockpit")
 * branch: colored branch + subrepo text (e.g., " (main*)")
 */
export function formatProjectGitParts(
  ctx: RenderContext,
  palette: ColorPalette | null,
  options: FormatProjectGitOptions = {}
): ProjectGitParts {
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

  let projectPart = prefix;
  let branchPart = '';

  // Project name (plain text, no hyperlink)
  if (project && ctx.stdin.cwd) {
    let projectName = applyTextTransform(project, transform);

    // Truncate project name to prevent line overflow
    const maxProjectLen = tierMaxLen(ctx.tier, MAX_LENGTHS.projectName);
    if (projectName.length > maxProjectLen) {
      projectName = projectName.substring(0, maxProjectLen - 1) + '\u2026';  // …
    }

    if (palette) {
      projectPart += hex(palette.teal, projectPrefix + projectName);
    } else {
      projectPart += projectPrefix + projectName;
    }
  }

  // Git branch (plain text, no hyperlink)
  if (git) {
    let branchText = applyTextTransform(git, transform);

    // Truncate branch name to prevent line overflow
    const maxBranchLen = tierMaxLen(ctx.tier, MAX_LENGTHS.branchName);
    if (branchText.length > maxBranchLen) {
      branchText = branchText.substring(0, maxBranchLen - 1) + '\u2026';  // …
    }

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

    const branchPrefixStr = branchPrefix ? '  ' + branchPrefix : '';

    if (palette) {
      const color = branchColor || palette.teal;
      branchPart += hex(color, `${branchPrefixStr} (${branchText})`);
    } else {
      branchPart += `${branchPrefixStr} (${branchText})`;
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
      branchPart += hex(palette.muted, `  ${label}${subItems.join(' ')}${moreText}`);
    } else {
      branchPart += ` ${label}${subItems.join(' ')}${moreText}`;
    }
  }

  return { project: projectPart, branch: branchPart };
}

/**
 * Format project and git information with theme-specific options
 */
export function formatProjectGit(
  ctx: RenderContext,
  palette: ColorPalette | null,
  options: FormatProjectGitOptions = {}
): string {
  const parts = formatProjectGitParts(ctx, palette, options);
  return parts.project + parts.branch;
}

// ============================================
// Render Data (common render start values)
// ============================================

export interface RenderData {
  model: string;
  percent: number | null;
  percentStr: string;
  duration: string;
  sessionName: string | null;
}

export interface PrepareRenderDataOptions {
  fallbackPercent?: string;
}

/**
 * Extract common render start values shared across all theme render methods.
 */
export function prepareRenderData(
  ctx: RenderContext,
  options: PrepareRenderDataOptions = {}
): RenderData {
  const { fallbackPercent = '??%' } = options;
  const model = getModelName(ctx.stdin);
  const percent = getContextPercent(ctx.stdin);
  const percentStr = percent !== null ? formatPercent(percent) : fallbackPercent;
  const duration = ctx.sessionDuration;
  const sessionName = getSessionName(ctx);

  return { model, percent, percentStr, duration, sessionName };
}
