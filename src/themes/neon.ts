/**
 * Neon theme - Cyberpunk high contrast
 *
 * Display Tiers:
 * - Tier 1 (renderMinimal): Model, context%, Git, duration
 * - Tier 2 (renderCompact): Tier 1 + tool counts, agent status, Todo summary
 * - Tier 3 (renderFull): Tier 2 + box layout, token details, cost, config counts
 */

import type { Theme, RenderContext } from '../types/index.js';
import { NEON_PALETTE } from './palettes/neon.js';
import { getIcons } from './icons.js';
import { hex, bold } from '../render/colors.js';
import { createProgressBar, formatPercent, visualLength } from '../render/utils.js';
import { getUsageColor } from '../render/usage.js';
import { formatResetTime } from '../data/usage-api.js';
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getModelName, getContextPercent, getAbsoluteTokens } from '../input/stdin.js';
import {
  formatLinesDisplay,
  formatCacheDisplay,
  collectActivityWidgets,
  getVisibleWidgets,
  hasAbnormalState,
  getPercentColor,
  formatProjectGit,
  formatDetailToolsSummary,
  formatDetailAgentsSummary,
  formatDetailTodosSummary,
  summarizeToolsStyled,
  summarizeAgentsStyled,
  summarizeTodosStyled,
  summarizeSkillsStyled,
  renderToolsLineStyled,
  renderAgentsLineStyled,
  renderTodosLineStyled,
  renderSkillsLineStyled,
  formatContextHint,
} from './helpers.js';

/**
 * Neon theme
 */
