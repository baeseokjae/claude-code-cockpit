/**
 * Zen theme - Ultra minimal, calm
 */

import type { Theme, RenderContext } from '../types/index.js';
import { ZEN_PALETTE } from './palettes/zen.js';
import { NERD_ICONS } from './icons.js';
import { hex } from '../render/colors.js';
import { formatPercent } from '../render/utils.js';
import { getModelName, getContextPercent } from '../input/stdin.js';

/**
 * Zen 테마 - 최소한의 정보, 최대한의 평온
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

  icons: NERD_ICONS,

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

    // 극도로 심플하게
    return [hex(this.palette.subtext, `${model} ${percentStr} · ${duration}`)];
  },

  renderCompact(ctx: RenderContext): string[] {
    const model = getModelName(ctx.stdin).toLowerCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '?';

    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : '';
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const duration = ctx.sessionDuration;

    const line = `${model} ${percentStr} · ${project} · ${git}${dirty} · ${duration}`;
    return [hex(this.palette.subtext, line)];
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];

    // Line 1: 기본 정보
    const model = getModelName(ctx.stdin).toLowerCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '?';

    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : '';
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const duration = ctx.sessionDuration;

    const line1Parts = [model, percentStr, project, `${git}${dirty}`, duration].filter(Boolean);
    lines.push(hex(this.palette.subtext, line1Parts.join(' · ')));

    // Line 2: 활동 (있을 때만)
    const activityParts: string[] = [];

    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const running = ctx.transcript.tools.find((t) => t.status === 'running');
      if (running) {
        activityParts.push(hex(this.palette.text, `${running.name.toLowerCase()}~`));
      }

      const completed = ctx.transcript.tools.filter((t) => t.status === 'completed').length;
      if (completed > 0) {
        activityParts.push(hex(this.palette.muted, `${completed} done`));
      }
    }

    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const running = ctx.transcript.agents.find((a) => a.status === 'running');
      if (running) {
        activityParts.push(hex(this.palette.teal, `${running.type.toLowerCase()}~`));
      }
    }

    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const total = ctx.transcript.todos.length;
      const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
      const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

      if (current) {
        activityParts.push(hex(this.palette.yellow, `${current.content.substring(0, 20).toLowerCase()}`));
      }
      activityParts.push(hex(this.palette.muted, `${completed}/${total}`));
    }

    if (activityParts.length > 0) {
      lines.push(activityParts.join(hex(this.palette.muted, ' · ')));
    }

    return lines;
  },
};
