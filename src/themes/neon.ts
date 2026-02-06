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
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getModelName, getContextPercent, getAbsoluteTokens } from '../input/stdin.js';
import { hyperlink, fileUrl, githubBranchUrl } from '../render/links.js';
import {
  formatLinesDisplay,
  formatCacheDisplay,
  formatGitActivityDisplay,
  formatToolStatsDisplay,
  formatBashErrorsDisplay,
  formatCompactSuggestionDisplay,
  formatViolationsDisplay,
  formatWorkflowPhaseDisplay,
  formatTestCoverageDisplay,
  formatPassAtKDisplay,
  formatGitWorktreesDisplay,
  formatPerformanceMetricsDisplay,
  formatMcpStatusDisplay,
  formatSecurityDashboardDisplay,
  formatLearningTrackerDisplay,
  formatInstanceSyncDisplay,
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

    const projectGit = formatProjectGit(ctx, this.palette, this.icons);
    const durationText = hex(this.palette.muted, ` ${duration}`);

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    return [`${modelText}${sessionText} ${percentText}${projectGit}${linesDisplay}${durationText}`];
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

    const projectGit = formatProjectGit(ctx, this.palette, this.icons);

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

    lines.push(
      `${modelText}${sessionText}  ${progressText} ${contextText}  ${projectGit}${linesDisplay}${cacheDisplay}${usageText}  ${durationText}${speedText}`
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

    if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
      const skillsSummary = summarizeSkills(ctx, this.icons, this.palette);
      if (skillsSummary) activityParts.push(skillsSummary);
    }

    // New features: Git activity, Tool stats, Bash errors
    const gitActivityText = formatGitActivityDisplay(ctx, this.palette);
    if (gitActivityText) activityParts.push(gitActivityText);

    const toolStatsText = formatToolStatsDisplay(ctx, this.palette);
    if (toolStatsText) activityParts.push(toolStatsText);

    const bashErrorsText = formatBashErrorsDisplay(ctx, this.palette, this.icons);
    if (bashErrorsText) activityParts.push(bashErrorsText);


      // Violations
      const violationsText = formatViolationsDisplay(ctx, this.palette, this.icons);
      if (violationsText) activityParts.push(violationsText);

      // Compact suggestion
      const compactSuggestionText = formatCompactSuggestionDisplay(ctx, this.palette, this.icons);
      if (compactSuggestionText) activityParts.push(compactSuggestionText);

      // Workflow phase
      const workflowPhaseText = formatWorkflowPhaseDisplay(ctx, this.palette);
      if (workflowPhaseText) activityParts.push(workflowPhaseText);

      // Test coverage
      const testCoverageText = formatTestCoverageDisplay(ctx, this.palette, this.icons);
      if (testCoverageText) activityParts.push(testCoverageText);

      // Pass@k
      const passAtKText = formatPassAtKDisplay(ctx, this.palette);
      if (passAtKText) activityParts.push(passAtKText);

      // Git worktrees
      const worktreesText = formatGitWorktreesDisplay(ctx, this.palette);
      if (worktreesText) activityParts.push(worktreesText);

      // Performance
      const perfText = formatPerformanceMetricsDisplay(ctx, this.palette);
      if (perfText) activityParts.push(perfText);

      // MCP Status
      const mcpStatusText = formatMcpStatusDisplay(ctx, this.palette);
      if (mcpStatusText) activityParts.push(mcpStatusText);

      // Security Dashboard
      const securityText = formatSecurityDashboardDisplay(ctx, this.palette, this.icons);
      if (securityText) activityParts.push(securityText);

      // Learning Tracker
      const learningText = formatLearningTrackerDisplay(ctx, this.palette);
      if (learningText) activityParts.push(learningText);

      // Instance Sync
      const instanceSyncText = formatInstanceSyncDisplay(ctx, this.palette);
      if (instanceSyncText) activityParts.push(instanceSyncText);

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
    lines.push(hex(this.palette.blue, this.chars.boxVertical) + line1 + ' '.repeat(Math.max(0, innerWidth - line1.length + 10)) + hex(this.palette.blue, this.chars.boxVertical));

    // Middle border
    const midBorder = this.chars.boxVertical + this.chars.boxHorizontal.repeat(innerWidth) + this.chars.boxVertical;
    lines.push(hex(this.palette.blue, midBorder));

    // Line 2: Project/Git, Config
    const projectGit = formatProjectGit(ctx, this.palette, this.icons);

    const configParts: string[] = [];
    if (ctx.config.display.showConfigCounts) {
      if (ctx.configCounts.claudeMdCount > 0) configParts.push(`${ctx.configCounts.claudeMdCount} md`);
      if (ctx.configCounts.rulesCount > 0) configParts.push(`${ctx.configCounts.rulesCount} rules`);
      if (ctx.configCounts.mcpCount > 0) configParts.push(`${ctx.configCounts.mcpCount} mcp`);
    }
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

    if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
      const skillsLine = renderSkillsLine(ctx, this.icons, this.palette);
      if (skillsLine) lines.push('  ' + skillsLine);
    }

    // New features: Git activity, Tool stats, Bash errors
    const gitActivityText = formatGitActivityDisplay(ctx, this.palette);
    if (gitActivityText) lines.push('  ' + gitActivityText);

    const toolStatsText = formatToolStatsDisplay(ctx, this.palette);
    if (toolStatsText) lines.push('  ' + toolStatsText);

    const bashErrorsText = formatBashErrorsDisplay(ctx, this.palette, this.icons);
    if (bashErrorsText) lines.push('  ' + bashErrorsText);

    const violationsText = formatViolationsDisplay(ctx, this.palette, this.icons);
    if (violationsText) lines.push('  ' + violationsText);

    const compactSuggestionText = formatCompactSuggestionDisplay(ctx, this.palette, this.icons);
    if (compactSuggestionText) lines.push('  ' + compactSuggestionText);

    const workflowPhaseText = formatWorkflowPhaseDisplay(ctx, this.palette);
    if (workflowPhaseText) lines.push('  ' + workflowPhaseText);

    const testCoverageText = formatTestCoverageDisplay(ctx, this.palette, this.icons);
    if (testCoverageText) lines.push('  ' + testCoverageText);

    const passAtKText = formatPassAtKDisplay(ctx, this.palette);
    if (passAtKText) lines.push('  ' + passAtKText);

    const worktreesText = formatGitWorktreesDisplay(ctx, this.palette);
    if (worktreesText) lines.push('  ' + worktreesText);

    const perfText = formatPerformanceMetricsDisplay(ctx, this.palette);
    if (perfText) lines.push('  ' + perfText);

    const mcpStatusText = formatMcpStatusDisplay(ctx, this.palette);
    if (mcpStatusText) lines.push('  ' + mcpStatusText);

    const securityText = formatSecurityDashboardDisplay(ctx, this.palette, this.icons);
    if (securityText) lines.push('  ' + securityText);

    const learningText = formatLearningTrackerDisplay(ctx, this.palette);
    if (learningText) lines.push('  ' + learningText);

    const instanceSyncText = formatInstanceSyncDisplay(ctx, this.palette);
    if (instanceSyncText) lines.push('  ' + instanceSyncText);

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

