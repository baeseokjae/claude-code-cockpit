/**
 * Aurora theme color palette - "Twilight"
 * Deep twilight blue with muted jewel tones
 * Independently designed with inspiration from pastel dark themes
 */

import type { ColorPalette } from '../../types/index.js';

export const AURORA_PALETTE: ColorPalette = {
  // Base colors - Deep twilight blue
  base: '#181c24',       // background
  surface: '#242936',    // surface
  overlay: '#363d4d',    // overlay

  // Text - Cool gray with subtle blue
  text: '#d4dae6',       // primary text
  subtext: '#a8b1c4',    // secondary text
  muted: '#6b7488',      // muted text

  // Accents - Muted jewel tones
  blue: '#6aa3d9',       // info, model name
  green: '#7bc98f',      // success, complete
  yellow: '#e0c878',     // warning, in progress
  red: '#d97082',        // error
  mauve: '#a98dd4',      // special (skills, agents)
  teal: '#6bc4b8',       // project, Git
  peach: '#d9946a',      // numbers, emphasis

  // Progress bar gradient
  progressLow: '#7bc98f',    // 0-50%
  progressMid: '#e0c878',    // 50-75%
  progressHigh: '#d9946a',   // 75-90%
  progressCritical: '#d97082', // 90%+
};
