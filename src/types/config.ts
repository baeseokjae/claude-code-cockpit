import type { PresetName } from '../config/presets.js';

export type ThemeName = 'aurora' | 'neon' | 'mono' | 'zen' | 'retro';

export interface CockpitConfig {
  theme: ThemeName;
  preset?: PresetName;

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
    showMcpStatus: boolean;
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

  rightMargin: number;

  maxActivityWidgets?: number;

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
