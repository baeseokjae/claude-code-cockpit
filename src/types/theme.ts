/**
 * Theme system types
 */

import type { RenderContext } from './context.js';
import type { ThemeName } from './config.js';

export interface ColorPalette {
  base: string;
  surface: string;
  overlay: string;

  text: string;
  subtext: string;
  muted: string;

  blue: string;
  green: string;
  yellow: string;
  red: string;
  mauve: string;
  teal: string;
  peach: string;

  progressLow: string;
  progressMid: string;
  progressHigh: string;
  progressCritical: string;
}

export interface IconSet {
  modelOpus: string;
  modelSonnet: string;
  modelHaiku: string;

  branch: string;
  dirty: string;
  ahead: string;
  behind: string;

  running: string;
  success: string;
  error: string;
  pending: string;

  read: string;
  edit: string;
  write: string;
  bash: string;
  grep: string;
  glob: string;
  task: string;
  skill: string;

  clock: string;
  folder: string;
  config: string;
  warning: string;
  cost: string;
}

export interface ThemeChars {
  progressFilled: string;
  progressEmpty: string;
  boxCornerTL: string;
  boxCornerTR: string;
  boxCornerBL: string;
  boxCornerBR: string;
  boxHorizontal: string;
  boxVertical: string;
  separator: string;
}

export interface ThemeLayout {
  minWidth: number;
  compactWidth: number;
  fullWidth: number;
}

export interface ThemeFeatures {
  useGradientProgress: boolean;
  showBoxBorders: boolean;
  animatedSpinner: boolean;
  blinkOnCritical: boolean;
}

export interface ThemeConfig {
  name: ThemeName;
  palette: ColorPalette;
  chars: ThemeChars;
  icons: IconSet;
  layout: ThemeLayout;
  features: ThemeFeatures;
}

export interface Theme extends ThemeConfig {
  render(ctx: RenderContext): string[];

  /**
   * Tier 1 rendering: Always Visible (displayed even at minimum width)
   * - Model name, context%, Git branch, session duration
   * - Terminal width < 80
   */
  renderMinimal(ctx: RenderContext): string[];

  /**
   * Tier 2 rendering: Compact Summary
   * - Tier 1 info + tool counts, agent status, Todo progress
   * - Terminal width 80-120
   */
  renderCompact(ctx: RenderContext): string[];

  /**
   * Tier 3 rendering: Full Detail
   * - Tier 2 info + box layout, token details, cost, config counts
   * - When detailMode is true, displays box-style detailed view
   * - Terminal width >= 120
   */
  renderFull(ctx: RenderContext): string[];
}
