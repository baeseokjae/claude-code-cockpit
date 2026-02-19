/**
 * Activity widget collection and filtering
 */

import type { RenderContext, ColorPalette, IconSet } from '../../types/index.js';
import {
  formatDetailToolsSummary,
  formatDetailAgentsSummary,
  formatDetailTodosSummary,
  formatBashErrorsDisplay,
  formatViolationsDisplay,
  formatCompactSuggestionDisplay,
  formatGitActivityDisplay,
  formatToolStatsDisplay,
  formatWorkflowPhaseDisplay,
  formatTestCoverageDisplay,
  formatPassAtKDisplay,
  formatGitWorktreesDisplay,
  formatMcpStatusDisplay,
  formatInstanceSyncDisplay,
} from './formatters.js';
import {
  summarizeToolsStyled,
  summarizeAgentsStyled,
  summarizeTodosStyled,
  summarizeSkillsStyled,
  renderToolsLineStyled,
  renderAgentsLineStyled,
  renderTodosLineStyled,
  renderSkillsLineStyled,
  summarizeToolsPlain,
  summarizeAgentsPlain,
  summarizeTodosPlain,
  summarizeSkillsPlain,
  renderToolsLinePlain,
  renderAgentsLinePlain,
  renderTodosLinePlain,
  renderSkillsLinePlain,
} from './summarizers.js';
import type { TextTransform } from './data-extraction.js';

// ============================================
// Types
// ============================================

export interface ActivityWidget {
  text: string;
  category: 'critical' | 'warning' | 'info' | 'analytics';
  priority: number; // 0-99 (낮을수록 우선순위 높음)
}

// ============================================
// Collect Activity Widgets (Common Function)
// ============================================

export function collectActivityWidgets(
  ctx: RenderContext,
  palette: ColorPalette,
  icons: IconSet
): ActivityWidget[] {
  const widgets: ActivityWidget[] = [];

  // P0: Critical errors (priority 0-19)
  const bashErrorsText = formatBashErrorsDisplay(ctx, palette, icons);
  if (bashErrorsText) {
    const priority = ctx.bashErrors && ctx.bashErrors.length > 0 ? 0 : 10;
    widgets.push({ text: bashErrorsText, category: 'critical', priority });
  }

  const violationsText = formatViolationsDisplay(ctx, palette, icons);
  if (violationsText) {
    // secrets는 priority 5, 나머지는 15
    const hasSecrets = (ctx.violations?.byType.get('hardcoded_secret') || 0) > 0;
    const priority = hasSecrets ? 5 : 15;
    widgets.push({ text: violationsText, category: 'critical', priority });
  }

  // P1: Warnings (priority 20-39)
  const compactText = formatCompactSuggestionDisplay(ctx, palette, icons);
  if (compactText) {
    widgets.push({ text: compactText, category: 'warning', priority: 25 });
  }

  // P2: Info (priority 40-59)
  if (ctx.config.display.showGitActivity) {
    const t = formatGitActivityDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 45 });
  }

  if (ctx.config.display.showToolStats) {
    const t = formatToolStatsDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 50 });
  }

  if (ctx.config.display.showWorkflowPhase) {
    const t = formatWorkflowPhaseDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 65 });
  }

  // P3: Analytics (priority 60-79)
  if (ctx.config.display.showTestCoverage) {
    const t = formatTestCoverageDisplay(ctx, palette, icons);
    if (t) widgets.push({ text: t, category: 'analytics', priority: 60 });
  }

  if (ctx.config.display.showPassAtK) {
    const t = formatPassAtKDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'analytics', priority: 70 });
  }

  // P4: Low priority (priority 80-99)
  if (ctx.config.display.showGitWorktrees) {
    const t = formatGitWorktreesDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 80 });
  }

  if (ctx.config.display.showMcpStatus) {
    const t = formatMcpStatusDisplay(ctx, palette);
    if (t) widgets.push({ text: t, category: 'info', priority: 85 });
  }

  if (ctx.config.display.showInstanceSync) {
    const t = formatInstanceSyncDisplay(ctx, palette);
    if (t) {
      const hasConflict = (ctx.instanceSync?.conflictCount || 0) > 0;
      const priority = hasConflict ? 35 : 95; // 충돌 시 P1으로 부스트
      widgets.push({ text: t, category: 'analytics', priority });
    }
  }

  // 정렬: priority 낮은 순 (0이 최우선)
  return widgets.sort((a, b) => a.priority - b.priority);
}

// ============================================
// Conditional Display Model
// ============================================

export function hasAbnormalState(ctx: RenderContext): boolean {
  return (ctx.bashErrors && ctx.bashErrors.length > 0) ||
    (ctx.violations && ctx.violations.total > 0) ||
    (ctx.transcript.tools.some(t => t.status === 'error'));
}

export function getVisibleWidgets(
  widgets: ActivityWidget[],
  detailMode: boolean,
  hasAbnormalState: boolean,
  maxWidgets: number = 8
): ActivityWidget[] {
  let filtered: ActivityWidget[];

  if (detailMode) {
    filtered = widgets;
  } else if (hasAbnormalState) {
    // Show critical, warning, and info (exclude analytics)
    filtered = widgets.filter(w => w.category !== 'analytics');
  } else {
    // Normal state: only critical and warning
    filtered = widgets.filter(w =>
      w.category === 'critical' || w.category === 'warning'
    );
  }

  // Priority 기반 정렬은 이미 되어 있으므로 상위 N개만 반환
  return filtered.slice(0, maxWidgets);
}

