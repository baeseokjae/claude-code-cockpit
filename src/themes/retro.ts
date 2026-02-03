/**
 * Retro theme - 80s terminal aesthetics
 */

import type { Theme, RenderContext } from '../types/index.js';
import { RETRO_PALETTE } from './palettes/retro.js';
import { FALLBACK_ICONS } from './icons.js';
import { hex, bold } from '../render/colors.js';
import { createProgressBar, formatPercent } from '../render/utils.js';
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getModelName, getContextPercent } from '../input/stdin.js';
import { hyperlink, fileUrl, githubBranchUrl } from '../render/links.js';

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

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const projectGit = formatProjectGit(ctx);

    const color = this.palette.text;
    return [hex(color, `[${model}]${sessionText} ${percentStr}${projectGit} | ${duration}`)];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const color = this.palette.text;
    const dimColor = this.palette.muted;

    const model = getModelName(ctx.stdin).toUpperCase();
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);

    const projectGit = formatProjectGit(ctx);
    const duration = ctx.sessionDuration;

    // Warning
    const warningColor = percent !== null && percent >= 75 ? this.palette.red : color;
    const warning = percent !== null && percent >= 90 ? ' [!ALERT!]' : percent !== null && percent >= 75 ? ' [WARN]' : '';

    lines.push(hex(color, `[${model}]${sessionText} `) + hex(warningColor, `[${progressBar}] ${percentStr}${warning}`) + hex(dimColor, `${projectGit} | ${duration}`));

    // Activity
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

    if (activityParts.length > 0) {
      lines.push(hex(dimColor, activityParts.join(' | ')));
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

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const warningColor = percent !== null && percent >= 75 ? this.palette.red : color;
    const warning = percent !== null && percent >= 90 ? bold(' [!CRITICAL ALERT!]') : percent !== null && percent >= 75 ? ' [WARNING]' : '';

    const line1 = ` MODEL: ${model}${sessionText}  MEM: [${progressBar}] ${percentStr}${warning}`;
    lines.push(hex(color, '║') + hex(warningColor, line1) + ' '.repeat(Math.max(0, innerWidth - line1.length)) + hex(color, '║'));

    // Project info
    const projectGit = formatProjectGit(ctx);
    const duration = ctx.sessionDuration;
    const cost = ctx.stdin.cost?.total_cost_usd;
    const costStr = cost ? `$${cost.toFixed(2)}` : '$0.00';

    // Token speed (Retro style: uppercase)
    const speedStr = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? `  SPEED: ${formatTokenSpeed(ctx.tokenSpeed, 'output').toUpperCase()}`
      : '';

    const line2 = ` ${projectGit}  TIME: ${duration}  COST: ${costStr}${speedStr}`;
    lines.push(hex(color, '║') + hex(dimColor, line2) + ' '.repeat(Math.max(0, innerWidth - line2.length)) + hex(color, '║'));

    // Separator
    lines.push(hex(color, '╠' + '═'.repeat(innerWidth) + '╣'));

    // Config counts
    const configs = [];
    if (ctx.configCounts.claudeMdCount > 0) configs.push(`MD:${ctx.configCounts.claudeMdCount}`);
    if (ctx.configCounts.rulesCount > 0) configs.push(`RULES:${ctx.configCounts.rulesCount}`);
    if (ctx.configCounts.mcpCount > 0) configs.push(`MCP:${ctx.configCounts.mcpCount}`);
    if (ctx.configCounts.hooksCount > 0) configs.push(`HOOKS:${ctx.configCounts.hooksCount}`);

    if (configs.length > 0) {
      const configLine = ` CONFIG: ${configs.join('  ')}`;
      lines.push(hex(color, '║') + hex(dimColor, configLine) + ' '.repeat(Math.max(0, innerWidth - configLine.length)) + hex(color, '║'));
    }

    // Tools
    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const toolsLine = ` TOOLS: ${summarizeTools(ctx, this.palette)}`;
      lines.push(hex(color, '║') + hex(color, toolsLine) + ' '.repeat(Math.max(0, innerWidth - toolsLine.length)) + hex(color, '║'));
    }

    // Agents
    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const agentsLine = ` AGENTS: ${summarizeAgents(ctx, this.palette)}`;
      lines.push(hex(color, '║') + hex(color, agentsLine) + ' '.repeat(Math.max(0, innerWidth - agentsLine.length)) + hex(color, '║'));
    }

    // Todos
    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const todosLine = ` TASKS: ${summarizeTodos(ctx, this.palette)}`;
      lines.push(hex(color, '║') + hex(color, todosLine) + ' '.repeat(Math.max(0, innerWidth - todosLine.length)) + hex(color, '║'));
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
    parts.push(`${name.toUpperCase()}${marker}${count > 1 ? count : ''}`);
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

/**
 * Format project and git with parentheses and clickable links (Retro style: uppercase)
 */
function formatProjectGit(ctx: RenderContext): string {
  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop()?.toUpperCase() : null;
  const git = ctx.gitStatus?.branch?.toUpperCase() || '';
  const dirty = ctx.gitStatus?.isDirty ? '*' : '';

  if (!project && !git) return '';

  let result = '';

  // Project name with file:// link
  if (project && ctx.stdin.cwd) {
    const projectLink = hyperlink(fileUrl(ctx.stdin.cwd), project);
    result += `DIR: ${projectLink}`;
  }

  // Git branch with GitHub link (if available)
  if (git) {
    const branchText = `${git}${dirty}`;

    if (ctx.gitStatus?.remoteUrl) {
      const branchUrl = githubBranchUrl(ctx.gitStatus.remoteUrl, ctx.gitStatus.branch || git);
      const branchLink = hyperlink(branchUrl, branchText);
      result += `  BRANCH: (${branchLink})`;
    } else {
      result += `  BRANCH: (${branchText})`;
    }
  }

  // Subdirectory repos (Retro style: uppercase)
  if (ctx.config.display.showAllBranches && ctx.gitStatus?.subRepos && ctx.gitStatus.subRepos.length > 0) {
    const subItems = ctx.gitStatus.subRepos.slice(0, 3).map((sub) => {
      const subDirty = sub.isDirty ? '*' : '';
      return `${sub.path.toUpperCase()}(${sub.branch.toUpperCase()}${subDirty})`;
    });

    const remaining = ctx.gitStatus.subRepos.length - 3;
    const moreText = remaining > 0 ? ` +${remaining}` : '';

    result += `  SUBS: ${subItems.join(' ')}${moreText}`;
  }

  return result;
}
