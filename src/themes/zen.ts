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
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getModelName, getContextPercent, getAbsoluteTokens } from '../input/stdin.js';
import {
  formatLinesDisplay,
  formatCacheDisplay,
  collectActivityWidgets,
  getVisibleWidgets,
  hasAbnormalState,
  formatProjectGit,
  formatContextHint,
} from './helpers.js';

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
    stableHeight: { minimal: 1, compact: 1, full: 2 },
  },

  features: {
    useGradientProgress: false,
    showBoxBorders: false,
    animatedSpinner: false,
    blinkOnCritical: false,
  },

  render(ctx: RenderContext): string[] {
    const width = ctx.width;

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

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextStr = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextStr = `${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k`;
    } else {
      contextStr = percentStr;
    }

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? `[${sessionName}] ` : '';

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText} ·` : '';

    // Ultra simple
    const contextHint = formatContextHint(percent, this.palette) || '';
    return [hex(this.palette.subtext, `${sessionText}${model} ${contextStr}`) + contextHint + hex(this.palette.subtext, `${linesDisplay} · ${duration}`)];
  },

  renderCompact(ctx: RenderContext): string[] {
    const model = getModelName(ctx.stdin).toLowerCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '?';

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextStr = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextStr = `${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k`;
    } else {
      contextStr = percentStr;
    }

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? `[${sessionName}] ` : '';

    const projectGit = formatProjectGit(ctx, null, null, { subrepoStyle: 'minimal' });
    const duration = ctx.sessionDuration;

    // Token speed (Zen style: minimal)
    const speed = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? formatTokenSpeed(ctx.tokenSpeed, 'output')
      : null;

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? linesText : null;

    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'compact');
    const cacheDisplay = cacheText ? cacheText : null;

    const compactContextHint = formatContextHint(percent, this.palette) || '';
    const parts = [sessionText ? sessionText.trim() : null, model, contextStr, projectGit || null, linesDisplay, cacheDisplay, speed, duration].filter(Boolean);
    const joined = hex(this.palette.subtext, parts.join(' · '));
    return [compactContextHint ? joined + compactContextHint : joined];
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];

    // Line 1: Basic info
    const model = getModelName(ctx.stdin).toLowerCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '?';

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextStr = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextStr = `${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k`;
    } else {
      contextStr = percentStr;
    }

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionPart = sessionName ? `[${sessionName}]` : null;

    const projectGit = formatProjectGit(ctx, null, null, { subrepoStyle: 'minimal' });
    const duration = ctx.sessionDuration;

    // Usage (Zen style: minimal)
    const usage = ctx.config.display.showUsage && ctx.usageData
      ? `5h:${Math.round(ctx.usageData.fiveHour)}%`
      : null;

    // Token speed (Zen style: minimal, muted)
    const speed = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? formatTokenSpeed(ctx.tokenSpeed, 'output')
      : null;

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? linesText : null;

    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'full');
    const cacheDisplay = cacheText ? cacheText : null;

    const line1Parts = [sessionPart, model, contextStr, projectGit, linesDisplay, cacheDisplay, usage, speed, duration].filter(Boolean);
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
        activityParts.push(hex(this.palette.categoryAgents, 'agents ') + hex(this.palette.teal, running.type.toLowerCase()));
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

    if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
      const running = ctx.transcript.skills.find((s) => s.status === 'running');
      if (running) {
        activityParts.push(hex(this.palette.mauve, 'skills ') + hex(this.palette.text, `${running.name.toLowerCase()}~`));
      } else {
        const total = ctx.transcript.skills.length;
        activityParts.push(hex(this.palette.mauve, 'skills ') + hex(this.palette.muted, `${total}`));
      }
    }

    // Activity widgets (detailMode shows all widgets)
    const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
    const abnormal = hasAbnormalState(ctx);
    const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
    activityParts.push(...visible.map(w => w.text));

    if (activityParts.length > 0) {
      lines.push(activityParts.join(hex(this.palette.muted, ' · ')));
    }

    return lines;
  },
};

