import type { CockpitConfig } from '../types/index.js';
import { PRESETS, type PresetName } from './presets.js';

export const DEFAULT_CONFIG: CockpitConfig = {
  theme: 'aurora',
  preset: undefined,

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
    showMcpStatus: false,
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

  rightMargin: 2,

  maxActivityWidgets: 8,
};

/**
 * Get default display config, optionally applying a preset
 */
export function getDefaultDisplay(presetName?: PresetName): CockpitConfig['display'] {
  const base = DEFAULT_CONFIG.display;

  if (presetName && PRESETS[presetName]) {
    return { ...base, ...PRESETS[presetName] };
  }

  return base;
}
