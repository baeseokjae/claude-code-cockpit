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
    showUsage: false,
    showConfigCounts: true,
    showCost: true,
  },

  detailMode: false,

  pathLevels: 1,

  usage: {
    enabled: false,
    cacheMinutes: 10,
  },

  extraCmd: null,

  notifications: {
    enabled: false,
    compactWarningThreshold: 75,
  },

  performance: {
    maxTools: 20,
    maxAgents: 10,
  },
};
