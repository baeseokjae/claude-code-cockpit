/**
 * Preset configurations for display settings
 * Only differences from DEFAULT_CONFIG.display are listed.
 * Applied via spread: { ...DEFAULT_CONFIG.display, ...PRESETS[preset] }
 */

import type { CockpitConfig } from '../types/index.js';

export type PresetName = 'minimal' | 'developer' | 'full';

export const PRESETS: Record<PresetName, Partial<CockpitConfig['display']>> = {
  minimal: {
    // Core only: Model, Context%, Cost, Duration
    // Disables features that are true by default
    showGit: false,
    showTools: false,
    showAgents: false,
    showTodos: false,
    showLines: false,
  },

  developer: {
    // DEFAULT_CONFIG + git activity & tool stats
    showGitActivity: true,
    showToolStats: true,
  },

  full: {
    // Enable all optional features (keeps showAbsoluteTokens: false intentionally)
    showSkills: true,
    showConfigCounts: true,
    showTokenSpeed: true,
    showGitFileStats: true,
    showAllBranches: true,
    showCacheMetrics: true,
    showGitTag: true,
    showGitActivity: true,
    showToolStats: true,
    showMcpImpact: true,
    showWorkflowPhase: true,
    showTestCoverage: true,
    showPassAtK: true,
    showGitWorktrees: true,
    showMcpStatus: true,
    showInstanceSync: true,
  },
};
