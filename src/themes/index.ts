/**
 * Theme registry
 */

import type { Theme, ThemeName } from '../types/index.js';
import { auroraTheme } from './aurora.js';
import { neonTheme } from './neon.js';
import { monoTheme } from './mono.js';
import { zenTheme } from './zen.js';
import { retroTheme } from './retro.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('themes');

const THEMES = new Map<ThemeName, Theme>([
  ['aurora', auroraTheme],
  ['neon', neonTheme],
  ['mono', monoTheme],
  ['zen', zenTheme],
  ['retro', retroTheme],
]);

export function loadTheme(name: ThemeName): Theme {
  const theme = THEMES.get(name);

  if (!theme) {
    debug(`theme '${name}' not found, falling back to 'aurora'`);
    return THEMES.get('aurora')!;
  }

  debug(`loaded theme: ${name}`);
  return theme;
}

export function getThemeNames(): ThemeName[] {
  return Array.from(THEMES.keys());
}
