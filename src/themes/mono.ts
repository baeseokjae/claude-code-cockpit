/**
 * Mono theme - Black and white minimal, ASCII compatible
 */

import type { Theme, RenderContext } from '../types/index.js';
import { MONO_PALETTE } from './palettes/mono.js';
import { FALLBACK_ICONS } from './icons.js';
import { dim, bold, underline } from '../render/colors.js';
import { createProgressBar } from '../render/utils.js';
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getAbsoluteTokens } from '../input/stdin.js';
import {
  formatLinesDisplay,
  formatCacheDisplay,
  formatProjectGit,
  prepareRenderData,
  renderActivityLines,
  formatContextText,
  formatContextHintPlain,
} from './helpers.js';

/**
 * Mono theme - No colors, ASCII only
 */
export const monoTheme: Theme = {
  name: 'mono',

  palette: MONO_PALETTE,

  chars: {
    progressFilled: '#',
    progressEmpty: '-',
    boxCornerTL: '+',
    boxCornerTR: '+',
    boxCornerBL: '+',
    boxCornerBR: '+',
    boxHorizontal: '-',
    boxVertical: '|',
    separator: '|',
  },

  icons: FALLBACK_ICONS,

  layout: {
    minWidth: 40,
    compactWidth: 60,
    fullWidth: 100,
    stableHeight: { minimal: 1, compact: 2, full: 6 },
  },

  features: {
    useGradientProgress: false,
    showBoxBorders: false,
    animatedSpinner: false,
    blinkOnCritical: false,
  },

  render(ctx: RenderContext): string[] {
    if (ctx.tier === 1) return this.renderMinimal(ctx);
    else if (ctx.tier === 2) return this.renderCompact(ctx);
    else return this.renderFull(ctx);
  },

  renderMinimal(ctx: RenderContext): string[] {
    const { model, percent, percentStr, duration, sessionName } = prepareRenderData(ctx);
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const projectGit = formatProjectGit(ctx, null, { prefix: ' | ' });

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    // Text only, no colors
    const contextHint = formatContextHintPlain(percent) || '';
    return [`[${model}]${sessionText} ${percentStr}${contextHint}${projectGit}${linesDisplay} | ${duration}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];

    const { model, percent, percentStr, duration, sessionName } = prepareRenderData(ctx);
    const contextStr = formatContextText(ctx, percentStr);
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);

    const projectGit = formatProjectGit(ctx, null, { prefix: ' | ' });

    // Usage (Mono style: no color)
    const usage = ctx.config.display.showUsage && ctx.usageData
      ? ` | 5h:${Math.round(ctx.usageData.fiveHour)}%`
      : '';

    // Warning marker
    const warning = percent !== null && percent >= 75 ? dim(' !') : '';

    // Token speed (Mono style: no color)
    const speed = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? ` | ${formatTokenSpeed(ctx.tokenSpeed, 'output')}`
      : '';

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? '  ' + linesText : '';

    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'compact');
    const cacheDisplay = cacheText ? '  ' + cacheText : '';

    // Line 1 with logical grouping (Mono style uses | separator)
    const group1 = `[${model}]${sessionText}`;
    const compactContextHint = formatContextHintPlain(percent) || '';
    const group2 = `[${progressBar}] ${contextStr}${compactContextHint}${warning}`;
    const group3 = projectGit;
    const group4 = `${linesDisplay}${cacheDisplay}`;
    const group5 = `${duration}${usage}${speed}`;

    lines.push(`${group1} | ${group2} | ${group3} | ${group4.trimStart()} | ${group5}`);

    // Activity line (detailMode or compact)
    const activityLines = renderActivityLines(ctx, {
      style: 'plain',
      palette: this.palette,
      icons: this.icons,
      separator: ' | ',
      nonDetailStyle: 'summarize',
      widgetsOnSeparateLines: false,
    });
    activityLines.forEach(l => lines.push(ctx.detailMode ? '  ' + l : l));

    return lines;
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const width = ctx.width;

    // Header line
    const headerLine = '-'.repeat(width);
    lines.push(dim(headerLine));

    // Line 1
    const { model, percent, percentStr, duration, sessionName } = prepareRenderData(ctx);
    const progressBar = createProgressBar(percent || 0, 15, this.chars.progressFilled, this.chars.progressEmpty);
    const sessionStr = sessionName ? ` [${sessionName}]` : '';

    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let tokensStr = '';

    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      tokensStr = `${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k`;
    } else {
      const tokens = ctx.stdin.context_window?.current_usage;
      tokensStr = tokens ? `${Math.round((tokens.input_tokens || 0) / 1000)}k/${Math.round((ctx.stdin.context_window?.context_window_size || 200000) / 1000)}k` : '';
    }

    const cost = ctx.config.display.showCost ? ctx.stdin.cost?.total_cost_usd : undefined;
    const costStr = cost ? `$${cost.toFixed(2)}` : '';

    // Usage (Mono style: no color)
    const usageStr = ctx.config.display.showUsage && ctx.usageData
      ? `5h:${Math.round(ctx.usageData.fiveHour)}%`
      : '';

    // Token speed (Mono style: no color)
    const speedStr = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? formatTokenSpeed(ctx.tokenSpeed, 'output')
      : '';

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? '  ' + linesText : '';

    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'full');
    const cacheDisplay = cacheText ? '  ' + cacheText : '';

    // Warning
    let warningStr = '';
    if (percent !== null && percent >= 90) {
      warningStr = underline(bold(' [CRITICAL]'));
    } else if (percent !== null && percent >= 75) {
      warningStr = dim(' [WARNING]');
    }

    const parts = [`${bold(model)}${sessionStr}`, `[${progressBar}]`, `${percentStr}${warningStr}`, `(${tokensStr})`, costStr, linesDisplay, cacheDisplay, usageStr, duration, speedStr].filter(Boolean);
    lines.push(`  ${parts.join('  ')}`);

    // Line 2
    const projectGit = formatProjectGit(ctx, null, { prefix: ' | ' });

    const configParts: string[] = [];
    if (ctx.config.display.showConfigCounts) {
      if (ctx.configCounts.claudeMdCount > 0) configParts.push(`${ctx.configCounts.claudeMdCount}md`);
      if (ctx.configCounts.rulesCount > 0) configParts.push(`${ctx.configCounts.rulesCount}rules`);
      if (ctx.configCounts.mcpCount > 0) configParts.push(`${ctx.configCounts.mcpCount}mcp`);
    }

    lines.push(`  ${projectGit}  ${dim(configParts.join(' '))}`);

    // Separator
    lines.push(dim(headerLine));

    // Activity (detailMode or default)
    const activityLinesFull = renderActivityLines(ctx, {
      style: 'plain',
      palette: this.palette,
      icons: this.icons,
      separator: ' | ',
      nonDetailStyle: 'expanded',
    });
    activityLinesFull.forEach(l => lines.push('  ' + l));

    return lines;
  },
};


