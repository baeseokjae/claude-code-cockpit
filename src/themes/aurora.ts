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

import type { Theme, RenderContext, IconSet, ColorPalette } from '../types/index.js';
import { AURORA_PALETTE } from './palettes/aurora.js';
import { getIcons } from './icons.js';
import { hex } from '../render/colors.js';
import { createProgressBar, formatPercent } from '../render/utils.js';
import { formatCount } from '../render/superscript.js';
import { formatUsageCompact, formatUsageFull } from '../render/usage.js';
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

    // Project and git with parentheses and links
    const projectGit = formatProjectGit(ctx, this.palette, this.icons);

    const durationText = hex(this.palette.muted, ` ${duration}`);

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    return [`${modelText}${sessionText} ${percentText}${projectGit}${linesDisplay}${durationText}`];
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

    // Project and git with parentheses and links
    const projectGit = formatProjectGit(ctx, this.palette, this.icons);

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

    lines.push(
      `${modelText}${sessionText}  ${progressText} ${contextText}  ${projectGit}${linesDisplay}${cacheDisplay}${usageText}  ${durationText}${speedText}`
    );

    // Line 2+: Activity (detailMode or compact)
    if (ctx.detailMode) {
      // Tools summary statistics
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatToolsSummary(ctx.transcript.tools, this.palette, this.icons);
        lines.push('  ' + toolsSummary);
      }

      // Agents summary
      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatAgentsSummary(ctx.transcript.agents, this.palette, this.icons);
        lines.push('  ' + agentsSummary);
      }

      // Todos summary
      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatTodosSummary(ctx.transcript.todos, this.palette, this.icons);
        lines.push('  ' + todosSummary);
      }

      // Usage detail
      if (ctx.config.display.showUsage && ctx.usageData) {
        const usageSummary = formatUsageSummaryLine(ctx.usageData, this.palette);
        lines.push('  ' + usageSummary);
      }

      // Advanced feature widgets
      const advancedParts: string[] = [];

      const gitActivityText = formatGitActivityDisplay(ctx, this.palette);
      if (gitActivityText) advancedParts.push(gitActivityText);

      const toolStatsText = formatToolStatsDisplay(ctx, this.palette);
      if (toolStatsText) advancedParts.push(toolStatsText);

      const bashErrorsText = formatBashErrorsDisplay(ctx, this.palette, this.icons);
      if (bashErrorsText) advancedParts.push(bashErrorsText);

      const violationsText = formatViolationsDisplay(ctx, this.palette, this.icons);
      if (violationsText) advancedParts.push(violationsText);

      const compactSuggestionText = formatCompactSuggestionDisplay(ctx, this.palette, this.icons);
      if (compactSuggestionText) advancedParts.push(compactSuggestionText);

      const workflowPhaseText = formatWorkflowPhaseDisplay(ctx, this.palette);
      if (workflowPhaseText) advancedParts.push(workflowPhaseText);

      const testCoverageText = formatTestCoverageDisplay(ctx, this.palette, this.icons);
      if (testCoverageText) advancedParts.push(testCoverageText);

      const passAtKText = formatPassAtKDisplay(ctx, this.palette);
      if (passAtKText) advancedParts.push(passAtKText);

      const worktreesText = formatGitWorktreesDisplay(ctx, this.palette);
      if (worktreesText) advancedParts.push(worktreesText);

      const perfText = formatPerformanceMetricsDisplay(ctx, this.palette);
      if (perfText) advancedParts.push(perfText);

      const mcpStatusText = formatMcpStatusDisplay(ctx, this.palette);
      if (mcpStatusText) advancedParts.push(mcpStatusText);

      const securityText = formatSecurityDashboardDisplay(ctx, this.palette, this.icons);
      if (securityText) advancedParts.push(securityText);

      const learningText = formatLearningTrackerDisplay(ctx, this.palette);
      if (learningText) advancedParts.push(learningText);

      const instanceSyncText = formatInstanceSyncDisplay(ctx, this.palette);
      if (instanceSyncText) advancedParts.push(instanceSyncText);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    } else {
      // Compact mode: summary line
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
        const todosSummary = summarizeTodos(ctx, this.palette, this.icons);
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
    const projectGit = formatProjectGit(ctx, this.palette, this.icons);

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
    lines.push(this.chars.boxVertical + line1Content + ' '.repeat(Math.max(0, width - 2 - line1Content.length)) + this.chars.boxVertical);

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
    lines.push(this.chars.boxVertical + line2Content + ' '.repeat(Math.max(0, width - 2 - line2Content.length)) + this.chars.boxVertical);

    // Box bottom
    const bottomBorder = this.chars.boxCornerBL + this.chars.boxHorizontal.repeat(width - 2) + this.chars.boxCornerBR;
    lines.push(hex(this.palette.overlay, bottomBorder));

    // Activity lines (outside box)
    if (ctx.detailMode) {
      // detailMode: summary statistics
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatToolsSummary(ctx.transcript.tools, this.palette, this.icons);
        lines.push('  ' + toolsSummary);
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatAgentsSummary(ctx.transcript.agents, this.palette, this.icons);
        lines.push('  ' + agentsSummary);
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatTodosSummary(ctx.transcript.todos, this.palette, this.icons);
        lines.push('  ' + todosSummary);
      }

      if (ctx.config.display.showUsage && ctx.usageData) {
        const usageSummary = formatUsageSummaryLine(ctx.usageData, this.palette);
        lines.push('  ' + usageSummary);
      }

      // Advanced feature widgets
      const advancedParts: string[] = [];

      const gitActivityText = formatGitActivityDisplay(ctx, this.palette);
      if (gitActivityText) advancedParts.push(gitActivityText);

      const toolStatsText = formatToolStatsDisplay(ctx, this.palette);
      if (toolStatsText) advancedParts.push(toolStatsText);

      const bashErrorsText = formatBashErrorsDisplay(ctx, this.palette, this.icons);
      if (bashErrorsText) advancedParts.push(bashErrorsText);

      const violationsText = formatViolationsDisplay(ctx, this.palette, this.icons);
      if (violationsText) advancedParts.push(violationsText);

      const compactSuggestionText = formatCompactSuggestionDisplay(ctx, this.palette, this.icons);
      if (compactSuggestionText) advancedParts.push(compactSuggestionText);

      const workflowPhaseText = formatWorkflowPhaseDisplay(ctx, this.palette);
      if (workflowPhaseText) advancedParts.push(workflowPhaseText);

      const testCoverageText = formatTestCoverageDisplay(ctx, this.palette, this.icons);
      if (testCoverageText) advancedParts.push(testCoverageText);

      const passAtKText = formatPassAtKDisplay(ctx, this.palette);
      if (passAtKText) advancedParts.push(passAtKText);

      const worktreesText = formatGitWorktreesDisplay(ctx, this.palette);
      if (worktreesText) advancedParts.push(worktreesText);

      const perfText = formatPerformanceMetricsDisplay(ctx, this.palette);
      if (perfText) advancedParts.push(perfText);

      const mcpStatusText = formatMcpStatusDisplay(ctx, this.palette);
      if (mcpStatusText) advancedParts.push(mcpStatusText);

      const securityText = formatSecurityDashboardDisplay(ctx, this.palette, this.icons);
      if (securityText) advancedParts.push(securityText);

      const learningText = formatLearningTrackerDisplay(ctx, this.palette);
      if (learningText) advancedParts.push(learningText);

      const instanceSyncText = formatInstanceSyncDisplay(ctx, this.palette);
      if (instanceSyncText) advancedParts.push(instanceSyncText);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    } else {
      // Default mode: compact display
      // Tools
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsLine = renderToolsLine(ctx, this.icons, this.palette);
        if (toolsLine) lines.push('  ' + toolsLine);
      }

      // Agents
      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsLine = renderAgentsLine(ctx, this.icons, this.palette);
        if (agentsLine) lines.push('  ' + agentsLine);
      }

      // Todos
      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todoLine = renderTodoLine(ctx, this.icons, this.palette);
        if (todoLine) lines.push('  ' + todoLine);
      }

      // Skills
      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        const skillsLine = renderSkillsLine(ctx, this.icons, this.palette);
        if (skillsLine) lines.push('  ' + skillsLine);
      }

      // Additional activity indicators
      const activityParts: string[] = [];

      // Git Activity
      const gitActivityText = formatGitActivityDisplay(ctx, this.palette);
      if (gitActivityText) activityParts.push(gitActivityText);

      // Tool Stats
      const toolStatsText = formatToolStatsDisplay(ctx, this.palette);
      if (toolStatsText) activityParts.push(toolStatsText);

      // Bash Errors
      const bashErrorsText = formatBashErrorsDisplay(ctx, this.palette, this.icons);
      if (bashErrorsText) activityParts.push(bashErrorsText);

      // Violations
      const violationsText = formatViolationsDisplay(ctx, this.palette, this.icons);
      if (violationsText) activityParts.push(violationsText);

      // Compact Suggestion
      const compactSuggestionText = formatCompactSuggestionDisplay(ctx, this.palette, this.icons);
      if (compactSuggestionText) activityParts.push(compactSuggestionText);

      // Workflow Phase
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
        lines.push('  ' + activityParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
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
  const toolCounts = new Map<string, number>();
  let runningTool: string | null = null;

  for (const tool of ctx.transcript.tools) {
    const count = toolCounts.get(tool.name) || 0;
    toolCounts.set(tool.name, count + 1);

    if (tool.status === 'running') {
      runningTool = tool.name;
    }
  }

  const toolItems: string[] = [];
  for (const [name, count] of toolCounts) {
    const isRunning = runningTool === name;
    const icon = isRunning ? icons.running : icons.success;
    const iconColor = isRunning ? palette.yellow : palette.green;
    const countStr = formatCount(count);
    toolItems.push(hex(palette.text, name) + hex(iconColor, icon) + hex(palette.muted, countStr));
  }

  return hex(palette.categoryTools, icons.categoryTools) + ' ' + toolItems.join(' ');
}

