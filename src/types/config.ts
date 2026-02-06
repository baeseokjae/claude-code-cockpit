/**
 * Configuration types
 */

export type ThemeName = 'aurora' | 'neon' | 'mono' | 'zen' | 'retro';

export interface CockpitConfig {
  theme: ThemeName;

  display: {
    showGit: boolean;
    showTools: boolean;
    showAgents: boolean;
    showTodos: boolean;
    showSkills: boolean;
    showUsage: boolean;
    showConfigCounts: boolean;
    showCost: boolean;
    showAbsoluteTokens: boolean;
    showSessionName: boolean;
    showTokenSpeed: boolean;
    sevenDayThreshold: number;
    showGitFileStats: boolean;
    showAllBranches: boolean;
    showAllBranchesDepth: number;
    showLines: boolean;
    showCacheMetrics: boolean;
    showGitTag: boolean;
    showGitActivity: boolean;
    showToolStats: boolean;
    showBashErrors: boolean;
    showCompactSuggestion: boolean;
    showViolations: boolean;
    showMcpImpact: boolean;
    showWorkflowPhase: boolean;
    showTestCoverage: boolean;
    showPassAtK: boolean;
    showGitWorktrees: boolean;
    showPerformanceMetrics: boolean;
    showMcpStatus: boolean;
    showSecurityDashboard: boolean;
    showLearningTracker: boolean;
    showInstanceSync: boolean;
  };

  detailMode: boolean;
  pathLevels: number;

  usage: {
    enabled: boolean;
    cacheMinutes: number;
  };

  extraCmd: string | null;

  notifications: {
    enabled: boolean;
    compactWarningThreshold: number;
    compactSuggestionEnabled: boolean;
    compactSuggestionThreshold: number;
  };

  performance: {
    maxTools: number;
    maxAgents: number;
  };
}

export interface ConfigCounts {
  claudeMdCount: number;
  rulesCount: number;
  mcpCount: number;
  hooksCount: number;
}
