/**
 * Learning tracker
 * Extracts patterns and learnings from session activity
 */

import type { ToolEntry } from '../types/index.js';
import type { BashError } from '../types/transcript.js';
import type { LearningTracker, LearningEntry, LearningPattern } from '../types/learning.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('learning-tracker');

/**
 * Extract learnings from bash errors
 */
function extractErrorLearnings(bashErrors: BashError[]): LearningEntry[] {
  const learnings: LearningEntry[] = [];

  for (let i = 0; i < Math.min(bashErrors.length, 5); i++) {
    const error = bashErrors[i];
    learnings.push({
      id: `error-${i}`,
      timestamp: error.timestamp,
      category: 'error',
      title: `Exit code ${error.exitCode}`,
      description: error.output.substring(0, 200),
      context: error.command,
      tags: ['bash', 'error', `exit-${error.exitCode}`],
    });
  }

  return learnings;
}

/**
 * Extract learnings from tool patterns
 */
function extractToolPatterns(tools: ToolEntry[]): LearningPattern[] {
  const patterns: LearningPattern[] = [];

  // Pattern: Multiple retries of same tool
  const toolRetries = new Map<string, number>();
  let lastTool: string | null = null;
  let retryCount = 0;

  for (const tool of tools) {
    if (tool.name === lastTool && tool.status === 'error') {
      retryCount++;
    } else {
      if (retryCount >= 2) {
        toolRetries.set(lastTool!, (toolRetries.get(lastTool!) || 0) + 1);
      }
      lastTool = tool.name;
      retryCount = 0;
    }
  }

  for (const [toolName, count] of toolRetries.entries()) {
    patterns.push({
      name: `${toolName} retry pattern`,
      occurrences: count,
      lastSeen: new Date(),
      confidence: Math.min(100, count * 20),
      examples: [`Multiple ${toolName} retries detected`],
    });
  }

  // Pattern: Read-Edit-Write sequence (good practice)
  let readEditWriteCount = 0;
  for (let i = 0; i < tools.length - 2; i++) {
    if (tools[i].name === 'Read' &&
        tools[i + 1].name === 'Edit' &&
        tools[i + 2].name === 'Write') {
      readEditWriteCount++;
    }
  }

  if (readEditWriteCount > 0) {
    patterns.push({
      name: 'Read-Edit-Write pattern',
      occurrences: readEditWriteCount,
      lastSeen: new Date(),
      confidence: 90,
      examples: ['Following best practice: read before edit'],
    });
  }

  return patterns;
}

/**
 * Extract improvement suggestions
 */
function extractImprovements(tools: ToolEntry[]): string[] {
  const improvements: string[] = [];

  // Check for direct edits without reading
  let directEdits = 0;
  for (let i = 0; i < tools.length; i++) {
    if (tools[i].name === 'Edit' && (i === 0 || tools[i - 1].name !== 'Read')) {
      directEdits++;
    }
  }

  if (directEdits > 3) {
    improvements.push('Consider reading files before editing to ensure accuracy');
  }

  // Check for many sequential errors
  let errorStreak = 0;
  let maxErrorStreak = 0;

  for (const tool of tools) {
    if (tool.status === 'error') {
      errorStreak++;
      maxErrorStreak = Math.max(maxErrorStreak, errorStreak);
    } else {
      errorStreak = 0;
    }
  }

  if (maxErrorStreak >= 5) {
    improvements.push('High error rate detected - consider breaking down complex tasks');
  }

  return improvements;
}

/**
 * Create learning tracker from session data
 */
export function createLearningTracker(
  tools: ToolEntry[],
  bashErrors: BashError[] | null
): LearningTracker | null {
  if (tools.length === 0) {
    return null;
  }

  const errorLearnings = bashErrors ? extractErrorLearnings(bashErrors) : [];
  const patterns = extractToolPatterns(tools);
  const improvements = extractImprovements(tools);

  const recentErrors = bashErrors
    ? bashErrors.slice(0, 3).map(e => `${e.command} (exit ${e.exitCode})`)
    : [];

  debug('learning tracker:', {
    learnings: errorLearnings.length,
    patterns: patterns.length,
    improvements: improvements.length,
  });

  return {
    hasLearnings: errorLearnings.length > 0 || patterns.length > 0 || improvements.length > 0,
    totalEntries: errorLearnings.length,
    sessionLearnings: errorLearnings,
    patterns,
    recentErrors,
    improvements,
  };
}
