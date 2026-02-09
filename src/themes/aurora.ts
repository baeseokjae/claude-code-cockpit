/**
 * Aurora theme (default)
 *
 * Display Tiers:
 * - Tier 1 (renderMinimal): Model, context%, Git, duration
 * - Tier 2 (renderCompact): Tier 1 + tool counts, agent status, Todo summary
 * - Tier 3 (renderFull): Tier 2 + box layout, token details, cost, config counts
 *
 * Width breakpoints:
 * - < 80: Tier 1 (minimal)
 * - 80-120: Tier 2 (compact)
 * - >= 120: Tier 3 (full)
 */

import type { Theme, RenderContext, ColorPalette } from '../types/index.js';
import { AURORA_PALETTE } from './palettes/aurora.js';
import { getIcons } from './icons.js';
import { hex } from '../render/colors.js';
import { createProgressBar, formatPercent, visualLength } from '../render/utils.js';
import { formatUsageCompact, formatUsageFull } from '../render/usage.js';
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

export const auroraTheme: Theme = {
  name: 'aurora',

  palette: AURORA_PALETTE,

  chars: {
    progressFilled: '▰',
    progressEmpty: '▱',
    boxCornerTL: '╭',
    boxCornerTR: '╮',
    boxCornerBL: '╰',
    boxCornerBR: '╯',
    boxHorizontal: '─',
    boxVertical: '│',
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
    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';
    const duration = ctx.sessionDuration;

    const modelText = hex(this.palette.blue, model);

    // Session/Plan name
    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(this.palette.muted, ` [${sessionName}]`) : '';

    const percentColor = getPercentColor(percent, this.palette);
    const percentText = hex(percentColor, percentStr);
    const contextHint = formatContextHint(percent, this.palette) || '';

    // Project and git with parentheses and links
    const projectGit = formatProjectGit(ctx, this.palette, this.icons, { showFileStats: true });

    const durationText = hex(this.palette.muted, ` ${duration}`);

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    return [`${modelText}${sessionText} ${percentText}${contextHint}${projectGit}${linesDisplay}${durationText}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];

    // Line 1: Header
    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelText = hex(this.palette.blue, model);

    // Session/Plan name
    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(this.palette.muted, ` [${sessionName}]`) : '';

    // Progress bar
    const progressBar = this.features.useGradientProgress
      ? createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty)
      : '';
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextText = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextText = hex(progressColor, `${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k`);
    } else {
      contextText = hex(progressColor, percentStr);
    }
    const compactContextHint = formatContextHint(percent, this.palette) || '';

    // Project and git with parentheses and links
    const projectGit = formatProjectGit(ctx, this.palette, this.icons, { showFileStats: true });

    // Duration
    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    // Usage
    const usageText = ctx.config.display.showUsage && ctx.usageData
      ? '  ' + formatUsageCompact(ctx.usageData, this.palette)
      : '';

    // Token speed
    const speedText = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? '  ' + hex(this.palette.green, formatTokenSpeed(ctx.tokenSpeed, 'output'))
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
    const styledOpts = { palette: this.palette, icons: this.icons };

    if (ctx.detailMode) {
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatDetailToolsSummary(ctx.transcript.tools, styledOpts);
        if (toolsSummary) lines.push('  ' + toolsSummary);
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatDetailAgentsSummary(ctx.transcript.agents, styledOpts);
        if (agentsSummary) lines.push('  ' + agentsSummary);
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatDetailTodosSummary(ctx.transcript.todos, styledOpts);
        if (todosSummary) lines.push('  ' + todosSummary);
      }

      // Usage detail
      if (ctx.config.display.showUsage && ctx.usageData) {
        const usageSummary = formatUsageSummaryLine(ctx.usageData, this.palette);
        lines.push('  ' + usageSummary);
      }

      // Advanced feature widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      const advancedParts = visible.map(w => w.text);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    } else {
      // Compact mode: summary line
      const activityParts: string[] = [];

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        activityParts.push(summarizeToolsStyled(ctx, styledOpts));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        activityParts.push(summarizeAgentsStyled(ctx, styledOpts));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        activityParts.push(summarizeTodosStyled(ctx, styledOpts));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        activityParts.push(summarizeSkillsStyled(ctx, styledOpts));
      }

      // New features: Activity widgets
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

    // Box top
    const topBorder = this.chars.boxCornerTL + this.chars.boxHorizontal.repeat(width - 2) + this.chars.boxCornerTR;
    lines.push(hex(this.palette.overlay, topBorder));

    // Line 1: Model, Progress, Context, Cost, Duration
    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelText = hex(this.palette.blue, model);

    // Session/Plan name
    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(this.palette.muted, ` [${sessionName}]`) : '';

    // Project and git with parentheses and links (for line 2)
    const projectGit = formatProjectGit(ctx, this.palette, this.icons, { showFileStats: true });

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);
    const percentText = hex(progressColor, percentStr);

    // Tokens
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let tokensText = '';
    
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      tokensText = hex(this.palette.subtext, `(${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k)`);
    } else {
      const tokens = ctx.stdin.context_window?.current_usage;
      tokensText = tokens ? hex(this.palette.subtext, `(${Math.round((tokens.input_tokens || 0) / 1000)}k/${Math.round((ctx.stdin.context_window?.context_window_size || 200000) / 1000)}k)`) : '';
    }

    // Cost
    const cost = ctx.config.display.showCost ? ctx.stdin.cost?.total_cost_usd : undefined;
    const costText = cost ? hex(this.palette.peach, ` ~$${cost.toFixed(2)}`) : '';

    // Usage
    const usageText = ctx.config.display.showUsage && ctx.usageData
      ? '  ' + formatUsageFull(ctx.usageData, this.palette, ctx.config.display.sevenDayThreshold)
      : '';

    // Duration
    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    // Token speed
    const speedText = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? '  ' + hex(this.palette.green, formatTokenSpeed(ctx.tokenSpeed, 'output'))
      : '';

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? '  ' + linesText : '';

    // Cache
    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'full');
    const cacheDisplay = cacheText ? '  ' + cacheText : '';

    const line1Content = `  ${modelText}${sessionText}   ${progressText} ${percentText}  ${tokensText}${costText}${linesDisplay}${cacheDisplay}${usageText}   ${durationText}${speedText}`;
    lines.push(this.chars.boxVertical + line1Content + ' '.repeat(Math.max(0, width - 2 - visualLength(line1Content))) + this.chars.boxVertical);

    // Middle border
    const middleBorder = hex(this.palette.overlay, this.chars.boxHorizontal.repeat(width));
    lines.push(middleBorder);

    // Line 2: Project/Git, Config counts
    const configParts: string[] = [];
    if (ctx.config.display.showConfigCounts) {
      if (ctx.configCounts.claudeMdCount > 0) {
        configParts.push(`${ctx.configCounts.claudeMdCount} md`);
      }
      if (ctx.configCounts.rulesCount > 0) {
        configParts.push(`${ctx.configCounts.rulesCount} rules`);
      }
      if (ctx.configCounts.mcpCount > 0) {
        configParts.push(`${ctx.configCounts.mcpCount} mcp`);
      }
    }
    const configText = configParts.length > 0 ? hex(this.palette.muted, `  ${configParts.join('  ')}`) : '';

    const line2Content = `  ${projectGit}${configText}`;
    lines.push(this.chars.boxVertical + line2Content + ' '.repeat(Math.max(0, width - 2 - visualLength(line2Content))) + this.chars.boxVertical);

    // Box bottom
    const bottomBorder = this.chars.boxCornerBL + this.chars.boxHorizontal.repeat(width - 2) + this.chars.boxCornerBR;
    lines.push(hex(this.palette.overlay, bottomBorder));

    // Activity lines (outside box)
    const styledOptsFull = { palette: this.palette, icons: this.icons };

    if (ctx.detailMode) {
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatDetailToolsSummary(ctx.transcript.tools, styledOptsFull);
        if (toolsSummary) lines.push('  ' + toolsSummary);
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatDetailAgentsSummary(ctx.transcript.agents, styledOptsFull);
        if (agentsSummary) lines.push('  ' + agentsSummary);
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatDetailTodosSummary(ctx.transcript.todos, styledOptsFull);
        if (todosSummary) lines.push('  ' + todosSummary);
      }

      if (ctx.config.display.showUsage && ctx.usageData) {
        const usageSummary = formatUsageSummaryLine(ctx.usageData, this.palette);
        lines.push('  ' + usageSummary);
      }

      // Advanced feature widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      const advancedParts = visible.map(w => w.text);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    } else {
      // Default mode: compact display
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        lines.push('  ' + renderToolsLineStyled(ctx, styledOptsFull));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        lines.push('  ' + renderAgentsLineStyled(ctx, styledOptsFull));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        lines.push('  ' + renderTodosLineStyled(ctx, styledOptsFull));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        lines.push('  ' + renderSkillsLineStyled(ctx, styledOptsFull));
      }

      // Additional activity indicators
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      const activityParts = visible.map(w => w.text);

      if (activityParts.length > 0) {
        lines.push('  ' + activityParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    }

    return lines;
  },
};


/**
 * Format usage summary line
 */
function formatUsageSummaryLine(usageData: any, palette: ColorPalette): string {
  const fiveReset = formatResetTime(usageData.fiveHourResetAt);
  const sevenReset = formatResetTime(usageData.sevenDayResetAt);

  const fiveHourText = usageData.fiveHour > 0
    ? hex(palette.blue, `5h: ${Math.round(usageData.fiveHour)}%`) +
    (fiveReset ? hex(palette.muted, ` ↻ ${fiveReset}`) : '')
    : '';

  const sevenDayText = usageData.sevenDay > 0
    ? hex(palette.teal, `7d: ${Math.round(usageData.sevenDay)}%`) +
    (sevenReset ? hex(palette.muted, ` ↻ ${sevenReset}`) : '')
    : '';

  const parts = [fiveHourText, sevenDayText].filter(Boolean);

  return hex(palette.muted, '● Usage: ') + parts.join('  ');
}

