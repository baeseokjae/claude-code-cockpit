/**
 * Extract bash command errors with exit codes
 */

import type { ToolEntry, BashError } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('bash-errors');

const MAX_BASH_ERRORS = 5;
const MAX_OUTPUT_LENGTH = 100;

export function extractBashErrors(tools: ToolEntry[]): BashError[] | null {
  try {
    const errors: BashError[] = [];
    const bashTools = tools.filter(
      (t) => t.name === 'Bash' && t.status === 'error'
    );

    debug(`analyzing ${bashTools.length} failed bash tools`);

    for (const tool of bashTools) {
      // Extract exit code and output from details
      const details = tool.details as Record<string, unknown> | undefined;
      const exitCode = details?.exit as number | undefined;
      const output = details?.output as string | undefined;

      // Only include if we have an exit code (and it's not 0)
      if (exitCode && exitCode !== 0) {
        errors.push({
          command: tool.target || 'unknown',
          exitCode,
          output: output?.substring(0, MAX_OUTPUT_LENGTH) || '',
          timestamp: tool.endTime || tool.startTime,
        });

        debug(`found error: exit ${exitCode}, cmd: ${tool.target}`);
      }
    }

    if (errors.length === 0) {
      debug('no bash errors with exit codes');
      return null;
    }

    // Limit to most recent errors
    const limited = errors.slice(0, MAX_BASH_ERRORS);
    debug(`returning ${limited.length} bash errors (max ${MAX_BASH_ERRORS})`);

    return limited;
  } catch (error) {
    debug('failed to extract bash errors:', error);
    return null;
  }
}
