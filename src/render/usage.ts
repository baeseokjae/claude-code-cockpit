/**
 * Usage formatting utilities
 */

import type { UsageData, ColorPalette, ThemeChars } from '../types/index.js';
import { hex } from './colors.js';
import { formatResetTime } from '../data/usage-api.js';

/**
 * Get color based on usage percentage
 */
export function getUsageColor(percent: number, palette: ColorPalette): string {
  if (percent >= 90) return palette.red;
  if (percent >= 75) return palette.peach;
  if (percent >= 50) return palette.yellow;
  return palette.green;
}

/**
 * Compact format: "5h:25%"
 */
export function formatUsageCompact(
  usageData: UsageData,
  palette: ColorPalette
): string {
  const percent = usageData.fiveHour;
  const color = getUsageColor(percent, palette);
  return hex(color, `5h:${Math.round(percent)}%`);
}

/**
 * Full format: "5h:25% ↻1h30m"
 */
export function formatUsageFull(
  usageData: UsageData,
  palette: ColorPalette
): string {
  const percent = usageData.fiveHour;
  const color = getUsageColor(percent, palette);
  const resetStr = formatResetTime(usageData.fiveHourResetAt);

  if (resetStr) {
    return hex(color, `5h:${Math.round(percent)}%`) +
           hex(palette.muted, ` ↻${resetStr}`);
  }
  return hex(color, `5h:${Math.round(percent)}%`);
}

/**
 * Create usage progress bar
 */
export function createUsageProgressBar(
  percent: number,
  length: number,
  filled: string,
  empty: string
): string {
  const filledCount = Math.round((percent / 100) * length);
  return filled.repeat(filledCount) + empty.repeat(length - filledCount);
}

/**
 * Generate detailed usage lines for detailMode
 */
export function formatUsageDetailLines(
  usageData: UsageData,
  palette: ColorPalette,
  chars: ThemeChars
): string[] {
  const lines: string[] = [];

  // 5-hour usage
  const fiveColor = getUsageColor(usageData.fiveHour, palette);
  const fiveBar = createUsageProgressBar(
    usageData.fiveHour, 10, chars.progressFilled, chars.progressEmpty
  );
  const fiveReset = formatResetTime(usageData.fiveHourResetAt);
  lines.push(
    hex(palette.subtext, '5h: ') +
    hex(fiveColor, fiveBar) +
    hex(fiveColor, ` ${Math.round(usageData.fiveHour)}%`) +
    (fiveReset ? hex(palette.muted, `  ↻ ${fiveReset}`) : '')
  );

  // 7-day usage
  const sevenColor = getUsageColor(usageData.sevenDay, palette);
  const sevenBar = createUsageProgressBar(
    usageData.sevenDay, 10, chars.progressFilled, chars.progressEmpty
  );
  const sevenReset = formatResetTime(usageData.sevenDayResetAt);
  lines.push(
    hex(palette.subtext, '7d: ') +
    hex(sevenColor, sevenBar) +
    hex(sevenColor, ` ${Math.round(usageData.sevenDay)}%`) +
    (sevenReset ? hex(palette.muted, `  ↻ ${sevenReset}`) : '')
  );

  return lines;
}
