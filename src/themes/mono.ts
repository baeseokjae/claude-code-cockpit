/**
 * Mono theme - Black and white minimal, ASCII compatible
 */

import type { Theme, RenderContext } from '../types/index.js';
import { MONO_PALETTE } from './palettes/mono.js';
import { FALLBACK_ICONS } from './icons.js';
import { dim, bold } from '../render/colors.js';
import { createProgressBar, formatPercent } from '../render/utils.js';
import { getModelName, getContextPercent } from '../input/stdin.js';

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
    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const duration = ctx.sessionDuration;

    // Text only, no colors
    return [`[${model}] ${percentStr} | ${git}${dirty} | ${duration}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];

    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);

    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : '';
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const duration = ctx.sessionDuration;

    // Usage (Mono style: no color)
    const usage = ctx.config.display.showUsage && ctx.usageData
      ? ` | 5h:${Math.round(ctx.usageData.fiveHour)}%`
      : '';

    // Warning marker
    const warning = percent !== null && percent >= 75 ? ' !' : '';

    lines.push(`[${model}] [${progressBar}] ${percentStr}${warning} | ${project} | ${git}${dirty}${usage} | ${duration}`);

    // Activity line
    const activityParts: string[] = [];

    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const tools = summarizeTools(ctx);
      if (tools) activityParts.push(tools);
    }

    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const agents = summarizeAgents(ctx);
      if (agents) activityParts.push(agents);
    }

    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const todos = summarizeTodos(ctx);
      if (todos) activityParts.push(todos);
    }

    if (activityParts.length > 0) {
      lines.push(activityParts.join(' | '));
    }

    return lines;
  },

  renderFull(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const width = process.stdout.columns || 100;

    // Header line
    const headerLine = '-'.repeat(width);
    lines.push(dim(headerLine));

    // Line 1
    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';
    const progressBar = createProgressBar(percent || 0, 15, this.chars.progressFilled, this.chars.progressEmpty);

    const tokens = ctx.stdin.context_window?.current_usage;
    const tokensStr = tokens ? `${Math.round((tokens.input_tokens || 0) / 1000)}k/${Math.round((ctx.stdin.context_window?.context_window_size || 200000) / 1000)}k` : '';

    const cost = ctx.stdin.cost?.total_cost_usd;
    const costStr = cost ? `$${cost.toFixed(2)}` : '';

    // Usage (Mono style: no color)
    const usageStr = ctx.config.display.showUsage && ctx.usageData
      ? `5h:${Math.round(ctx.usageData.fiveHour)}%`
      : '';

    const duration = ctx.sessionDuration;

    // Warning
    let warningStr = '';
    if (percent !== null && percent >= 90) {
      warningStr = bold(' [CRITICAL]');
    } else if (percent !== null && percent >= 75) {
      warningStr = ' [WARNING]';
    }

    const parts = [`${bold(model)}`, `[${progressBar}]`, `${percentStr}${warningStr}`, `(${tokensStr})`, costStr, usageStr, duration].filter(Boolean);
    lines.push(`  ${parts.join('  ')}`);

    // Line 2
    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : '';
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';

    const configParts: string[] = [];
    if (ctx.configCounts.claudeMdCount > 0) configParts.push(`${ctx.configCounts.claudeMdCount}md`);
    if (ctx.configCounts.rulesCount > 0) configParts.push(`${ctx.configCounts.rulesCount}rules`);
    if (ctx.configCounts.mcpCount > 0) configParts.push(`${ctx.configCounts.mcpCount}mcp`);

    lines.push(`  ${project}  #${git}${dirty}  ${dim(configParts.join(' '))}`);

    // Separator
    lines.push(dim(headerLine));

    // Tools
    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      lines.push('  ' + renderToolsLine(ctx));
    }

    // Agents
    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      for (const agent of ctx.transcript.agents.slice(0, 3)) {
        lines.push('  ' + renderAgentLine(agent));
      }
    }

    // Todos
    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      lines.push('  ' + renderTodoLine(ctx));
    }

    return lines;
  },
};

function summarizeTools(ctx: RenderContext): string {
  const toolCounts = new Map<string, number>();
  let running: string | null = null;

  for (const tool of ctx.transcript.tools) {
    toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
    if (tool.status === 'running') running = tool.name;
  }

  const parts: string[] = [];
  for (const [name, count] of toolCounts) {
    const marker = running === name ? '~' : '+';
    parts.push(`${name}${marker}${count > 1 ? count : ''}`);
  }

  return parts.join(' ');
}

function summarizeAgents(ctx: RenderContext): string {
  return ctx.transcript.agents
    .slice(0, 2)
    .map((a) => {
      const marker = a.status === 'running' ? '~' : '+';
      const model = a.model ? `[${a.model[0]}]` : '';
      return `${a.type}${marker}${model}`;
    })
    .join(' ');
}

function summarizeTodos(ctx: RenderContext): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (current) {
    return `>${current.content.substring(0, 15)}... ${completed}/${total}`;
  }
  return `${completed}/${total} done`;
}

function renderToolsLine(ctx: RenderContext): string {
  return ctx.transcript.tools
    .slice(0, 6)
    .map((t) => {
      const marker = t.status === 'running' ? '~' : t.status === 'error' ? 'x' : '+';
      const target = t.target ? ` ${t.target.split('/').pop()}` : '';
      return `${t.name}${marker}${target}`;
    })
    .join('  ');
}

function renderAgentLine(agent: any): string {
  const marker = agent.status === 'running' ? '~' : agent.status === 'error' ? 'x' : '+';
  const model = agent.model ? `[${agent.model}]` : '';
  const desc = agent.description ? ` ${agent.description.substring(0, 30)}` : '';
  return `${agent.type}${marker} ${model}${desc}`;
}

function renderTodoLine(ctx: RenderContext): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (current) {
    const bar = '#'.repeat(completed) + '-'.repeat(total - completed);
    return `> ${current.content} [${bar}] ${completed}/${total}`;
  }
  return `+ All done (${total}/${total})`;
}
