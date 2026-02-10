/**
 * Usage formatting utilities
 */

import type { UsageData, ColorPalette } from '../types/index.js';
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
 * Full format: "5h:25% ↻1h30m" + optional 7d if above threshold
 */
export function formatUsageFull(
  usageData: UsageData,
  palette: ColorPalette,
  sevenDayThreshold: number = 80
): string {
  const percent = usageData.fiveHour;
  const color = getUsageColor(percent, palette);
  const resetStr = formatResetTime(usageData.fiveHourResetAt);

  let result = '';
  if (resetStr) {
    result = hex(color, `5h:${Math.round(percent)}%`) +
      hex(palette.muted, ` ↻ ${resetStr}`);
  } else {
    result = hex(color, `5h:${Math.round(percent)}%`);
  }

  // Add 7-day usage if above threshold
  if (usageData.sevenDay >= sevenDayThreshold) {
    const sevenColor = getUsageColor(usageData.sevenDay, palette);
    const sevenResetStr = formatResetTime(usageData.sevenDayResetAt);
    result += ' | ' + hex(sevenColor, `7d:${Math.round(usageData.sevenDay)}%`);
    if (sevenResetStr) {
      result += hex(palette.muted, ` ↻ ${sevenResetStr}`);
    }
  }

  return result;
}
