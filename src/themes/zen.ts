/**
 * Zen theme - Ultra minimal, calm
 *
 * Display Tiers:
 * - Tier 1 (renderMinimal): Model, context%, duration
 * - Tier 2 (renderCompact): Tier 1 + project, Git
 * - Tier 3 (renderFull): Tier 2 + activity summary
 */

import type { Theme, RenderContext } from '../types/index.js';
import { ZEN_PALETTE } from './palettes/zen.js';
import { getIcons } from './icons.js';
import { hex } from '../render/colors.js';
import { formatPercent } from '../render/utils.js';
import { getModelName, getContextPercent } from '../input/stdin.js';
import { hyperlink, fileUrl, githubBranchUrl } from '../render/links.js';

/**
 * Zen theme - Minimal information, maximum serenity
 */
export const zenTheme: Theme = {
  name: 'zen',

  palette: ZEN_PALETTE,

  chars: {
    progressFilled: '━',
    progressEmpty: '┅',
    boxCornerTL: ' ',
    boxCornerTR: ' ',
    boxCornerBL: ' ',
    boxCornerBR: ' ',
    boxHorizontal: ' ',
    boxVertical: ' ',
    separator: '·',
  },

  icons: getIcons(),

  layout: {
    minWidth: 30,
    compactWidth: 50,
    fullWidth: 80,
  },

  features: {
    useGradientProgress: false,
    showBoxBorders: false,
    animatedSpinner: false,
    blinkOnCritical: false,
  },

  render(ctx: RenderContext): string[] {
    const width = process.stdout.columns || 80;

    if (width < this.layout.compactWidth) {
      return this.renderMinimal(ctx);
    } else if (width < this.layout.fullWidth) {
      return this.renderCompact(ctx);
    } else {
      return this.renderFull(ctx);
    }
  },

  renderMinimal(ctx: RenderContext): string[] {
    const model = getModelName(ctx.stdin).toLowerCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '?';
    const duration = ctx.sessionDuration;

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? `[${sessionName}] ` : '';

    // Ultra simple
    return [hex(this.palette.subtext, `${sessionText}${model} ${percentStr} · ${duration}`)];
  },

  renderCompact(ctx: RenderContext): string[] {
    const model = getModelName(ctx.stdin).toLowerCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '?';

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? `[${sessionName}] ` : '';

    const projectGit = formatProjectGit(ctx);
    const duration = ctx.sessionDuration;

    const line = `${sessionText}${model} ${percentStr}${projectGit} · ${duration}`;
    return [hex(this.palette.subtext, line)];
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];

    // Line 1: Basic info
    const model = getModelName(ctx.stdin).toLowerCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '?';

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionPart = sessionName ? `[${sessionName}]` : null;

    const projectGit = formatProjectGit(ctx);
    const duration = ctx.sessionDuration;

    // Usage (Zen style: minimal)
    const usage = ctx.config.display.showUsage && ctx.usageData
      ? `5h:${Math.round(ctx.usageData.fiveHour)}%`
      : null;

    const line1Parts = [sessionPart, model, percentStr, projectGit, usage, duration].filter(Boolean);
    lines.push(hex(this.palette.subtext, line1Parts.join(' · ')));

    // Line 2: Activity (when present)
    const activityParts: string[] = [];

    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const running = ctx.transcript.tools.find((t) => t.status === 'running');
      if (running) {
        activityParts.push(hex(this.palette.categoryTools, 'tools ') + hex(this.palette.text, `${running.name.toLowerCase()}~`));
      } else {
        const completed = ctx.transcript.tools.filter((t) => t.status === 'completed').length;
        if (completed > 0) {
          activityParts.push(hex(this.palette.categoryTools, 'tools ') + hex(this.palette.muted, `${completed} done`));
        }
      }
    }

    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const running = ctx.transcript.agents.find((a) => a.status === 'running');
      if (running) {
        activityParts.push(hex(this.palette.categoryAgents, 'agents ') + hex(this.palette.teal, `${running.type.toLowerCase()}~`));
      }
    }

    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const total = ctx.transcript.todos.length;
      const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
      const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

      if (current) {
        activityParts.push(hex(this.palette.categoryTodos, 'todos ') + hex(this.palette.yellow, `${current.content.substring(0, 20).toLowerCase()}`));
      }
      activityParts.push(hex(this.palette.categoryTodos, 'todos ') + hex(this.palette.muted, `${completed}/${total}`));
    }

    if (activityParts.length > 0) {
      lines.push(activityParts.join(hex(this.palette.muted, ' · ')));
    }

    return lines;
  },
};

/**
 * Format project and git with parentheses and clickable links (Zen style: minimal)
 */
function formatProjectGit(ctx: RenderContext): string {
  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : null;
  const git = ctx.gitStatus?.branch || '';
  const dirty = ctx.gitStatus?.isDirty ? '*' : '';

  if (!project && !git) return '';

  let result = '';

  // Project name with file:// link
  if (project && ctx.stdin.cwd) {
    const projectLink = hyperlink(fileUrl(ctx.stdin.cwd), project);
    result += projectLink;
  }

  // Git branch with GitHub link (if available)
  if (git) {
    const branchText = `${git}${dirty}`;

    if (ctx.gitStatus?.remoteUrl) {
      const branchUrl = githubBranchUrl(ctx.gitStatus.remoteUrl, git);
      const branchLink = hyperlink(branchUrl, branchText);
      result += ` (${branchLink})`;
    } else {
      result += ` (${branchText})`;
    }
  }

  return result;
}
