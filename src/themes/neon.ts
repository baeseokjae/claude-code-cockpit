/**
 * Neon theme - Cyberpunk high contrast
 */

import type { Theme, RenderContext } from '../types/index.js';
import { NEON_PALETTE } from './palettes/neon.js';
import { NERD_ICONS } from './icons.js';
import { hex, bold } from '../render/colors.js';
import { createProgressBar, formatPercent } from '../render/utils.js';
import { getModelName, getContextPercent } from '../input/stdin.js';

/**
 * Neon 테마
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
    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';
    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const duration = ctx.sessionDuration;

    const modelIcon = getModelIcon(model, this.icons);
    const modelText = hex(this.palette.blue, bold(`${modelIcon} ${model}`));

    const percentColor = getPercentColor(percent, this.palette);
    const percentText = hex(percentColor, bold(percentStr));

    const gitText = git ? hex(this.palette.teal, ` ${git}${dirty}`) : '';
    const durationText = hex(this.palette.muted, ` ${duration}`);

    return [`${modelText} ${percentText}${gitText}${durationText}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];

    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelIcon = getModelIcon(model, this.icons);
    const modelText = hex(this.palette.blue, bold(`${modelIcon} ${model}`));

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);
    const percentText = hex(progressColor, bold(percentStr));

    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop()?.toUpperCase() : null;
    const projectText = project ? hex(this.palette.teal, project) : '';

    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const gitText = git ? hex(this.palette.mauve, `${git}${dirty}`) : '';

    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    lines.push(
      `${modelText}  ${progressText} ${percentText}  ${projectText}  ${gitText}  ${durationText}`
    );

    // Line 2: Activity
    const activityParts: string[] = [];

    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const toolsSummary = summarizeTools(ctx, this.icons, this.palette);
      if (toolsSummary) activityParts.push(toolsSummary);
    }

    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const agentsSummary = summarizeAgents(ctx, this.icons, this.palette);
      if (agentsSummary) activityParts.push(agentsSummary);
    }

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
    const innerWidth = width - 2;

    // Box top
    const topBorder = this.chars.boxCornerTL + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxCornerTR;
    lines.push(hex(this.palette.blue, topBorder));

    // Line 1: Model, Progress, Context
    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelIcon = getModelIcon(model, this.icons);
    const modelText = hex(this.palette.blue, bold(`${modelIcon} ${model}`));

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);
    const progressColor = getPercentColor(percent, this.palette);
    const progressText = hex(progressColor, progressBar);
    const percentText = hex(progressColor, bold(percentStr));

    // Warning for high usage
    let warningText = '';
    if (percent !== null && percent >= 90) {
      warningText = hex(this.palette.red, bold('  CRITICAL!'));
    } else if (percent !== null && percent >= 75) {
      warningText = hex(this.palette.yellow, '  WARNING');
    }

    const cost = ctx.stdin.cost?.total_cost_usd;
    const costText = cost ? hex(this.palette.peach, `$${cost.toFixed(2)}`) : '';

    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    const line1 = `  ${modelText}   ${progressText} ${percentText}${warningText}   ${costText}   ${durationText}`;
    lines.push(hex(this.palette.blue, this.chars.boxVertical) + line1 + ' '.repeat(Math.max(0, innerWidth - line1.length + 10)) + hex(this.palette.blue, this.chars.boxVertical));

    // Middle border
    const midBorder = this.chars.boxVertical + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxVertical;
    lines.push(hex(this.palette.blue, midBorder));

    // Line 2: Project, Git, Config
    const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop()?.toUpperCase() : null;
    const projectText = project ? hex(this.palette.teal, `  ${project}`) : '';

    const git = ctx.gitStatus?.branch || '';
    const dirty = ctx.gitStatus?.isDirty ? '*' : '';
    const gitText = git ? hex(this.palette.mauve, `  ${git}${dirty}`) : '';

    const configParts: string[] = [];
    if (ctx.configCounts.claudeMdCount > 0) configParts.push(`${ctx.configCounts.claudeMdCount} md`);
    if (ctx.configCounts.rulesCount > 0) configParts.push(`${ctx.configCounts.rulesCount} rules`);
    if (ctx.configCounts.mcpCount > 0) configParts.push(`${ctx.configCounts.mcpCount} mcp`);
    const configText = configParts.length > 0 ? hex(this.palette.muted, `  ${configParts.join('  ')}`) : '';

    const line2 = `${projectText}${gitText}${configText}`;
    lines.push(hex(this.palette.blue, this.chars.boxVertical) + line2 + ' '.repeat(Math.max(0, innerWidth - line2.length + 10)) + hex(this.palette.blue, this.chars.boxVertical));

    // Box bottom
    const bottomBorder = this.chars.boxCornerBL + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxCornerBR;
    lines.push(hex(this.palette.blue, bottomBorder));

    // Activity lines outside box
    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const toolsLine = renderToolsLine(ctx, this.icons, this.palette);
      if (toolsLine) lines.push('  ' + toolsLine);
    }

    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      for (const agent of ctx.transcript.agents.slice(0, 3)) {
        const agentLine = renderAgentLine(agent, this.icons, this.palette);
        if (agentLine) lines.push('  ' + agentLine);
      }
    }

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
  return icons.modelSonnet;
}

function getPercentColor(percent: number | null, palette: typeof NEON_PALETTE): string {
  if (percent === null) return palette.text;
  if (percent >= 90) return palette.progressCritical;
  if (percent >= 75) return palette.progressHigh;
  if (percent >= 50) return palette.progressMid;
  return palette.progressLow;
}

function summarizeTools(ctx: RenderContext, icons: typeof NERD_ICONS, palette: typeof NEON_PALETTE): string {
  const parts: string[] = [];
  const toolCounts = new Map<string, number>();
  let runningTool: string | null = null;

  for (const tool of ctx.transcript.tools) {
    toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
    if (tool.status === 'running') runningTool = tool.name;
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

function summarizeAgents(ctx: RenderContext, icons: typeof NERD_ICONS, palette: typeof NEON_PALETTE): string {
  const parts: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 2)) {
    const icon = agent.status === 'running' ? icons.running : icons.success;
    const color = agent.status === 'running' ? palette.yellow : palette.green;
    const modelAbbr = agent.model ? `[${agent.model[0].toUpperCase()}]` : '';
    parts.push(hex(color, `${agent.type.toUpperCase()}${icon}`) + hex(palette.muted, modelAbbr));
  }

  return parts.join(' ');
}

function summarizeTodos(ctx: RenderContext, palette: typeof NEON_PALETTE): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (inProgress) {
    const shortContent = inProgress.content.substring(0, 20).toUpperCase();
    return hex(palette.yellow, `▸ ${shortContent}`) + hex(palette.muted, ` ${completed}/${total}`);
  }

  return hex(palette.muted, `${completed}/${total} TASKS`);
}

function renderToolsLine(ctx: RenderContext, icons: typeof NERD_ICONS, palette: typeof NEON_PALETTE): string {
  const parts: string[] = [];

  for (const tool of ctx.transcript.tools.slice(0, 5)) {
    const icon = tool.status === 'running' ? icons.running : tool.status === 'error' ? icons.error : icons.success;
    const color = tool.status === 'running' ? palette.yellow : tool.status === 'error' ? palette.red : palette.green;
    const target = tool.target ? ` ${tool.target}` : '';
    parts.push(hex(color, `${tool.name}${icon}`) + hex(palette.subtext, target));
  }

  return parts.join('   ');
}

function renderAgentLine(agent: any, icons: typeof NERD_ICONS, palette: typeof NEON_PALETTE): string {
  const icon = agent.status === 'running' ? icons.running : agent.status === 'error' ? icons.error : icons.success;
  const color = agent.status === 'running' ? palette.yellow : agent.status === 'error' ? palette.red : palette.green;
  const modelAbbr = agent.model ? `[${agent.model.toUpperCase()}]` : '';
  const desc = agent.description ? ` ${agent.description.substring(0, 40).toUpperCase()}` : '';
  return hex(color, `${agent.type.toUpperCase()}${icon}`) + hex(palette.muted, ` ${modelAbbr}`) + hex(palette.subtext, desc);
}

function renderTodoLine(ctx: RenderContext, palette: typeof NEON_PALETTE): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (inProgress) {
    const progressBar = '█'.repeat(completed) + '░'.repeat(total - completed);
    return hex(palette.yellow, `▸ ${inProgress.content.toUpperCase()}`) + hex(palette.muted, ` (${completed}/${total}) ${progressBar}`);
  }

  return hex(palette.green, `✓ ALL TASKS COMPLETED`) + hex(palette.muted, ` (${total}/${total})`);
}
