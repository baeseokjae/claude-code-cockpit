/**
 * Compact suggestion calculation
 * Suggests /compact when tool calls exceed threshold
 */

import type { ToolEntry } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('compact-suggestion');

export interface CompactSuggestion {
  totalToolCalls: number;
  threshold: number;
  shouldSuggest: boolean;
  message: string;
}

export function calculateCompactSuggestion(
  tools: ToolEntry[],
  threshold: number = 50
): CompactSuggestion {
  const totalToolCalls = tools.length;
  const shouldSuggest = totalToolCalls >= threshold;

  const message = shouldSuggest
    ? `${totalToolCalls} tool calls - consider /compact`
    : '';

  debug(`tool calls: ${totalToolCalls}, threshold: ${threshold}, suggest: ${shouldSuggest}`);

  return {
    totalToolCalls,
    threshold,
    shouldSuggest,
    message,
  };
}
