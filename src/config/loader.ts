/**
 * Configuration loader and merger
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { CockpitConfig, ThemeName } from '../types/index.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('config');

function getConfigPath(): string {
  return join(homedir(), '.claude', 'plugins', 'claude-code-cockpit', 'config.json');
}

export function loadConfig(): CockpitConfig {
  let config = { ...DEFAULT_CONFIG };

  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(fileContent) as Partial<CockpitConfig>;
      config = deepMerge(config, fileConfig);
      debug('loaded config from file:', configPath);
    } catch (error) {
      debug('failed to load config file:', error);
    }
  }

  config = applyEnvOverrides(config);

  debug('final config:', config);
  return config;
}

function applyEnvOverrides(config: CockpitConfig): CockpitConfig {
  if (process.env.COCKPIT_THEME) {
    const theme = process.env.COCKPIT_THEME as ThemeName;
    if (['aurora', 'neon', 'mono', 'zen', 'retro'].includes(theme)) {
      config.theme = theme;
      debug('env override: theme =', theme);
    }
  }

  if (process.env.COCKPIT_DETAIL) {
    config.detailMode = process.env.COCKPIT_DETAIL === '1' || process.env.COCKPIT_DETAIL === 'true';
    debug('env override: detailMode =', config.detailMode);
  }

  if (process.env.COCKPIT_PATH_LEVELS) {
    const levels = parseInt(process.env.COCKPIT_PATH_LEVELS, 10);
    if (!isNaN(levels) && levels >= 0) {
      config.pathLevels = levels;
      debug('env override: pathLevels =', levels);
    }
  }

  return config;
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object'
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as any;
    }
  }

  return result;
}
