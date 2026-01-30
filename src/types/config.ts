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