function summarizeAgents(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const agentItems: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 2)) {
    const icon = agent.status === 'running' ? icons.running : icons.success;
    const iconColor = agent.status === 'running' ? palette.yellow : palette.green;
    const modelAbbr = agent.model ? `[${agent.model[0]}]` : '';
    agentItems.push(hex(palette.text, agent.type) + hex(iconColor, icon) + hex(palette.muted, modelAbbr));
  }

  return hex(palette.categoryAgents, icons.categoryAgents) + ' ' + agentItems.join(' ');
}

function summarizeTodos(ctx: RenderContext, palette: ColorPalette, icons: IconSet): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  const label = hex(palette.categoryTodos, icons.categoryTodos);

  if (inProgress) {
    const shortContent = inProgress.content.substring(0, 20);
    return label + ' ' + hex(palette.yellow, '▸ ') + hex(palette.text, shortContent) + hex(palette.muted, ` ${completed}/${total}`);
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

  return hex(palette.categoryTools, icons.categoryTools + ' Tools: ') + parts.join('   ');
}

function renderAgentsLine(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const agentParts: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 3)) {
    const icon = agent.status === 'running' ? icons.running : agent.status === 'error' ? icons.error : icons.success;
    const iconColor = agent.status === 'running' ? palette.yellow : agent.status === 'error' ? palette.red : palette.green;
    const modelAbbr = agent.model ? `[${agent.model}]` : '';
    const desc = agent.description ? ` ${agent.description.substring(0, 40)}` : '';
    agentParts.push(hex(palette.text, agent.type) + hex(iconColor, icon) + hex(palette.muted, ` ${modelAbbr}`) + hex(palette.muted, desc));
  }

  return hex(palette.categoryAgents, icons.categoryAgents + ' Agents: ') + agentParts.join('   ');
}

