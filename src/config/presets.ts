/**
 * Preset configurations for display settings
 */

import type { CockpitConfig } from '../types/index.js';

export type PresetName = 'minimal' | 'developer' | 'full';

export const PRESETS: Record<PresetName, Partial<CockpitConfig['display']>> = {
  minimal: {
    // Core only: Model, Context%, Cost, Duration
    showGit: false,
    showTools: false,
    showAgents: false,
    showTodos: false,
    showSkills: false,
    showUsage: true,
    showConfigCounts: false,
    showCost: true,
    showAbsoluteTokens: false,
    showSessionName: true,
    showTokenSpeed: false,
    showGitFileStats: false,
    showAllBranches: false,
    showLines: false,
    showCacheMetrics: false,
    showGitTag: false,
    showGitActivity: false,
    showToolStats: false,
    showBashErrors: true,        // 항상 표시
    showCompactSuggestion: true,  // 항상 표시
    showViolations: true,         // 항상 표시
    showMcpImpact: false,
    showWorkflowPhase: false,
    showTestCoverage: false,
    showPassAtK: false,
    showGitWorktrees: false,
    showPerformanceMetrics: false,
    showMcpStatus: false,
    showSecurityDashboard: false,
    showLearningTracker: false,
    showInstanceSync: false,
  },

  developer: {
    // DEFAULT_CONFIG + 2개 추가 (gitActivity, toolStats)
    showGit: true,
    showTools: true,
    showAgents: true,
    showTodos: true,
    showSkills: false,
    showUsage: true,
    showConfigCounts: false,
    showCost: true,
    showAbsoluteTokens: false,
    showSessionName: true,
    showTokenSpeed: false,
    showGitFileStats: false,
    showAllBranches: false,
    showLines: true,
    showCacheMetrics: false,
    showGitTag: false,
    showGitActivity: true,   // 추가
    showToolStats: true,      // 추가
    showBashErrors: true,
    showCompactSuggestion: true,
    showViolations: true,
    showMcpImpact: false,
    showWorkflowPhase: false,
    showTestCoverage: false,
    showPassAtK: false,
    showGitWorktrees: false,
    showPerformanceMetrics: false,
    showMcpStatus: false,
    showSecurityDashboard: false,
    showLearningTracker: false,
    showInstanceSync: false,
  },

  full: {
    // 모든 옵션 true
    showGit: true,
    showTools: true,
    showAgents: true,
    showTodos: true,
    showSkills: true,
    showUsage: true,
    showConfigCounts: true,
    showCost: true,
    showAbsoluteTokens: false,
    showSessionName: true,
    showTokenSpeed: true,
    showGitFileStats: true,
    showAllBranches: true,
    showLines: true,
    showCacheMetrics: true,
    showGitTag: true,
    showGitActivity: true,
    showToolStats: true,
    showBashErrors: true,
    showCompactSuggestion: true,
    showViolations: true,
    showMcpImpact: true,
    showWorkflowPhase: true,
    showTestCoverage: true,
    showPassAtK: true,
    showGitWorktrees: true,
    showPerformanceMetrics: true,
    showMcpStatus: true,
    showSecurityDashboard: true,
    showLearningTracker: true,
    showInstanceSync: true,
  },
};