export const neonTheme: Theme = {
  name: 'neon',

  palette: NEON_PALETTE,

  chars: {
    progressFilled: '▓',
    progressEmpty: '░',
    boxCornerTL: '╔',
    boxCornerTR: '╗',
    boxCornerBL: '╚',
    boxCornerBR: '╝',
    boxHorizontal: '═',
    boxVertical: '║',
    separator: '│',
  },

  icons: getIcons(),

  layout: {
    minWidth: 60,
    compactWidth: 80,
    fullWidth: 120,
  },

  features: {
    useGradientProgress: true,
    showBoxBorders: true,
    animatedSpinner: true,
    blinkOnCritical: true,
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
    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';
    const duration = ctx.sessionDuration;

    const modelText = hex(this.palette.blue, bold(model));

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(this.palette.muted, ` [${sessionName}]`) : '';

    const percentColor = getPercentColor(percent, this.palette);
    const percentText = hex(percentColor, bold(percentStr));
    const contextHint = formatContextHint(percent, this.palette) || '';

    const projectGit = formatProjectGit(ctx, this.palette, this.icons, {
      transform: { case: 'upper' },
      branchColor: this.palette.mauve,
    });
    const durationText = hex(this.palette.muted, ` ${duration}`);

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    return [`${modelText}${sessionText} ${percentText}${contextHint}${projectGit}${linesDisplay}${durationText}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];

    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelText = hex(this.palette.blue, bold(model));

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(this.palette.muted, ` [${sessionName}]`) : '';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextText = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextText = hex(progressColor, bold(`${Math.round(absoluteTokens.used / 1000)}K/${Math.round(absoluteTokens.total / 1000)}K`));
    } else {
      contextText = hex(progressColor, bold(percentStr));
    }
    const compactContextHint = formatContextHint(percent, this.palette) || '';

    const projectGit = formatProjectGit(ctx, this.palette, this.icons, {
      transform: { case: 'upper' },
      branchColor: this.palette.mauve,
    });

    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    // Usage (Neon style: uppercase)
    const usageText = ctx.config.display.showUsage && ctx.usageData
      ? '  ' + hex(getUsageColor(ctx.usageData.fiveHour, this.palette), bold(`5H:${Math.round(ctx.usageData.fiveHour)}%`))
      : '';

    // Token speed (Neon style: uppercase, bold)
    const speedText = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? '  ' + hex(this.palette.green, bold(formatTokenSpeed(ctx.tokenSpeed, 'output').toUpperCase()))
      : '';

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? '  ' + linesText : '';

    // Cache
    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'compact');
    const cacheDisplay = cacheText ? '  ' + cacheText : '';

    // Line 1 with logical grouping
    const separator = hex(this.palette.muted, ' │ ');
    const group1 = `${modelText}${sessionText}`;
    const group2 = `${progressText} ${contextText}${compactContextHint}`;
    const group3 = projectGit;
    const group4 = `${linesDisplay}${cacheDisplay}${speedText}`;
    const group5 = `${durationText}${usageText}`;

    lines.push(
      `${group1}${separator}${group2}${separator}${group3}${separator}${group4.trimStart()}${separator}${group5}`
    );

    // Line 2+: Activity (detailMode or compact)
    if (ctx.detailMode) {
      const detailOpts = { palette: this.palette, icons: this.icons, transform: { case: 'upper' as const } };

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatDetailToolsSummary(ctx.transcript.tools, detailOpts);
        if (toolsSummary) lines.push('  ' + toolsSummary);
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatDetailAgentsSummary(ctx.transcript.agents, detailOpts);
        if (agentsSummary) lines.push('  ' + agentsSummary);
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatDetailTodosSummary(ctx.transcript.todos, detailOpts);
        if (todosSummary) lines.push('  ' + todosSummary);
      }

      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      const advancedParts = visible.map(w => w.text);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    } else {
      const neonOpts = { palette: this.palette, icons: this.icons, transform: { case: 'upper' as const } };
      const activityParts: string[] = [];

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        activityParts.push(summarizeToolsStyled(ctx, neonOpts));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        activityParts.push(summarizeAgentsStyled(ctx, neonOpts));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        activityParts.push(summarizeTodosStyled(ctx, neonOpts));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        activityParts.push(summarizeSkillsStyled(ctx, neonOpts));
      }

      // Activity widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      activityParts.push(...visible.map(w => w.text));

      if (activityParts.length > 0) {
        lines.push(activityParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    }

    return lines;
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const width = process.stdout.columns || 120;
    const innerWidth = width - 2;

    // Box top
    const topBorder = this.chars.boxCornerTL + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxCornerTR;
    lines.push(hex(this.palette.blue, topBorder));

    // Line 1: Model, Progress, Context
    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelText = hex(this.palette.blue, bold(model));

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(this.palette.muted, ` [${sessionName}]`) : '';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextText = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextText = hex(progressColor, bold(`${Math.round(absoluteTokens.used / 1000)}K/${Math.round(absoluteTokens.total / 1000)}K`));
    } else {
      contextText = hex(progressColor, bold(percentStr));
    }

    // Warning for high usage
    let warningText = '';
    if (percent !== null && percent >= 90) {
      warningText = hex(this.palette.red, bold('  CRITICAL!'));
    } else if (percent !== null && percent >= 75) {
      warningText = hex(this.palette.yellow, '  WARNING');
    }

    const cost = ctx.config.display.showCost ? ctx.stdin.cost?.total_cost_usd : undefined;
    const costText = cost ? hex(this.palette.peach, `$${cost.toFixed(2)}`) : '';

    // Usage (Neon style: uppercase + bold + reset time)
    const usageText = ctx.config.display.showUsage && ctx.usageData
      ? (() => {
        const resetStr = formatResetTime(ctx.usageData.fiveHourResetAt);
        const usageColor = getUsageColor(ctx.usageData.fiveHour, this.palette);
        return '  ' + hex(usageColor, bold(`5H: ${Math.round(ctx.usageData.fiveHour)}%`)) +
          (resetStr ? hex(this.palette.muted, ` ↻ ${resetStr}`) : '');
      })()
      : '';

    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    // Token speed (Neon style: uppercase, bold)
    const speedText = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? '  ' + hex(this.palette.green, bold(formatTokenSpeed(ctx.tokenSpeed, 'output').toUpperCase()))
      : '';

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? '  ' + linesText : '';

    // Cache
    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'full');
    const cacheDisplay = cacheText ? '  ' + cacheText : '';

    const line1 = `  ${modelText}${sessionText}   ${progressText} ${contextText}${warningText}   ${costText}${linesDisplay}${cacheDisplay}${usageText}   ${durationText}${speedText}`;
    lines.push(hex(this.palette.blue, this.chars.boxVertical) + line1 + ' '.repeat(Math.max(0, innerWidth - visualLength(line1) + 10)) + hex(this.palette.blue, this.chars.boxVertical));

    // Middle border
    const midBorder = this.chars.boxVertical + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxVertical;
    lines.push(hex(this.palette.blue, midBorder));

    // Line 2: Project/Git, Config
    const projectGit = formatProjectGit(ctx, this.palette, this.icons, {
      transform: { case: 'upper' },
      branchColor: this.palette.mauve,
    });

    const configParts: string[] = [];
    if (ctx.config.display.showConfigCounts) {
      if (ctx.configCounts.claudeMdCount > 0) configParts.push(`${ctx.configCounts.claudeMdCount} md`);
      if (ctx.configCounts.rulesCount > 0) configParts.push(`${ctx.configCounts.rulesCount} rules`);
      if (ctx.configCounts.mcpCount > 0) configParts.push(`${ctx.configCounts.mcpCount} mcp`);
    }
    const configText = configParts.length > 0 ? hex(this.palette.muted, `  ${configParts.join('  ')}`) : '';

    const line2 = `  ${projectGit}${configText}`;
    lines.push(hex(this.palette.blue, this.chars.boxVertical) + line2 + ' '.repeat(Math.max(0, innerWidth - visualLength(line2) + 10)) + hex(this.palette.blue, this.chars.boxVertical));

    // Box bottom
    const bottomBorder = this.chars.boxCornerBL + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxCornerBR;
    lines.push(hex(this.palette.blue, bottomBorder));

    // Activity lines outside box
    if (ctx.detailMode) {
      const detailOpts = { palette: this.palette, icons: this.icons, transform: { case: 'upper' as const } };

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatDetailToolsSummary(ctx.transcript.tools, detailOpts);
        if (toolsSummary) lines.push('  ' + toolsSummary);
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatDetailAgentsSummary(ctx.transcript.agents, detailOpts);
        if (agentsSummary) lines.push('  ' + agentsSummary);
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatDetailTodosSummary(ctx.transcript.todos, detailOpts);
        if (todosSummary) lines.push('  ' + todosSummary);
      }

      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      const advancedParts = visible.map(w => w.text);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    } else {
      const neonOptsFull = { palette: this.palette, icons: this.icons, transform: { case: 'upper' as const } };

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        lines.push('  ' + renderToolsLineStyled(ctx, neonOptsFull));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        lines.push('  ' + renderAgentsLineStyled(ctx, neonOptsFull));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        lines.push('  ' + renderTodosLineStyled(ctx, neonOptsFull));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        lines.push('  ' + renderSkillsLineStyled(ctx, neonOptsFull));
      }

      // Activity widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      visible.forEach(w => lines.push('  ' + w.text));
    }

    return lines;
  },
};