function renderTodoLine(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  const label = hex(palette.categoryTodos, icons.categoryTodos + ' Todos: ');

  if (inProgress) {
    const progressBar = '●'.repeat(completed) + '○'.repeat(total - completed);
    return label + hex(palette.yellow, '▸ ') + hex(palette.text, inProgress.content) + hex(palette.muted, ` (${completed}/${total}) ${progressBar}`);
  }

  return label + hex(palette.green, '✓ ') + hex(palette.text, 'All tasks completed') + hex(palette.muted, ` (${total}/${total})`);
}

function summarizeSkills(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const skillItems: string[] = [];

  for (const skill of ctx.transcript.skills.slice(0, 3)) {
    const icon = skill.status === 'running' ? icons.running : icons.success;
    const iconColor = skill.status === 'running' ? palette.yellow : palette.green;
    skillItems.push(hex(palette.text, skill.name) + hex(iconColor, icon));
  }

  return hex(palette.mauve, icons.skill) + ' ' + skillItems.join(' ');
}

function renderSkillsLine(ctx: RenderContext, icons: IconSet, palette: ColorPalette): string {
  const parts: string[] = [];

  for (const skill of ctx.transcript.skills.slice(0, 5)) {
    const icon = skill.status === 'running' ? icons.running : skill.status === 'error' ? icons.error : icons.success;
    const iconColor = skill.status === 'running' ? palette.yellow : skill.status === 'error' ? palette.red : palette.green;
    const args = skill.args ? ` ${skill.args}` : '';
    parts.push(hex(palette.text, skill.name) + hex(iconColor, icon) + hex(palette.muted, args));
  }

  return hex(palette.mauve, icons.skill + ' Skills: ') + parts.join('   ');
}