function summarizeSkills(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const skillItems: string[] = [];

  for (const skill of ctx.transcript.skills.slice(0, 3)) {
    const icon = skill.status === 'running' ? icons.running : icons.success;
    const iconColor = skill.status === 'running' ? palette.yellow : palette.green;
    skillItems.push(hex(iconColor, `${skill.name.toUpperCase()}${icon}`));
  }

  return hex(palette.mauve, icons.skill) + ' ' + skillItems.join(' ');
}

function renderSkillsLine(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const parts: string[] = [];

  for (const skill of ctx.transcript.skills.slice(0, 5)) {
    const icon = skill.status === 'running' ? icons.running : skill.status === 'error' ? icons.error : icons.success;
    const iconColor = skill.status === 'running' ? palette.yellow : skill.status === 'error' ? palette.red : palette.green;
    const args = skill.args ? ` ${skill.args.toUpperCase()}` : '';
    parts.push(hex(palette.text, skill.name.toUpperCase()) + hex(iconColor, icon) + hex(palette.muted, args));
  }

  return hex(palette.mauve, icons.skill + ' SKILLS: ') + parts.join('   ');
}

/**
 * Format project and git with parentheses and clickable links (NEON style: uppercase)
 */
function formatProjectGit(ctx: RenderContext, palette: ColorPalette, _icons: IconSet): string {
  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop()?.toUpperCase() : null;
  const git = ctx.config.display.showGit ? (ctx.gitStatus?.branch || '') : '';
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
    let branchText = `${git.toUpperCase()}`;

    // Add tag if available
    if (ctx.gitStatus?.tag) {
      branchText += ` ${ctx.gitStatus.tag.toUpperCase()}`;
    }

    branchText += dirty;

    if (ctx.gitStatus?.remoteUrl) {
      const branchUrl = githubBranchUrl(ctx.gitStatus.remoteUrl, git);
      const branchLink = hyperlink(branchUrl, branchText);
      result += hex(palette.mauve, ` (${branchLink})`);
    } else {
      result += hex(palette.mauve, ` (${branchText})`);
    }
  }

  // Subdirectory repos (Neon style: uppercase)
  if (ctx.config.display.showAllBranches && ctx.gitStatus?.subRepos && ctx.gitStatus.subRepos.length > 0) {
    const subItems = ctx.gitStatus.subRepos.slice(0, 3).map((sub) => {
      const subDirty = sub.isDirty ? '*' : '';
      return `${sub.path.toUpperCase()}(${sub.branch.toUpperCase()}${subDirty})`;
    });

    const remaining = ctx.gitStatus.subRepos.length - 3;
    const moreText = remaining > 0 ? ` +${remaining}` : '';

    result += hex(palette.muted, `  SUBS: ${subItems.join(' ')}${moreText}`);
  }

  return result;
}
