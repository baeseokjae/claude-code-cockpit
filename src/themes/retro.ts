/**
 * Retro theme - 80s terminal aesthetics
 */

import type { Theme, RenderContext } from '../types/index.js';
import { RETRO_PALETTE } from './palettes/retro.js';
import { FALLBACK_ICONS } from './icons.js';
import { hex, bold, dim, underline } from '../render/colors.js';
import { createProgressBar, formatPercent, visualLength } from '../render/utils.js';
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getModelName, getContextPercent, getAbsoluteTokens } from '../input/stdin.js';
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
  },

  features: {
    useGradientProgress: false,
    showBoxBorders: true,
    animatedSpinner: false,
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

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextStr = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextStr = `${Math.round(absoluteTokens.used / 1000)}K/${Math.round(absoluteTokens.total / 1000)}K`;
    } else {
      contextStr = percentStr;
    }

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const projectGit = formatProjectGit(ctx, null, null, {
      transform: { case: 'upper' },
      projectPrefix: 'DIR: ',
      branchPrefix: 'BRANCH:',
    });

    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    const color = this.palette.text;
    return [hex(color, `[${model}]${sessionText} ${contextStr}${projectGit}${linesDisplay} | ${duration}`)];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const color = this.palette.text;
    const dimColor = this.palette.muted;

    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextStr = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextStr = `${Math.round(absoluteTokens.used / 1000)}K/${Math.round(absoluteTokens.total / 1000)}K`;
    } else {
      contextStr = percentStr;
    }

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);

    const projectGit = formatProjectGit(ctx, null, null, {
      transform: { case: 'upper' },
      projectPrefix: 'DIR: ',
      branchPrefix: 'BRANCH:',
    });
    const duration = ctx.sessionDuration;

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

    // Line 1 with logical grouping (Retro style uses | separator)
    const group1 = `[${model}]${sessionText}`;
    const group2 = `[${progressBar}] ${contextStr}${warning}`;
    const group3 = projectGit;
    const group4 = `${linesDisplay}${cacheDisplay}`;
    const group5 = `${duration}${speed}`;

    lines.push(hex(color, `${group1} | `) + hex(warningColor, `${group2} | `) + hex(dimColor, `${group3} | ${group4.trimStart()} | ${group5}`));

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
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal);
      const advancedParts = visible.map(w => w.text);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join(' | '));
      }
    } else {
      const activityParts: string[] = [];

      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        activityParts.push(summarizeTools(ctx, this.palette));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        activityParts.push(summarizeAgents(ctx, this.palette));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        activityParts.push(summarizeTodos(ctx, this.palette));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        activityParts.push(summarizeSkills(ctx, this.palette));
      }

      // Activity widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal);
      activityParts.push(...visible.map(w => w.text));

      if (activityParts.length > 0) {
        lines.push(hex(dimColor, activityParts.join(' | ')));
      }
    }

    return lines;
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const width = process.stdout.columns || 100;
    const innerWidth = width - 2;
    const color = this.palette.text;
    const dimColor = this.palette.muted;

    // Header
    lines.push(hex(color, '╔' + '═'.repeat(innerWidth) + '╗'));
    lines.push(hex(color, '║') + hex(color, bold(' CLAUDE Code COCKPIT v1.0 ')) + ' '.repeat(innerWidth - 21) + hex(color, '║'));
    lines.push(hex(color, '╠' + '═'.repeat(innerWidth) + '╣'));

    // System info
    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';
    const progressBar = createProgressBar(percent || 0, 20, this.chars.progressFilled, this.chars.progressEmpty);

    // Context display (absolute tokens or percentage)
    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextStr = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextStr = `${Math.round(absoluteTokens.used / 1000)}K/${Math.round(absoluteTokens.total / 1000)}K`;
    } else {
      contextStr = percentStr;
    }

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
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
    const projectGit = formatProjectGit(ctx, null, null, {
      transform: { case: 'upper' },
      projectPrefix: 'DIR: ',
      branchPrefix: 'BRANCH:',
    });
    const duration = ctx.sessionDuration;
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
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal);
      visible.forEach(w => {
        const widgetLine = ` ${w.text}`;
        lines.push(hex(color, '║') + hex(color, widgetLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(widgetLine))) + hex(color, '║'));
      });
    } else {
      // Tools
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsLine = ` TOOLS: ${summarizeTools(ctx, this.palette)}`;
        lines.push(hex(color, '║') + hex(color, toolsLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(toolsLine))) + hex(color, '║'));
      }

      // Agents
      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsLine = ` AGENTS: ${summarizeAgents(ctx, this.palette)}`;
        lines.push(hex(color, '║') + hex(color, agentsLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(agentsLine))) + hex(color, '║'));
      }

      // Todos
      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosLine = ` TASKS: ${summarizeTodos(ctx, this.palette)}`;
        lines.push(hex(color, '║') + hex(color, todosLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(todosLine))) + hex(color, '║'));
      }

      // Skills
      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        const skillsLine = ` SKILLS: ${summarizeSkills(ctx, this.palette)}`;
        lines.push(hex(color, '║') + hex(color, skillsLine) + ' '.repeat(Math.max(0, innerWidth - visualLength(skillsLine))) + hex(color, '║'));
      }

      // Activity widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal);
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

function summarizeTools(ctx: RenderContext, _palette: typeof RETRO_PALETTE): string {
  const toolCounts = new Map<string, number>();
  let running: string | null = null;

  for (const tool of ctx.transcript.tools) {
    toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
    if (tool.status === 'running') running = tool.name;
  }

  const parts: string[] = [];
  for (const [name, count] of toolCounts) {
    const isRunning = running === name;
    const marker = isRunning ? '~' : '+';
    const text = `${name.toUpperCase()}${marker}${count > 1 ? count : ''}`;
    parts.push(isRunning ? bold(text) : text);
  }

  return '● ' + parts.join(' ');
}

function summarizeAgents(ctx: RenderContext, _palette: typeof RETRO_PALETTE): string {
  const agentItems = ctx.transcript.agents
    .slice(0, 3)
    .map((a) => {
      const marker = a.status === 'running' ? '~' : '+';
      const model = a.model ? `[${a.model[0].toUpperCase()}]` : '';
      return `${a.type.toUpperCase()}${marker}${model}`;
    })
    .join(' ');

  return '● ' + agentItems;
}

function summarizeTodos(ctx: RenderContext, _palette: typeof RETRO_PALETTE): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (current) {
    return `● >${current.content.substring(0, 25).toUpperCase()}... (${completed}/${total})`;
  }
  return `● ${completed}/${total}`;
}

function summarizeSkills(ctx: RenderContext, _palette: typeof RETRO_PALETTE): string {
  const skillItems = ctx.transcript.skills
    .slice(0, 3)
    .map((s) => {
      const marker = s.status === 'running' ? '~' : '+';
      return `${s.name.toUpperCase()}${marker}`;
    })
    .join(' ');

  return '● ' + skillItems;
}