/**
 * Format tools summary with counts
 */
function formatToolsSummary(tools: any[], palette: ColorPalette, icons: IconSet): string {
  const counts = new Map<string, number>();
  for (const tool of tools) {
    counts.set(tool.name, (counts.get(tool.name) || 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const items = sorted.slice(0, 5).map(([name, count]) => hex(palette.text, `${name} ×${count}`));
  const total = tools.length;

  return hex(palette.categoryTools, icons.categoryTools + ' Tools: ') +
    items.join('  ') +
    hex(palette.muted, ` (${total})`);
}

/**
 * Format agents summary with counts
 */
function formatAgentsSummary(agents: any[], palette: ColorPalette, icons: IconSet): string {
  const counts = new Map<string, number>();
  for (const agent of agents) {
    counts.set(agent.type, (counts.get(agent.type) || 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const items = sorted.slice(0, 3).map(([type, count]) => hex(palette.text, `${type} ×${count}`));
  const total = agents.length;

  return hex(palette.categoryAgents, icons.categoryAgents + ' Agents: ') +
    items.join('  ') +
    hex(palette.muted, ` (${total})`);
}

/**
 * Format todos summary
 */
function formatTodosSummary(todos: any[], palette: ColorPalette, icons: IconSet): string {
  const total = todos.length;
  const completed = todos.filter((t: any) => t.status === 'completed').length;
  const inProgress = todos.find((t: any) => t.status === 'in_progress');

  const label = hex(palette.categoryTodos, icons.categoryTodos + ' Todos: ');

  if (inProgress) {
    return label +
      hex(palette.yellow, '▸ ') +
      hex(palette.text, inProgress.content.substring(0, 20) + '...') +
      hex(palette.muted, ` (${completed}/${total})`);
  }

  if (completed === total) {
    return label +
      hex(palette.green, '✓ ') +
      hex(palette.text, 'All completed') +
      hex(palette.muted, ` (${total}/${total})`);
  }

  return label + hex(palette.muted, `${completed}/${total}`);
}

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

/**
 * Format project and git with parentheses and clickable links
 */
function formatProjectGit(ctx: RenderContext, palette: ColorPalette, _icons: IconSet): string {
  const project = ctx.stdin.cwd ? ctx.stdin.cwd.split('/').pop() : null;
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
    let branchText = `${git}`;

    // Add tag if available
    if (ctx.gitStatus?.tag) {
      branchText += ` ${ctx.gitStatus.tag}`;
    }

    branchText += dirty;

    // Add file stats if enabled
    if (ctx.config.display.showGitFileStats && ctx.gitStatus?.fileStats) {
      const stats = ctx.gitStatus.fileStats;
      const parts: string[] = [];

      if (stats.modified > 0) parts.push(`!${stats.modified}`);
      if (stats.added > 0) parts.push(`+${stats.added}`);
      if (stats.deleted > 0) parts.push(`✘${stats.deleted}`);
      if (stats.untracked > 0) parts.push(`?${stats.untracked}`);

      if (parts.length > 0) {
        branchText += ` ${parts.join(' ')}`;
      }
    }

    if (ctx.gitStatus?.remoteUrl) {
      const branchUrl = githubBranchUrl(ctx.gitStatus.remoteUrl, git);
      const branchLink = hyperlink(branchUrl, branchText);
      result += hex(palette.teal, ` (${branchLink})`);
    } else {
      result += hex(palette.teal, ` (${branchText})`);
    }
  }

  // Subdirectory repos (monorepo support)
  if (ctx.config.display.showAllBranches && ctx.gitStatus?.subRepos && ctx.gitStatus.subRepos.length > 0) {
    const subItems = ctx.gitStatus.subRepos.slice(0, 3).map((sub) => {
      const subDirty = sub.isDirty ? '*' : '';
      return `${sub.path}(${sub.branch}${subDirty})`;
    });

    const remaining = ctx.gitStatus.subRepos.length - 3;
    const moreText = remaining > 0 ? ` +${remaining}` : '';

    result += hex(palette.muted, `  sub: ${subItems.join(' ')}${moreText}`);
  }

  return result;
}
