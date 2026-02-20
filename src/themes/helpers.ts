/**
 * Theme helper functions - re-export hub
 */

export type {
  TextTransform,
  FormatContextTextOptions,
  ToolCounts,
  TodoSummary,
  ProjectGitResult,
  FormatProjectGitOptions,
  ProjectGitParts,
  RenderData,
  PrepareRenderDataOptions,
} from './helpers/data-extraction.js';

export {
  getPercentColor,
  formatContextHint,
  formatContextHintPlain,
  applyTextTransform,
  getSessionName,
  formatContextText,
  aggregateToolCounts,
  aggregateTodos,
  extractProjectGitData,
  formatProjectGitParts,
  formatProjectGit,
  prepareRenderData,
} from './helpers/data-extraction.js';

export type { DetailSummaryOptions } from './helpers/formatters.js';

export {
  formatDetailToolsSummary,
  formatDetailAgentsSummary,
  formatDetailTodosSummary,
  formatLinesDisplay,
  formatCacheDisplay,
  formatGitTagDisplay,
  formatGitActivityDisplay,
  formatToolStatsDisplay,
  formatBashErrorsDisplay,
  formatCompactSuggestionDisplay,
  formatViolationsDisplay,
  formatWorkflowPhaseDisplay,
  formatTestCoverageDisplay,
  formatPassAtKDisplay,
  formatGitWorktreesDisplay,
  formatMcpStatusDisplay,
  formatInstanceSyncDisplay,
} from './helpers/formatters.js';

export type { ActivityWidget, ActivityRenderOptions } from './helpers/widgets.js';

export {
  collectActivityWidgets,
  hasAbnormalState,
  getVisibleWidgets,
  renderActivityLines,
} from './helpers/widgets.js';

export type { CompactStyledOptions, CompactPlainOptions } from './helpers/summarizers.js';

export {
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
} from './helpers/summarizers.js';
