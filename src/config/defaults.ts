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
    showSkills: false,
    showUsage: true,
    showConfigCounts: false,
    showCost: true,
    showAbsoluteTokens: false,
    showSessionName: true,
    showTokenSpeed: false,
    sevenDayThreshold: 80,
    showGitFileStats: false,
    showAllBranches: false,
    showAllBranchesDepth: 2,
    showLines: true,
    showCacheMetrics: false,
    showGitTag: false,
    showGitActivity: false,
    showToolStats: false,
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
