/**
 * Extract lines added/removed data from stdin
 */

import type { StdinData, LinesData } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('lines');

export function getLinesData(stdin: StdinData): LinesData | null {
  try {
    const added = stdin.cost?.total_lines_added ?? 0;
    const removed = stdin.cost?.total_lines_removed ?? 0;

    if (added === 0 && removed === 0) {
      debug('no lines data available');
      return null;
    }

    const net = added - removed;

    debug(`lines data: +${added} -${removed} (net: ${net})`);

    return {
      added,
      removed,
      net,
    };
  } catch (error) {
    debug('failed to extract lines data:', error);
    return null;
  }
}

export function formatLines(data: LinesData): string {
  const added = data.added > 0 ? `+${data.added}` : '+0';
  const removed = data.removed > 0 ? `-${data.removed}` : '-0';
  return `${added} ${removed}`;
}

export function formatLinesCompact(data: LinesData): string {
  const added = data.added > 0 ? `+${formatNumber(data.added)}` : '+0';
  const removed = data.removed > 0 ? `-${formatNumber(data.removed)}` : '-0';
  return `${added} ${removed}`;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
