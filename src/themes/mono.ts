/**
 * Mono theme - Black and white minimal, ASCII compatible
 */

import type { Theme, RenderContext } from '../types/index.js';
import { MONO_PALETTE } from './palettes/mono.js';
import { FALLBACK_ICONS } from './icons.js';
import { dim, bold } from '../render/colors.js';
import { createProgressBar, formatPercent } from '../render/utils.js';
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getModelName, getContextPercent, getAbsoluteTokens } from '../input/stdin.js';
import { hyperlink, fileUrl, githubBranchUrl } from '../render/links.js';

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
    const duration = ctx.sessionDuration;

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const projectGit = formatProjectGit(ctx);

    // Text only, no colors
    return [`[${model}]${sessionText} ${percentStr}${projectGit} | ${duration}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];

    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? ` [${sessionName}]` : '';

    const progressBar = createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty);

    const projectGit = formatProjectGit(ctx);
    const duration = ctx.sessionDuration;

    // Usage (Mono style: no color)
    const usage = ctx.config.display.showUsage && ctx.usageData
      ? ` | 5h:${Math.round(ctx.usageData.fiveHour)}%`
      : '';

    // Warning marker
    const warning = percent !== null && percent >= 75 ? ' !' : '';

    lines.push(`[${model}]${sessionText} [${progressBar}] ${percentStr}${warning}${projectGit}${usage} | ${duration}`);

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

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionStr = sessionName ? ` [${sessionName}]` : '';

    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let tokensStr = '';

    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      tokensStr = `${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k`;
    } else {
      const tokens = ctx.stdin.context_window?.current_usage;
      tokensStr = tokens ? `${Math.round((tokens.input_tokens || 0) / 1000)}k/${Math.round((ctx.stdin.context_window?.context_window_size || 200000) / 1000)}k` : '';
    }

    const cost = ctx.stdin.cost?.total_cost_usd;
    const costStr = cost ? `$${cost.toFixed(2)}` : '';

    // Usage (Mono style: no color)
    const usageStr = ctx.config.display.showUsage && ctx.usageData
      ? `5h:${Math.round(ctx.usageData.fiveHour)}%`
      : '';

    const duration = ctx.sessionDuration;

    // Token speed (Mono style: no color)
    const speedStr = ctx.config.display.showTokenSpeed && ctx.tokenSpeed
      ? formatTokenSpeed(ctx.tokenSpeed, 'output')
      : '';

    // Warning
    let warningStr = '';
    if (percent !== null && percent >= 90) {
      warningStr = bold(' [CRITICAL]');
    } else if (percent !== null && percent >= 75) {
      warningStr = ' [WARNING]';
    }

    const parts = [`${bold(model)}${sessionStr}`, `[${progressBar}]`, `${percentStr}${warningStr}`, `(${tokensStr})`, costStr, usageStr, duration, speedStr].filter(Boolean);
    lines.push(`  ${parts.join('  ')}`);

    // Line 2
    const projectGit = formatProjectGit(ctx);

    const configParts: string[] = [];
    if (ctx.configCounts.claudeMdCount > 0) configParts.push(`${ctx.configCounts.claudeMdCount}md`);
    if (ctx.configCounts.rulesCount > 0) configParts.push(`${ctx.configCounts.rulesCount}rules`);
    if (ctx.configCounts.mcpCount > 0) configParts.push(`${ctx.configCounts.mcpCount}mcp`);

    lines.push(`  ${projectGit}  ${dim(configParts.join(' '))}`);

    // Separator
    lines.push(dim(headerLine));

    // Tools
    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      lines.push('  ' + renderToolsLine(ctx));
    }

    // Agents
    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      lines.push('  ' + renderAgentsLine(ctx));
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

  return '● ' + parts.join(' ');
}

function summarizeAgents(ctx: RenderContext): string {
  const agentItems = ctx.transcript.agents
    .slice(0, 2)
    .map((a) => {
      const marker = a.status === 'running' ? '~' : '+';
      const model = a.model ? `[${a.model[0]}]` : '';
      return `${a.type}${marker}${model}`;
    })
    .join(' ');

  return '● ' + agentItems;
}

function summarizeTodos(ctx: RenderContext): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (current) {
    return `● >${current.content.substring(0, 15)}... ${completed}/${total}`;
  }
  return `● ${completed}/${total}`;
}

function renderToolsLine(ctx: RenderContext): string {
  const tools = ctx.transcript.tools
    .slice(0, 6)
    .map((t) => {
      const marker = t.status === 'running' ? '~' : t.status === 'error' ? 'x' : '+';
      const target = t.target ? ` ${t.target.split('/').pop()}` : '';
      return `${t.name}${marker}${target}`;
    })
    .join('  ');

  return '● Tools: ' + tools;
}

function renderAgentsLine(ctx: RenderContext): string {
  const agents = ctx.transcript.agents
    .slice(0, 3)
    .map((agent) => {
      const marker = agent.status === 'running' ? '~' : agent.status === 'error' ? 'x' : '+';
      const model = agent.model ? `[${agent.model}]` : '';
      const desc = agent.description ? ` ${agent.description.substring(0, 30)}` : '';
      return `${agent.type}${marker} ${model}${desc}`;
    })
    .join('  ');

  return '● Agents: ' + agents;
}

function renderTodoLine(ctx: RenderContext): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (current) {
    const bar = '#'.repeat(completed) + '-'.repeat(total - completed);
    return `● Todos: > ${current.content} [${bar}] ${completed}/${total}`;
  }
  return `● Todos: + All done (${total}/${total})`;
}

/**
 * Format project and git with parentheses and clickable links (Mono style: no colors)
 */
function formatProjectGit(ctx: RenderContext): string {
  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : null;
  const git = ctx.gitStatus?.branch || '';
  const dirty = ctx.gitStatus?.isDirty ? '*' : '';

  if (!project && !git) return '';

  let result = ' | ';

  // Project name with file:// link
  if (project && ctx.stdin.cwd) {
    const projectLink = hyperlink(fileUrl(ctx.stdin.cwd), project);
    result += projectLink;
  }

  // Git branch with GitHub link (if available)
  if (git) {
    const branchText = `${git}${dirty}`;

    if (ctx.gitStatus?.remoteUrl) {
      const branchUrl = githubBranchUrl(ctx.gitStatus.remoteUrl, git);
      const branchLink = hyperlink(branchUrl, branchText);
      result += ` (${branchLink})`;
    } else {
      result += ` (${branchText})`;
    }
  }

  // Subdirectory repos (Mono style: plain text)
  if (ctx.config.display.showAllBranches && ctx.gitStatus?.subRepos && ctx.gitStatus.subRepos.length > 0) {
    const subItems = ctx.gitStatus.subRepos.slice(0, 3).map((sub) => {
      const subDirty = sub.isDirty ? '*' : '';
      return `${sub.path}(${sub.branch}${subDirty})`;
    });

    const remaining = ctx.gitStatus.subRepos.length - 3;
    const moreText = remaining > 0 ? ` +${remaining}` : '';

    result += `  subs: ${subItems.join(' ')}${moreText}`;
  }

  return result;
}
