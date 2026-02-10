/**
 * Icon sets (Nerd Font + Fallback)
 */

import type { IconSet } from '../types/index.js';
import { hasNerdFont } from '../utils/font-detect.js';

export const NERD_ICONS: IconSet = {
  branch: '\uE0A0',    // nf-pl-branch
  dirty: '*',
  ahead: '↑',
  behind: '↓',

  running: '◐',
  success: '✓',
  error: '✗',
  pending: '○',

  read: '\uF06E',      // nf-fa-eye
  edit: '\uF044',      // nf-fa-pencil_square_o
  write: '\uF0C7',     // nf-fa-floppy_o (save)
  bash: '\uF120',      // nf-fa-terminal
  grep: '\uF002',      // nf-fa-search
  glob: '\uF07B',      // nf-fa-folder
  task: '\uF0AE',      // nf-fa-tasks
  skill: '\uF0E7',     // nf-fa-bolt

  clock: '\uF017',     // nf-fa-clock_o
  folder: '\uF07B',    // nf-fa-folder
  config: '\uF013',    // nf-fa-gear
  warning: '\uF071',   // nf-fa-warning
  cost: '$',

  lines: '\uF1C9',     // nf-fa-file_code_o
  cache: '\uF1B2',     // nf-fa-cube
  tag: '\uF02B',       // nf-fa-tag

  categoryTools: '◆',
  categoryAgents: '●',
  categoryTodos: '▸',
};

export const FALLBACK_ICONS: IconSet = {
  branch: '#',
  dirty: '*',
  ahead: '^',
  behind: 'v',

  running: '~',
  success: '+',
  error: 'x',
  pending: 'o',

  read: 'R',
  edit: 'E',
  write: 'W',
  bash: 'B',
  grep: 'G',
  glob: 'F',
  task: 'T',
  skill: 'S',

  clock: '@',
  folder: '>',
  config: '*',
  warning: '!',
  cost: '$',

  lines: 'Δ',
  cache: '⊕',
  tag: '@',

  categoryTools: '●',
  categoryAgents: '●',
  categoryTodos: '●',
};

/**
 * Get icon set based on current environment
 */
export function getIcons(): IconSet {
  return hasNerdFont() ? NERD_ICONS : FALLBACK_ICONS;
}
