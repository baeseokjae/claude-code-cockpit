/**
 * Icon sets (Nerd Font + Fallback)
 */

import type { IconSet } from '../types/index.js';

export const NERD_ICONS: IconSet = {
  modelOpus: '◆',
  modelSonnet: '◇',
  modelHaiku: '○',

  branch: '',
  dirty: '*',
  ahead: '↑',
  behind: '↓',

  running: '◐',
  success: '✓',
  error: '✗',
  pending: '○',

  read: '',
  edit: '',
  write: '',
  bash: '',
  grep: '',
  glob: '',
  task: '',
  skill: '',

  clock: '',
  folder: '',
  config: '',
  warning: '',
  cost: '$',
};

export const FALLBACK_ICONS: IconSet = {
  modelOpus: '[O]',
  modelSonnet: '[S]',
  modelHaiku: '[H]',

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
};
