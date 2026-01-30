/**
 * Aurora theme (default)
 */

import type { Theme, RenderContext, Alert } from '../types/index.js';
import { AURORA_PALETTE } from './palettes/aurora.js';
import { NERD_ICONS } from './icons.js';
import { hex, bold } from '../render/colors.js';
import { createProgressBar, formatPercent } from '../render/utils.js';
import { getModelName, getContextPercent } from '../input/stdin.js';
import { getMostSevereAlert, getAlertColorKey } from '../data/alerts.js';

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

  icons: NERD_ICONS,

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
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const duration = ctx.sessionDuration;

    const modelIcon = getModelIcon(model, this.icons);
    const modelText = hex(this.palette.blue, `${modelIcon} ${model}`);

    const percentColor = getPercentColor(percent, this.palette);
    const percentText = hex(percentColor, percentStr);

    const gitText = git ? hex(this.palette.teal, ` ${this.icons.branch} ${git}${dirty}`) : '';

    const durationText = hex(this.palette.muted, ` ${duration}`);
    const alertText = renderAlertBadge(ctx.alerts, this.palette);

    return [`${modelText} ${percentText}${gitText}${durationText}${alertText}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];

    // Line 1: Header
    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelIcon = getModelIcon(model, this.icons);
    const modelText = hex(this.palette.blue, `${modelIcon} ${model}`);

    // Progress bar
    const progressBar = this.features.useGradientProgress
      ? createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty)
      : '';
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);

    const percentText = hex(progressColor, percentStr);

    // Project name
    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : null;
    const projectText = project ? hex(this.palette.teal, project) : '';

    // Git
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const gitText = git ? hex(this.palette.teal, `${this.icons.branch} ${git}${dirty}`) : '';

    // Duration
    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    // Alert badge
    const alertText = renderAlertBadge(ctx.alerts, this.palette);

    lines.push(
      `${modelText}  ${progressText} ${percentText}  ${projectText}  ${gitText}  ${durationText}${alertText}`
    );

    // Line 2: Activity
    const activityParts: string[] = [];

    // Tools
    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const toolsSummary = summarizeTools(ctx, this.icons, this.palette);
      if (toolsSummary) activityParts.push(toolsSummary);
    }

    // Agents
    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const agentsSummary = summarizeAgents(ctx, this.icons, this.palette);
      if (agentsSummary) activityParts.push(agentsSummary);
    }

    // Todos
    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const todosSummary = summarizeTodos(ctx, this.palette);
      if (todosSummary) activityParts.push(todosSummary);
    }

    if (activityParts.length > 0) {
      lines.push(activityParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
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

    const modelIcon = getModelIcon(model, this.icons);
    const modelText = hex(this.palette.blue, `${modelIcon} ${model}`);

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);
    const percentText = hex(progressColor, percentStr);

    // Tokens
    const tokens = ctx.stdin.context_window?.current_usage;
    const tokensText = tokens ? hex(this.palette.subtext, `(${Math.round((tokens.input_tokens || 0) / 1000)}k/${Math.round((ctx.stdin.context_window?.context_window_size || 200000) / 1000)}k)`) : '';

    // Cost
    const cost = ctx.stdin.cost?.total_cost_usd;
    const costText = cost ? hex(this.palette.peach, ` ~$${cost.toFixed(2)}`) : '';

    // Duration
    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    const line1Content = `  ${modelText}   ${progressText} ${percentText}  ${tokensText}${costText}   ${durationText}`;
    lines.push(this.chars.boxVertical + line1Content + ' '.repeat(Math.max(0, width - 2 - line1Content.length)) + this.chars.boxVertical);

    // Middle border
    const middleBorder = hex(this.palette.overlay, this.chars.boxHorizontal.repeat(width));
    lines.push(middleBorder);

    // Line 2: Project, Git, Config counts
    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : null;
    const projectText = project ? hex(this.palette.teal, `  ${project}`) : '';

    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const gitText = git ? hex(this.palette.teal, `  ${this.icons.branch} ${git}${dirty}`) : '';

    const configParts: string[] = [];
    if (ctx.configCounts.claudeMdCount > 0) {
      configParts.push(`${ctx.configCounts.claudeMdCount} md`);
    }
    if (ctx.configCounts.rulesCount > 0) {
      configParts.push(`${ctx.configCounts.rulesCount} rules`);
    }
    if (ctx.configCounts.mcpCount > 0) {
      configParts.push(`${ctx.configCounts.mcpCount} mcp`);
    }
    const configText = configParts.length > 0 ? hex(this.palette.muted, `  ${configParts.join('  ')}`) : '';

    const line2Content = `${projectText}${gitText}${configText}`;
    lines.push(this.chars.boxVertical + line2Content + ' '.repeat(Math.max(0, width - 2 - line2Content.length)) + this.chars.boxVertical);

    // Box bottom
    const bottomBorder = this.chars.boxCornerBL + this.chars.boxHorizontal.repeat(width - 2) + this.chars.boxCornerBR;
    lines.push(hex(this.palette.overlay, bottomBorder));

    // Activity lines (outside box)
    // Tools
    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const toolsLine = renderToolsLine(ctx, this.icons, this.palette);
      if (toolsLine) lines.push('  ' + toolsLine);
    }

    // Agents
    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      for (const agent of ctx.transcript.agents.slice(0, 3)) {
        const agentLine = renderAgentLine(agent, this.icons, this.palette);
        if (agentLine) lines.push('  ' + agentLine);
      }
    }

    // Todos
    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const todoLine = renderTodoLine(ctx, this.palette);
      if (todoLine) lines.push('  ' + todoLine);
    }

    return lines;
  },
};

function getModelIcon(model: string, icons: typeof NERD_ICONS): string {
  const lower = model.toLowerCase();
  if (lower.includes('opus')) return icons.modelOpus;
  if (lower.includes('sonnet')) return icons.modelSonnet;
  if (lower.includes('haiku')) return icons.modelHaiku;
  return icons.modelSonnet; // default
}

function getPercentColor(percent: number | null, palette: typeof AURORA_PALETTE): string {
  if (percent === null) return palette.text;
  if (percent >= 90) return palette.progressCritical;
  if (percent >= 75) return palette.progressHigh;
  if (percent >= 50) return palette.progressMid;
  return palette.progressLow;
}

function summarizeTools(ctx: RenderContext, icons: typeof NERD_ICONS, palette: typeof AURORA_PALETTE): string {
  const parts: string[] = [];

  const toolCounts = new Map<string, number>();
  let runningTool: string | null = null;

  for (const tool of ctx.transcript.tools) {
    const count = toolCounts.get(tool.name) || 0;
    toolCounts.set(tool.name, count + 1);

    if (tool.status === 'running') {
      runningTool = tool.name;
    }
  }

  for (const [name, count] of toolCounts) {
    const isRunning = runningTool === name;
    const icon = isRunning ? icons.running : icons.success;
    const color = isRunning ? palette.yellow : palette.green;
    const countStr = count > 1 ? hex(palette.subtext, `${count}`) : '';
    parts.push(hex(color, `${name}${icon}`) + countStr);
  }

  return parts.join(' ');
}

function summarizeAgents(ctx: RenderContext, icons: typeof NERD_ICONS, palette: typeof AURORA_PALETTE): string {
  const parts: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 2)) {
    const icon = agent.status === 'running' ? icons.running : icons.success;
    const color = agent.status === 'running' ? palette.yellow : palette.green;
    const modelAbbr = agent.model ? `[${agent.model[0]}]` : '';
    parts.push(hex(color, `${agent.type}${icon}`) + hex(palette.muted, modelAbbr));
  }

  return parts.join(' ');
}

function summarizeTodos(ctx: RenderContext, palette: typeof AURORA_PALETTE): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (inProgress) {
    const shortContent = inProgress.content.substring(0, 20);
    return hex(palette.yellow, `▸ ${shortContent}`) + hex(palette.muted, ` ${completed}/${total}`);
  }

  return hex(palette.muted, `${completed}/${total} tasks`);
}

function renderToolsLine(ctx: RenderContext, icons: typeof NERD_ICONS, palette: typeof AURORA_PALETTE): string {
  const parts: string[] = [];

  for (const tool of ctx.transcript.tools.slice(0, 5)) {
    const icon = tool.status === 'running' ? icons.running : tool.status === 'error' ? icons.error : icons.success;
    const color = tool.status === 'running' ? palette.yellow : tool.status === 'error' ? palette.red : palette.green;
    const target = tool.target ? ` ${tool.target}` : '';
    parts.push(hex(color, `${tool.name}${icon}`) + hex(palette.subtext, target));
  }

  return parts.join('   ');
}

function renderAgentLine(agent: any, icons: typeof NERD_ICONS, palette: typeof AURORA_PALETTE): string {
  const icon = agent.status === 'running' ? icons.running : agent.status === 'error' ? icons.error : icons.success;
  const color = agent.status === 'running' ? palette.yellow : agent.status === 'error' ? palette.red : palette.green;
  const modelAbbr = agent.model ? `[${agent.model}]` : '';
  const desc = agent.description ? ` ${agent.description.substring(0, 40)}` : '';
  return hex(color, `${agent.type}${icon}`) + hex(palette.muted, ` ${modelAbbr}`) + hex(palette.subtext, desc);
}

function renderTodoLine(ctx: RenderContext, palette: typeof AURORA_PALETTE): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (inProgress) {
    const progressBar = '●'.repeat(completed) + '○'.repeat(total - completed);
    return hex(palette.yellow, `▸ ${inProgress.content}`) + hex(palette.muted, ` (${completed}/${total}) ${progressBar}`);
  }

  return hex(palette.green, `✓ All tasks completed`) + hex(palette.muted, ` (${total}/${total})`);
}

function renderAlertBadge(alerts: Alert[], palette: typeof AURORA_PALETTE): string {
  if (!alerts || alerts.length === 0) return '';

  const alert = getMostSevereAlert(alerts);
  if (!alert) return '';

  const colorKey = getAlertColorKey(alert.severity);
  const color = getAlertColor(colorKey, palette);

  if (alert.severity === 'critical') {
    return ' ' + hex(color, bold(`⚠ ${alert.shortMessage}`));
  }

  if (alert.severity === 'warning') {
    return ' ' + hex(color, `⚠ ${alert.shortMessage}`);
  }

  return '';
}

function getAlertColor(colorKey: string, palette: typeof AURORA_PALETTE): string {
  switch (colorKey) {
    case 'progressCritical':
      return palette.progressCritical;
    case 'progressHigh':
      return palette.progressHigh;
    case 'progressMid':
      return palette.progressMid;
    default:
      return palette.text;
  }
}
