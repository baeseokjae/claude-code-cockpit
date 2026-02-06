/**
 * Calculate tool execution statistics
 */

import type { ToolEntry, ToolStats } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('tool-stats');

export function calculateToolStats(tools: ToolEntry[]): ToolStats | null {
  try {
    const completed = tools.filter((t) => t.status === 'completed').length;
    const errors = tools.filter((t) => t.status === 'error').length;
    const total = completed + errors;

    if (total === 0) {
      debug('no completed or errored tools');
      return null;
    }

    const successRate = Math.round((completed / total) * 100);

    debug(
      `tool stats: ${completed}/${total} success (${successRate}%), ${errors} errors`
    );

    return {
      total,
      success: completed,
      error: errors,
      successRate,
    };
  } catch (error) {
    debug('failed to calculate tool stats:', error);
    return null;
  }
}
