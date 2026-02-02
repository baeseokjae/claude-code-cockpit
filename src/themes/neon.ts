/**
 * Neon theme - Cyberpunk high contrast
 *
 * Display Tiers:
 * - Tier 1 (renderMinimal): Model, context%, Git, duration
 * - Tier 2 (renderCompact): Tier 1 + tool counts, agent status, Todo summary
 * - Tier 3 (renderFull): Tier 2 + box layout, token details, cost, config counts
 */

import type { Theme, RenderContext, IconSet, ColorPalette } from '../types/index.js';
import { NEON_PALETTE } from './palettes/neon.js';
import { getIcons } from './icons.js';
import { hex, bold } from '../render/colors.js';
import { createProgressBar, formatPercent } from '../render/utils.js';
import { formatCount } from '../render/superscript.js';
import { getUsageColor } from '../render/usage.js';
import { formatResetTime } from '../data/usage-api.js';
import { getModelName, getContextPercent } from '../input/stdin.js';
import { hyperlink, fileUrl, githubBranchUrl } from '../render/links.js';

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

    const projectGit = formatProjectGit(ctx, this.palette, this.icons);
    const durationText = hex(this.palette.muted, ` ${duration}`);

    return [`${modelText}${sessionText} ${percentText}${projectGit}${durationText}`];
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
    const percentText = hex(progressColor, bold(percentStr));

    const projectGit = formatProjectGit(ctx, this.palette, this.icons);

    const duration = ctx.sessionDuration;
    const durationText = hex(this.palette.muted, duration);

    // Usage (Neon style: uppercase)
    const usageText = ctx.config.display.showUsage && ctx.usageData
      ? '  ' + hex(getUsageColor(ctx.usageData.fiveHour, this.palette), bold(`5H:${Math.round(ctx.usageData.fiveHour)}%`))
      : '';

    lines.push(
      `${modelText}${sessionText}  ${progressText} ${percentText}  ${projectGit}${usageText}  ${durationText}`
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
      const todosSummary = summarizeTodos(ctx, this.icons, this.palette);
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

    const modelText = hex(this.palette.blue, bold(model));

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(this.palette.muted, ` [${sessionName}]`) : '';

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

    const line1 = `  ${modelText}${sessionText}   ${progressText} ${percentText}${warningText}   ${costText}${usageText}   ${durationText}`;
    lines.push(hex(this.palette.blue, this.chars.boxVertical) + line1 + ' '.repeat(Math.max(0, innerWidth - line1.length + 10)) + hex(this.palette.blue, this.chars.boxVertical));

    // Middle border
    const midBorder = this.chars.boxVertical + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxVertical;
    lines.push(hex(this.palette.blue, midBorder));

    // Line 2: Project/Git, Config
    const projectGit = formatProjectGit(ctx, this.palette, this.icons);

    const configParts: string[] = [];
    if (ctx.configCounts.claudeMdCount > 0) configParts.push(`${ctx.configCounts.claudeMdCount} md`);
    if (ctx.configCounts.rulesCount > 0) configParts.push(`${ctx.configCounts.rulesCount} rules`);
    if (ctx.configCounts.mcpCount > 0) configParts.push(`${ctx.configCounts.mcpCount} mcp`);
    const configText = configParts.length > 0 ? hex(this.palette.muted, `  ${configParts.join('  ')}`) : '';

    const line2 = `  ${projectGit}${configText}`;
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
      const agentsLine = renderAgentsLine(ctx, this.icons, this.palette);
      if (agentsLine) lines.push('  ' + agentsLine);
    }

    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const todoLine = renderTodoLine(ctx, this.icons, this.palette);
      if (todoLine) lines.push('  ' + todoLine);
    }

    return lines;
  },
};

function getPercentColor(percent: number | null, palette: ColorPalette): string {
  if (percent === null) return palette.text;
  if (percent >= 90) return palette.progressCritical;
  if (percent >= 75) return palette.progressHigh;
  if (percent >= 50) return palette.progressMid;
  return palette.progressLow;
}

function summarizeTools(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const toolItems: string[] = [];
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
    const countStr = formatCount(count);
    toolItems.push(hex(color, `${name}${icon}${countStr}`));
  }

  return hex(palette.categoryTools, icons.categoryTools) + ' ' + toolItems.join(' ');
}

