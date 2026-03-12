import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import type { CockpitConfig, ThemeName } from '../types/index.js';
import { DEFAULT_CONFIG, getDefaultDisplay } from './defaults.js';
import { PRESETS, type PresetName } from './presets.js';
import { createDebug } from '../utils/debug.js';
import { getClaudeConfigDir } from '../utils/paths.js';

const debug = createDebug('config');

function getConfigPath(): string {
  // Start with base path (respects CLAUDE_CONFIG_DIR)
  const claudeDir = getClaudeConfigDir();
  
  // Resolve .claude directory if it's a symlink
  let resolvedClaudeDir = claudeDir;
  try {
    if (existsSync(claudeDir)) {
      resolvedClaudeDir = realpathSync(claudeDir);
      debug('resolved .claude directory:', resolvedClaudeDir);
    }
  } catch (error) {
    debug('failed to resolve .claude symlink:', error);
  }
  
  const configPath = join(resolvedClaudeDir, 'plugins', 'claude-code-cockpit', 'config.json');
  
  // Also resolve the config.json file itself if it's a symlink
  try {
    if (existsSync(configPath)) {
      const resolvedConfigPath = realpathSync(configPath);
      debug('resolved config.json path:', resolvedConfigPath);
      return resolvedConfigPath;
    }
  } catch (error) {
    debug('failed to resolve config.json symlink:', error);
  }
  
  return configPath;
}

export function loadConfig(): CockpitConfig {
  let config = { ...DEFAULT_CONFIG };

  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(fileContent) as Partial<CockpitConfig>;

      // Preset 적용 순서:
      // 1. DEFAULT_CONFIG
      // 2. Preset (있으면)
      // 3. User config overrides

      if (fileConfig.preset && PRESETS[fileConfig.preset]) {
        debug('applying preset:', fileConfig.preset);
        config.display = getDefaultDisplay(fileConfig.preset);
      }

      config = deepMerge(config, fileConfig);

      // Migration: cacheMinutes → cacheTtlSeconds
      // If user set cacheMinutes but did NOT explicitly set cacheTtlSeconds, convert it
      if (fileConfig.usage?.cacheMinutes !== undefined && fileConfig.usage?.cacheTtlSeconds === undefined) {
        config.usage.cacheTtlSeconds = fileConfig.usage.cacheMinutes * 60;
        debug('migrated cacheMinutes to cacheTtlSeconds:', config.usage.cacheTtlSeconds);
      }

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

  // Preset override
  if (process.env.COCKPIT_PRESET) {
    const preset = process.env.COCKPIT_PRESET as PresetName;
    if (['minimal', 'developer', 'full'].includes(preset)) {
      config.preset = preset;
      config.display = getDefaultDisplay(preset);
      debug('env override: preset =', preset);
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
