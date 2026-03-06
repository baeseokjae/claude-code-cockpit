/**
 * Retro theme - 80s terminal aesthetics
 */

import type { Theme, RenderContext } from '../types/index.js';
import { RETRO_PALETTE } from './palettes/retro.js';
import { FALLBACK_ICONS } from './icons.js';
import { hex, bold, dim, underline } from '../render/colors.js';
import { createProgressBar, visualLength } from '../render/utils.js';
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getVersion } from '../utils/version.js';
import {
  formatLinesDisplay,
  formatCacheDisplay,
  collectActivityWidgets,
  getVisibleWidgets,
  hasAbnormalState,
  formatProjectGit,
  formatDetailToolsSummary,
  formatDetailAgentsSummary,
  formatDetailTodosSummary,
  summarizeToolsPlain,
  summarizeAgentsPlain,
  summarizeTodosPlain,
  summarizeSkillsPlain,
  prepareRenderData,
  formatContextText,
  formatContextHint,
} from './helpers.js';

/**
 * Retro theme - CRT phosphor monitor
 */
export const retroTheme: Theme = {
  name: 'retro',

  palette: RETRO_PALETTE,

  chars: {
    progressFilled: '█',
    progressEmpty: '░',
    boxCornerTL: '┌',
    boxCornerTR: '┐',
    boxCornerBL: '└',
    boxCornerBR: '┘',
    boxHorizontal: '─',
    boxVertical: '│',
    separator: '│',
  },

  icons: FALLBACK_ICONS,

  layout: {
    minWidth: 50,
    compactWidth: 70,
    fullWidth: 100,
    stableHeight: { minimal: 1, compact: 2, full: 8 },
  },

  features: {
    useGradientProgress: false,
    showBoxBorders: true,
    animatedSpinner: false,
    blinkOnCritical: true,
  },

  renderMinimal(ctx: RenderContext): string[] {
    const { model: modelRaw, percent, percentStr, duration, sessionName } = prepareRenderData(ctx);
    const model = modelRaw.toUpperCase();
    const contextStr = formatContextText(ctx, percentStr, { uppercase: true });
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const projectGit = formatProjectGit(ctx, null, {
      transform: { case: 'upper' },
      projectPrefix: 'DIR: ',
      branchPrefix: 'BRANCH:',
    });

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    const color = this.palette.text;
    const contextHint = formatContextHint(percent, this.palette) || '';
    return [hex(color, `[${model}]${sessionText} ${contextStr}`) + contextHint + hex(color, `${projectGit}${linesDisplay} | ${duration}`)];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const color = this.palette.text;
    const dimColor = this.palette.muted;

    const { model: modelRaw, percent, percentStr, duration, sessionName } = prepareRenderData(ctx);
    const model = modelRaw.toUpperCase();
    const contextStr = formatContextText(ctx, percentStr, { uppercase: true });
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);

    const projectGit = formatProjectGit(ctx, null, {
      transform: { case: 'upper' },
      projectPrefix: 'DIR: ',
      branchPrefix: 'BRANCH:',
    });

    // Warning
    const warningColor = percent !== null && percent >= 75 ? this.palette.red : color;
    const warning = percent !== null && percent >= 90
      ? underline(bold(' [!ALERT!]'))
      : percent !== null && percent >= 75
      ? dim(' [WARN]')
      : '';

    // Token speed (Retro style: uppercase)
    const speed = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? ` | ${formatTokenSpeed(ctx.tokenSpeed, 'output').toUpperCase()}`
      : '';

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? '  ' + linesText : '';

    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'compact');
    const cacheDisplay = cacheText ? '  ' + cacheText : '';

    // Context action hint
    const compactContextHint = formatContextHint(percent, this.palette) || '';

    // Line 1 with logical grouping (Retro style uses | separator)
    const group1 = `[${model}]${sessionText}`;
    const group2 = `[${progressBar}] ${contextStr}${warning}`;
    const group3 = projectGit;
    const group4 = `${linesDisplay}${cacheDisplay}`;
    const group5 = `${duration}${speed}`;

    lines.push(hex(color, `${group1} | `) + hex(warningColor, `${group2}`) + compactContextHint + hex(color, ` | `) + hex(dimColor, `${group3} | ${group4.trimStart()} | ${group5}`));

    // Activity (detailMode or compact)
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
        lines.push('  ' + advancedParts.join(' | '));
      }
    } else {
      const retroOpts = { transform: { case: 'upper' as const } };
      const activityParts: string[] = [];

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        activityParts.push(summarizeToolsPlain(ctx, retroOpts));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        activityParts.push(summarizeAgentsPlain(ctx, retroOpts));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        activityParts.push(summarizeTodosPlain(ctx, retroOpts));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        activityParts.push(summarizeSkillsPlain(ctx, retroOpts));
      }

      // Activity widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      activityParts.push(...visible.map(w => w.text));

      if (activityParts.length > 0) {
        lines.push(hex(dimColor, activityParts.join(' | ')));
      }
    }

    return lines;
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const width = ctx.width;
    const innerWidth = width - 2;
    const color = this.palette.text;
    const dimColor = this.palette.muted;

    // Header
    lines.push(hex(color, '╔' + '═'.repeat(innerWidth) + '╗'));
    const headerText = bold(` CLAUDE Code COCKPIT v${getVersion()} `);
    lines.push(hex(color, '║') + hex(color, headerText) + ' '.repeat(Math.max(0, innerWidth - visualLength(headerText))) + hex(color, '║'));
    lines.push(hex(color, '╠' + '═'.repeat(innerWidth) + '╣'));

    // System info
    const { model: modelRaw, percent, percentStr, duration, sessionName } = prepareRenderData(ctx);
    const model = modelRaw.toUpperCase();
    const progressBar = createProgressBar(percent || 0, 20, this.chars.progressFilled, this.chars.progressEmpty);
    const contextStr = formatContextText(ctx, percentStr, { uppercase: true });
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const warningColor = percent !== null && percent >= 75 ? this.palette.red : color;
    const warning = percent !== null && percent >= 90
      ? underline(bold(' [!CRITICAL ALERT!]'))
      : percent !== null && percent >= 75
      ? dim(' [WARNING]')
      : '';

    const line1 = ` MODEL: ${model}${sessionText}  MEM: [${progressBar}] ${contextStr}${warning}`;
    lines.push(hex(color, '║') + hex(warningColor, line1) + ' '.repeat(Math.max(0, innerWidth - visualLength(line1))) + hex(color, '║'));

    // Project info
    const projectGit = formatProjectGit(ctx, null, {
      transform: { case: 'upper' },
      projectPrefix: 'DIR: ',
      branchPrefix: 'BRANCH:',
    });
    const cost = ctx.config.display.showCost ? ctx.stdin.cost?.total_cost_usd : undefined;
    const costStr = cost ? `$${cost.toFixed(2)}` : (ctx.config.display.showCost ? '$0.00' : '');

    // Token speed (Retro style: uppercase)
    const speedStr = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? `  SPEED: ${formatTokenSpeed(ctx.tokenSpeed, 'output').toUpperCase()}`
      : '';

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? '  ' + linesText : '';

    const cacheText = formatCacheDisplay(ctx, this.palette, this.icons, 'full');
    const cacheDisplay = cacheText ? '  ' + cacheText : '';

    const line2 = ` ${projectGit}${linesDisplay}${cacheDisplay}  TIME: ${duration}  COST: ${costStr}${speedStr}`;
    lines.push(hex(color, '║') + hex(dimColor, line2) + ' '.repeat(Math.max(0, innerWidth - visualLength(line2))) + hex(color, '║'));

    // Separator
    lines.push(hex(color, '╠' + '═'.repeat(innerWidth) + '╣'));

    // Config counts
    const configs = [];
    if (ctx.config.display.showConfigCounts) {
      if (ctx.configCounts.claudeMdCount > 0) configs.push(`MD:${ctx.configCounts.claudeMdCount}`);
      if (ctx.configCounts.rulesCount > 0) configs.push(`RULES:${ctx.configCounts.rulesCount}`);
      if (ctx.configCounts.mcpCount > 0) configs.push(`MCP:${ctx.configCounts.mcpCount}`);
      if (ctx.configCounts.hooksCount > 0) configs.push(`HOOKS:${ctx.configCounts.hooksCount}`);
    }

    if (configs.length > 0) {
      const configLine = ` CONFIG: ${configs.join('  ')}`;
      lines.push(hex(color, '║') + hex(dimColor, configLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(configLine))) + hex(color, '║'));
    }

    // Activity (detailMode or default)
    if (ctx.detailMode) {
      const detailOpts = { palette: this.palette, icons: this.icons, transform: { case: 'upper' as const } };

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatDetailToolsSummary(ctx.transcript.tools, detailOpts);
        if (toolsSummary) {
          const tLine = ` ${toolsSummary}`;
          lines.push(hex(color, '║') + hex(color, tLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(tLine))) + hex(color, '║'));
        }
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatDetailAgentsSummary(ctx.transcript.agents, detailOpts);
        if (agentsSummary) {
          const aLine = ` ${agentsSummary}`;
          lines.push(hex(color, '║') + hex(color, aLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(aLine))) + hex(color, '║'));
        }
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatDetailTodosSummary(ctx.transcript.todos, detailOpts);
        if (todosSummary) {
          const tdLine = ` ${todosSummary}`;
          lines.push(hex(color, '║') + hex(color, tdLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(tdLine))) + hex(color, '║'));
        }
      }

      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      visible.forEach(w => {
        const widgetLine = ` ${w.text}`;
        lines.push(hex(color, '║') + hex(color, widgetLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(widgetLine))) + hex(color, '║'));
      });
    } else {
      const retroOptsFull = { transform: { case: 'upper' as const } };

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsLine = ` TOOLS: ${summarizeToolsPlain(ctx, retroOptsFull)}`;
        lines.push(hex(color, '║') + hex(color, toolsLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(toolsLine))) + hex(color, '║'));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsLine = ` AGENTS: ${summarizeAgentsPlain(ctx, retroOptsFull)}`;
        lines.push(hex(color, '║') + hex(color, agentsLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(agentsLine))) + hex(color, '║'));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosLine = ` TASKS: ${summarizeTodosPlain(ctx, retroOptsFull)}`;
        lines.push(hex(color, '║') + hex(color, todosLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(todosLine))) + hex(color, '║'));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        const skillsLine = ` SKILLS: ${summarizeSkillsPlain(ctx, retroOptsFull)}`;
        lines.push(hex(color, '║') + hex(color, skillsLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(skillsLine))) + hex(color, '║'));
      }

      // Activity widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      visible.forEach(w => {
        const widgetLine = ` ${w.text}`;
        lines.push(hex(color, '║') + hex(color, widgetLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(widgetLine))) + hex(color, '║'));
      });
    }

    // Footer
    lines.push(hex(color, '╚' + '═'.repeat(innerWidth) + '╝'));

    return lines;
  },
};


