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

import type { Theme, RenderContext, ColorPalette } from '../types/index.js';
import { AURORA_PALETTE } from './palettes/aurora.js';
import { getIcons } from './icons.js';
import { hex } from '../render/colors.js';
import { createProgressBar, formatPercent, visualLength } from '../render/utils.js';
import { formatUsageFull } from '../render/usage.js';
import { formatResetTime } from '../data/usage-api.js';
import { formatTokenSpeed } from '../data/speed-tracker.js';
import { getModelName, getContextPercent, getAbsoluteTokens } from '../input/stdin.js';
import {
  formatLinesDisplay,
  formatCacheDisplay,
  collectActivityWidgets,
  getVisibleWidgets,
  hasAbnormalState,
  getPercentColor,
  formatProjectGit,
  formatDetailToolsSummary,
  formatDetailAgentsSummary,
  formatDetailTodosSummary,
  summarizeTodosStyled,
  summarizeSkillsStyled,
  renderToolsLineStyled,
  renderAgentsLineStyled,
  renderTodosLineStyled,
  renderSkillsLineStyled,
  formatContextHint,
  formatBashErrorsDisplay,
  formatViolationsDisplay,
  formatCompactSuggestionDisplay,
  formatMcpStatusDisplay,
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
    const contextHint = formatContextHint(percent, this.palette) || '';

    // Project and git with parentheses and links
    const projectGit = formatProjectGit(ctx, this.palette, this.icons, { showFileStats: true });

    const durationText = hex(this.palette.muted, ` ${duration}`);

    // Lines
    const linesText = formatLinesDisplay(ctx, this.palette, this.icons, 'compact');
    const linesDisplay = linesText ? ` ${linesText}` : '';

    return [`${modelText}${sessionText} ${percentText}${contextHint}${projectGit}${linesDisplay}${durationText}`];
  },

  renderCompact(ctx: RenderContext): string[] {
    const lines: string[] = [];
    const p = this.palette;
    const gap = '  '; // Double-space separator between sections (SVG dx=8~16)
    const pipeSep = hex(p.muted, ' │ ');
    const bullet = (color: string) => hex(color, '●') + ' ';

    // === Line 1: Model [session] | Progress Context | Project Git | Usage Duration ===
    const model = getModelName(ctx.stdin);
    const percent = getContextPercent(ctx.stdin);
    const percentStr = percent !== null ? formatPercent(percent) : '??%';

    const modelText = hex(p.blue, model);

    const sessionName = ctx.config.display.showSessionName
      ? (ctx.stdin.plan_name || ctx.stdin.session_id?.substring(0, 8))
      : null;
    const sessionText = sessionName ? hex(p.muted, ` [${sessionName}]`) : '';

    const progressBar = this.features.useGradientProgress
      ? createProgressBar(percent || 0, 10, this.chars.progressFilled, this.chars.progressEmpty)
      : '';
    const progressColor = getPercentColor(percent, p);
    const progressText = hex(progressColor, progressBar);

    const absoluteTokens = getAbsoluteTokens(ctx.stdin);
    let contextText = '';
    if (ctx.config.display.showAbsoluteTokens && absoluteTokens) {
      contextText = hex(progressColor, `${Math.round(absoluteTokens.used / 1000)}k/${Math.round(absoluteTokens.total / 1000)}k`);
    } else {
      contextText = hex(progressColor, percentStr);
    }
    const compactContextHint = formatContextHint(percent, p) || '';

    const projectGit = formatProjectGit(ctx, p, this.icons, { showFileStats: true });

    const duration = ctx.sessionDuration;
    const durationText = hex(p.muted, duration);

    // Usage: show both 5h and 7d (SVG shows both)
    let usageText = '';
    if (ctx.config.display.showUsage && ctx.usageData) {
      const fiveHour = ctx.usageData.fiveHour;
      const sevenDay = ctx.usageData.sevenDay;
      const usageParts: string[] = [];
      if (fiveHour > 0) {
        const fiveColor = fiveHour >= 90 ? p.red : fiveHour >= 75 ? p.peach : fiveHour >= 50 ? p.yellow : p.green;
        let fiveHourText = hex(fiveColor, `5h:${Math.round(fiveHour)}%`);
        if (fiveHour >= 50) {
          const fiveReset = formatResetTime(ctx.usageData.fiveHourResetAt, 'compact');
          if (fiveReset) {
            fiveHourText += hex(p.muted, ` ↻${fiveReset}`);
          }
        }
        usageParts.push(fiveHourText);
      }
      if (sevenDay > 0) {
        usageParts.push(hex(p.muted, `7d:${Math.round(sevenDay)}%`));
      }
      if (usageParts.length > 0) {
        usageText = usageParts.join(gap);
      }
    }

    // SVG order: Model | Progress | Project Git | Usage  Duration
    const group4Parts = [usageText, durationText].filter(Boolean);
    lines.push(
      `${modelText}${sessionText}${pipeSep}${progressText} ${contextText}${compactContextHint}${pipeSep}${projectGit}${pipeSep}${group4Parts.join(gap)}`
    );

    // Helper: abbreviate large numbers (1234 → "1.2k")
    const fmtNum = (n: number): string => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

    // === Line 2: ● Git: +N commits  +N PRs  +added -removed  Cache: XX% hit  $X.XX saved ===
    const line2Parts: string[] = [];

    {
      const gitParts: string[] = [hex(p.text, 'Git:')];
      let hasGitContent = false;

      if (ctx.config.display.showGitActivity && ctx.gitActivity) {
        const { commits, pullRequests } = ctx.gitActivity;
        if (commits > 0) { gitParts.push(hex(p.green, `+${commits} commit${commits > 1 ? 's' : ''}`)); hasGitContent = true; }
        if (pullRequests > 0) { gitParts.push(hex(p.mauve, `+${pullRequests} PR${pullRequests > 1 ? 's' : ''}`)); hasGitContent = true; }
      }

      if (ctx.config.display.showLines && ctx.linesData) {
        const { added, removed } = ctx.linesData;
        gitParts.push(hex(p.green, `+${fmtNum(added)}`) + ' ' + hex(p.red, `-${fmtNum(removed)}`));
        hasGitContent = true;
      }

      if (hasGitContent) {
        line2Parts.push(gitParts.join(' '));
      }
    }

    if (ctx.config.display.showCacheMetrics && ctx.cacheMetrics) {
      const hitRate = Math.round(ctx.cacheMetrics.cacheHitRate);
      const savings = ctx.cacheMetrics.estimatedSavings;
      const savingsStr = savings < 0.01 ? '<$0.01' : `$${savings.toFixed(2)}`;
      line2Parts.push(
        hex(p.blue, 'Cache:') + ' ' + hex(p.green, `${hitRate}%`) + ' ' + hex(p.muted, 'hit') +
        gap + hex(p.peach, savingsStr) + ' ' + hex(p.muted, 'saved')
      );
    }

    if (line2Parts.length > 0) {
      lines.push(bullet(p.teal) + line2Parts.join(gap));
    }

    // === Line 3: ● Tools: Read+12  Edit+8  Bash+5  +87% -13% (28) ===
    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const toolCounts = new Map<string, number>();
      let runningTool: string | null = null;
      for (const tool of ctx.transcript.tools) {
        toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
        if (tool.status === 'running') runningTool = tool.name;
      }

      const toolItems: string[] = [];
      for (const [name, count] of toolCounts) {
        const isRunning = runningTool === name;
        const icon = isRunning ? '~' : '+';
        const iconColor = isRunning ? p.yellow : p.green;
        const countStr = count > 1 ? hex(p.muted, `${count}`) : '';
        toolItems.push(hex(p.text, name) + hex(iconColor, icon) + countStr);
      }

      let line3 = hex(p.blue, 'Tools:') + ' ' + toolItems.join(gap);

      // Tool stats: +87% -13% (28)
      if (ctx.config.display.showToolStats && ctx.toolStats && ctx.toolStats.total > 0) {
        const { total, successRate } = ctx.toolStats;
        const errorRate = 100 - successRate;
        line3 += gap + hex(p.green, `+${successRate}%`) + ' ' + hex(p.red, `-${errorRate}%`) + ' ' + hex(p.muted, `(${total})`);
      }

      lines.push(bullet(p.blue) + line3);
    }

    // === Line 4: ● Agents: planner+[s]  code-reviewer+[o]  build-fix~[h] ===
    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const agentItems: string[] = [];
      for (const agent of ctx.transcript.agents.slice(0, 3)) {
        const isRunning = agent.status === 'running';
        const icon = isRunning ? '~' : '+';
        const iconColor = isRunning ? p.yellow : p.green;
        const modelChar = agent.model ? `[${agent.model[0]}]` : '';
        agentItems.push(hex(p.text, agent.type) + hex(iconColor, icon) + hex(p.muted, modelChar));
      }
      lines.push(bullet(p.mauve) + hex(p.mauve, 'Agents:') + ' ' + agentItems.join(gap));
    }

    // === Line 5: ● Phase: [IMPLEMENT] 85%  Tests: + 87% (309/356)  Pass@1: 78% ===
    const line5Parts: string[] = [];

    if (ctx.workflowState && ctx.workflowState.currentPhase !== 'UNKNOWN') {
      const { currentPhase, confidence } = ctx.workflowState;
      const phaseColors: Record<string, string> = {
        'PLAN': p.blue,
        'IMPLEMENT': p.mauve,
        'REVIEW': p.green,
      };
      const color = phaseColors[currentPhase] || p.muted;
      line5Parts.push(hex(p.text, 'Phase:') + ' ' + hex(color, `[${currentPhase}]`) + ' ' + hex(p.muted, `${confidence}%`));
    }

    if (ctx.testCoverage?.coverage?.hasData) {
      const { overall, passedTests, totalTests } = ctx.testCoverage.coverage;
      const avg = Math.round((overall.statements + overall.branches + overall.functions + overall.lines) / 4);
      const color = avg >= 80 ? p.green : avg >= 60 ? p.yellow : p.red;
      let testStr = hex(p.green, 'Tests:') + ' ' + hex(color, `+ ${avg}%`);
      if (passedTests != null && totalTests != null) {
        testStr += ' ' + hex(p.muted, `(${passedTests}/${totalTests})`);
      }
      line5Parts.push(testStr);
    }

    if (ctx.passAtK?.hasData && ctx.passAtK?.metrics) {
      const { passAt1 } = ctx.passAtK.metrics;
      const color = passAt1 >= 80 ? p.green : passAt1 >= 60 ? p.yellow : p.red;
      line5Parts.push(hex(p.blue, 'Pass@1:') + ' ' + hex(color, `${passAt1}%`));
    }

    if (line5Parts.length > 0) {
      lines.push(bullet(p.teal) + line5Parts.join(gap));
    }

    // === Line 6: ● Config: 2 .md  3 rules  2 MCP  4 hooks  Cost: $0.47  125 tok/s ===
    const line6Parts: string[] = [];

    if (ctx.config.display.showConfigCounts) {
      const cc = ctx.configCounts;
      const configItems: string[] = [];
      if (cc.claudeMdCount > 0) configItems.push(hex(p.teal, `${cc.claudeMdCount}`) + hex(p.muted, ' .md'));
      if (cc.rulesCount > 0) configItems.push(hex(p.blue, `${cc.rulesCount}`) + hex(p.muted, ' rules'));
      if (cc.mcpCount > 0) configItems.push(hex(p.mauve, `${cc.mcpCount}`) + hex(p.muted, ' MCP'));
      if (cc.hooksCount > 0) configItems.push(hex(p.green, `${cc.hooksCount}`) + hex(p.muted, ' hooks'));
      if (configItems.length > 0) {
        line6Parts.push(hex(p.muted, 'Config:') + ' ' + configItems.join(gap));
      }
    }

    const cost = ctx.config.display.showCost ? ctx.stdin.cost?.total_cost_usd : undefined;
    if (cost) {
      line6Parts.push(hex(p.peach, `Cost: $${cost.toFixed(2)}`));
    }

    if (ctx.config.display.showTokenSpeed && ctx.tokenSpeed) {
      const speedStr = formatTokenSpeed(ctx.tokenSpeed, 'output');
      if (speedStr && speedStr !== '0 tok/s') {
        line6Parts.push(hex(p.muted, speedStr));
      }
    }

    if (line6Parts.length > 0) {
      lines.push(bullet(p.muted) + line6Parts.join(gap));
    }

    // === Line 7: Alerts (errors, violations, compact suggestion, MCP) ===
    const line7Parts: string[] = [];

    const bashErrorsText = formatBashErrorsDisplay(ctx, p, this.icons);
    if (bashErrorsText) line7Parts.push(bashErrorsText);

    const violationsText = formatViolationsDisplay(ctx, p, this.icons);
    if (violationsText) line7Parts.push(violationsText);

    const compactText = formatCompactSuggestionDisplay(ctx, p, this.icons);
    if (compactText) line7Parts.push(compactText);

    const mcpStatusText = formatMcpStatusDisplay(ctx, p);
    if (mcpStatusText) line7Parts.push(mcpStatusText);

    if (line7Parts.length > 0) {
      lines.push(line7Parts.join(gap));
    }

    // === Extra: Todos + Skills ===
    const styledOpts = { palette: p, icons: this.icons };

    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      lines.push(summarizeTodosStyled(ctx, styledOpts));
    }

    if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
      lines.push(summarizeSkillsStyled(ctx, styledOpts));
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
    const projectGit = formatProjectGit(ctx, this.palette, this.icons, { showFileStats: true });

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
    lines.push(this.chars.boxVertical + line1Content + ' '.repeat(Math.max(0, width - 2 - visualLength(line1Content))) + this.chars.boxVertical);

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
    lines.push(this.chars.boxVertical + line2Content + ' '.repeat(Math.max(0, width - 2 - visualLength(line2Content))) + this.chars.boxVertical);

    // Box bottom
    const bottomBorder = this.chars.boxCornerBL + this.chars.boxHorizontal.repeat(width - 2) + this.chars.boxCornerBR;
    lines.push(hex(this.palette.overlay, bottomBorder));

    // Activity lines (outside box)
    const styledOptsFull = { palette: this.palette, icons: this.icons };

    if (ctx.detailMode) {
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        const toolsSummary = formatDetailToolsSummary(ctx.transcript.tools, styledOptsFull);
        if (toolsSummary) lines.push('  ' + toolsSummary);
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        const agentsSummary = formatDetailAgentsSummary(ctx.transcript.agents, styledOptsFull);
        if (agentsSummary) lines.push('  ' + agentsSummary);
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        const todosSummary = formatDetailTodosSummary(ctx.transcript.todos, styledOptsFull);
        if (todosSummary) lines.push('  ' + todosSummary);
      }

      if (ctx.config.display.showUsage && ctx.usageData) {
        const usageSummary = formatUsageSummaryLine(ctx.usageData, this.palette);
        lines.push('  ' + usageSummary);
      }

      // Advanced feature widgets
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      const advancedParts = visible.map(w => w.text);

      if (advancedParts.length > 0) {
        lines.push('  ' + advancedParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    } else {
      // Default mode: compact display
      if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
        lines.push('  ' + renderToolsLineStyled(ctx, styledOptsFull));
      }

      if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
        lines.push('  ' + renderAgentsLineStyled(ctx, styledOptsFull));
      }

      if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
        lines.push('  ' + renderTodosLineStyled(ctx, styledOptsFull));
      }

      if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0) {
        lines.push('  ' + renderSkillsLineStyled(ctx, styledOptsFull));
      }

      // Additional activity indicators
      const widgets = collectActivityWidgets(ctx, this.palette, this.icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      const activityParts = visible.map(w => w.text);

      if (activityParts.length > 0) {
        lines.push('  ' + activityParts.join('  ' + hex(this.palette.muted, this.chars.separator) + '  '));
      }
    }

    return lines;
  },
};


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