function summarizeAgents(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const agentItems: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 2)) {
    const icon = agent.status === 'running' ? icons.running : icons.success;
    const color = agent.status === 'running' ? palette.yellow : palette.green;
    const modelAbbr = agent.model ? `[${agent.model[0].toUpperCase()}]` : '';
    agentItems.push(hex(color, `${agent.type.toUpperCase()}${icon}`) + hex(palette.muted, modelAbbr));
  }

  return hex(palette.categoryAgents, icons.categoryAgents) + ' ' + agentItems.join(' ');
}

function summarizeTodos(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  const label = hex(palette.categoryTodos, icons.categoryTodos);

  if (inProgress) {
    const shortContent = inProgress.content.substring(0, 20).toUpperCase();
    return label + ' ' + hex(palette.yellow, `▸ ${shortContent}`) + hex(palette.muted, ` ${completed}/${total}`);
  }

  return label + ' ' + hex(palette.muted, `${completed}/${total}`);
}

function renderToolsLine(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const parts: string[] = [];

  for (const tool of ctx.transcript.tools.slice(0, 5)) {
    const icon = tool.status === 'running' ? icons.running : tool.status === 'error' ? icons.error : icons.success;
    const iconColor = tool.status === 'running' ? palette.yellow : tool.status === 'error' ? palette.red : palette.green;
    const target = tool.target ? ` ${tool.target}` : '';
    parts.push(hex(palette.text, tool.name) + hex(iconColor, icon) + hex(palette.muted, target));
  }

  return hex(palette.categoryTools, icons.categoryTools + ' TOOLS: ') + parts.join('   ');
}

function renderAgentsLine(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const agentParts: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 3)) {
    const icon = agent.status === 'running' ? icons.running : agent.status === 'error' ? icons.error : icons.success;
    const iconColor = agent.status === 'running' ? palette.yellow : agent.status === 'error' ? palette.red : palette.green;
    const modelAbbr = agent.model ? `[${agent.model.toUpperCase()}]` : '';
    const desc = agent.description ? ` ${agent.description.substring(0, 40).toUpperCase()}` : '';
    agentParts.push(hex(palette.text, agent.type.toUpperCase()) + hex(iconColor, icon) + hex(palette.muted, ` ${modelAbbr}`) + hex(palette.muted, desc));
  }

  return hex(palette.categoryAgents, icons.categoryAgents + ' AGENTS: ') + agentParts.join('   ');
}

function renderTodoLine(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  const label = hex(palette.categoryTodos, icons.categoryTodos + ' TODOS: ');

  if (inProgress) {
    const progressBar = '█'.repeat(completed) + '░'.repeat(total - completed);
    return label + hex(palette.yellow, '▸ ') + hex(palette.text, inProgress.content.toUpperCase()) + hex(palette.muted, ` (${completed}/${total}) ${progressBar}`);
  }

  return label + hex(palette.green, '✓ ') + hex(palette.text, 'ALL TASKS COMPLETED') + hex(palette.muted, ` (${total}/${total})`);
}

/**
 * Format project and git with parentheses and clickable links (NEON style: uppercase)
 */
function formatProjectGit(ctx: RenderContext, palette: ColorPalette, _icons: IconSet): string {
  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop()?.toUpperCase() : null;
  const git = ctx.gitStatus?.branch || '';
  const dirty = ctx.gitStatus?.isDirty ? '*' : '';

  if (!project && !git) return '';

  let result = '';

  // Project name with file:// link
  if (project && ctx.stdin.cwd) {
    const projectLink = hyperlink(fileUrl(ctx.stdin.cwd), project);
    result += hex(palette.teal, projectLink);
  }

  // Git branch with GitHub link (if available)
  if (git) {
    const branchText = `${git.toUpperCase()}${dirty}`;

    if (ctx.gitStatus?.remoteUrl) {
      const branchUrl = githubBranchUrl(ctx.gitStatus.remoteUrl, git);
      const branchLink = hyperlink(branchUrl, branchText);
      result += hex(palette.mauve, ` (${branchLink})`);
    } else {
      result += hex(palette.mauve, ` (${branchText})`);
    }
  }

  return result;
}
