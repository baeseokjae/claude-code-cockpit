/**
 * Default configuration values
 */

import type { CockpitConfig } from '../types/index.js';

export const DEFAULT_CONFIG: CockpitConfig = {
  theme: 'aurora',

  display: {
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
    sevenDayThreshold: 80,
    showGitFileStats: false,
    showAllBranches: false,
    showAllBranchesDepth: 2,
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

  detailMode: false,

  pathLevels: 1,

  usage: {
    enabled: true,
    cacheMinutes: 10,
  },

  extraCmd: null,

  notifications: {
    enabled: false,
    compactWarningThreshold: 75,
    compactSuggestionEnabled: true,
    compactSuggestionThreshold: 50,
  },

  performance: {
    maxTools: 20,
    maxAgents: 20,
  },
};