// ============================================
// Activity Lines Builder (common render block)
// ============================================

export interface ActivityRenderOptions {
  style: 'styled' | 'plain';
  palette: ColorPalette;
  icons: IconSet;
  transform?: TextTransform;
  /** Pre-formatted separator string (e.g. hex(palette.muted, '│') or ' | ') */
  separator: string;
  /** 'summarize': compact one-liner; 'expanded': one line per category */
  nonDetailStyle?: 'summarize' | 'expanded';
  /**
   * Whether widgets appear on separate lines.
   * Default: false for 'summarize' (join on one line), true for 'expanded' (each separate).
   */
  widgetsOnSeparateLines?: boolean;
}

/**
 * Build activity lines for both detailMode and non-detailMode.
 * Returns raw content lines without any prefix (caller adds '  ' or box chars).
 */
export function renderActivityLines(
  ctx: RenderContext,
  options: ActivityRenderOptions
): string[] {
  const {
    style,
    palette,
    icons,
    transform,
    separator,
    nonDetailStyle = 'expanded',
    widgetsOnSeparateLines,
  } = options;

  // joinWidgets: true → join all widgets on one separator-delimited line
  const joinWidgets = widgetsOnSeparateLines === undefined
    ? nonDetailStyle === 'summarize'
    : !widgetsOnSeparateLines;

  const lines: string[] = [];

  if (ctx.detailMode) {
    const detailOpts = { palette, icons, transform };

    if (ctx.config.display.showTools && ctx.transcript.tools.length > 0) {
      const s = formatDetailToolsSummary(ctx.transcript.tools, detailOpts);
      if (s) lines.push(s);
    }

    if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0) {
      const s = formatDetailAgentsSummary(ctx.transcript.agents, detailOpts);
      if (s) lines.push(s);
    }

    if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0) {
      const s = formatDetailTodosSummary(ctx.transcript.todos, detailOpts);
      if (s) lines.push(s);
    }

    const widgets = collectActivityWidgets(ctx, palette, icons);
    const abnormal = hasAbnormalState(ctx);
    const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);

    if (visible.length > 0) {
      if (joinWidgets) {
        lines.push(visible.map(w => w.text).join(`  ${separator}  `));
      } else {
        visible.forEach(w => lines.push(w.text));
      }
    }
  } else {
    if (nonDetailStyle === 'summarize') {
      const activityParts: string[] = [];

      if (style === 'styled') {
        const opts = { palette, icons, transform };
        if (ctx.config.display.showTools && ctx.transcript.tools.length > 0)
          activityParts.push(summarizeToolsStyled(ctx, opts));
        if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0)
          activityParts.push(summarizeAgentsStyled(ctx, opts));
        if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0)
          activityParts.push(summarizeTodosStyled(ctx, opts));
        if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0)
          activityParts.push(summarizeSkillsStyled(ctx, opts));
      } else {
        const opts = { transform };
        if (ctx.config.display.showTools && ctx.transcript.tools.length > 0)
          activityParts.push(summarizeToolsPlain(ctx, opts));
        if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0)
          activityParts.push(summarizeAgentsPlain(ctx, opts));
        if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0)
          activityParts.push(summarizeTodosPlain(ctx, opts));
        if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0)
          activityParts.push(summarizeSkillsPlain(ctx, opts));
      }

      const widgets = collectActivityWidgets(ctx, palette, icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);
      activityParts.push(...visible.map(w => w.text));

      if (activityParts.length > 0) {
        lines.push(activityParts.join(`  ${separator}  `));
      }
    } else {
      // expanded: one line per category
      if (style === 'styled') {
        const opts = { palette, icons, transform };
        if (ctx.config.display.showTools && ctx.transcript.tools.length > 0)
          lines.push(renderToolsLineStyled(ctx, opts));
        if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0)
          lines.push(renderAgentsLineStyled(ctx, opts));
        if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0)
          lines.push(renderTodosLineStyled(ctx, opts));
        if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0)
          lines.push(renderSkillsLineStyled(ctx, opts));
      } else {
        if (ctx.config.display.showTools && ctx.transcript.tools.length > 0)
          lines.push(renderToolsLinePlain(ctx));
        if (ctx.config.display.showAgents && ctx.transcript.agents.length > 0)
          lines.push(renderAgentsLinePlain(ctx));
        if (ctx.config.display.showTodos && ctx.transcript.todos.length > 0)
          lines.push(renderTodosLinePlain(ctx));
        if (ctx.config.display.showSkills && ctx.transcript.skills.length > 0)
          lines.push(renderSkillsLinePlain(ctx));
      }

      const widgets = collectActivityWidgets(ctx, palette, icons);
      const abnormal = hasAbnormalState(ctx);
      const visible = getVisibleWidgets(widgets, ctx.detailMode, abnormal, ctx.config.maxActivityWidgets);

      if (joinWidgets) {
        if (visible.length > 0) {
          lines.push(visible.map(w => w.text).join(`  ${separator}  `));
        }
      } else {
        visible.forEach(w => lines.push(w.text));
      }
    }
  }

  return lines;
}
