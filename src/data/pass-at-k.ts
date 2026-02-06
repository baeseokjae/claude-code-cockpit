/**
 * Pass@k metrics calculation
 * Analyzes tool call success patterns to measure AI code generation quality
 */

import type { ToolEntry } from '../types/index.js';
import type { PassAtKMetrics, PassAtKSummary } from '../types/pass-at-k.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('pass-at-k');

interface AttemptSequence {
  attempts: ToolEntry[];
  success: boolean;
  attemptsToSuccess: number;
}

/**
 * Group consecutive tool calls of the same type into sequences
 */
function groupAttemptSequences(tools: ToolEntry[]): AttemptSequence[] {
  const sequences: AttemptSequence[] = [];
  let currentSequence: ToolEntry[] = [];
  let lastToolName: string | null = null;

  for (const tool of tools) {
    // Only track tools that can fail/succeed (Edit, Write, Bash, etc.)
    const trackableTools = ['Edit', 'Write', 'Bash', 'Read', 'Task'];
    if (!trackableTools.includes(tool.name)) {
      continue;
    }

    // Same tool type - add to current sequence
    if (tool.name === lastToolName) {
      currentSequence.push(tool);
    } else {
      // Different tool - save previous sequence and start new one
      if (currentSequence.length > 0) {
        const hasSuccess = currentSequence.some(t => t.status === 'completed');
        const successIndex = currentSequence.findIndex(t => t.status === 'completed');

        sequences.push({
          attempts: [...currentSequence],
          success: hasSuccess,
          attemptsToSuccess: hasSuccess ? successIndex + 1 : currentSequence.length,
        });
      }
      currentSequence = [tool];
      lastToolName = tool.name;
    }
  }

  // Save last sequence
  if (currentSequence.length > 0) {
    const hasSuccess = currentSequence.some(t => t.status === 'completed');
    const successIndex = currentSequence.findIndex(t => t.status === 'completed');

    sequences.push({
      attempts: [...currentSequence],
      success: hasSuccess,
      attemptsToSuccess: hasSuccess ? successIndex + 1 : currentSequence.length,
    });
  }

  return sequences;
}

/**
 * Calculate pass@k metrics from tool sequences
 */
function calculatePassAtK(sequences: AttemptSequence[]): PassAtKMetrics {
  if (sequences.length === 0) {
    return {
      passAt1: 0,
      passAt3: 0,
      passAt5: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageAttemptsToSuccess: 0,
    };
  }

  // Pass@1: succeeded on first attempt
  const passAt1Count = sequences.filter(s => s.success && s.attemptsToSuccess === 1).length;
  const passAt1 = (passAt1Count / sequences.length) * 100;

  // Pass@3: succeeded within 3 attempts
  const passAt3Count = sequences.filter(s => s.success && s.attemptsToSuccess <= 3).length;
  const passAt3 = (passAt3Count / sequences.length) * 100;

  // Pass@5: succeeded within 5 attempts
  const passAt5Count = sequences.filter(s => s.success && s.attemptsToSuccess <= 5).length;
  const passAt5 = (passAt5Count / sequences.length) * 100;

  const successfulAttempts = sequences.filter(s => s.success).length;
  const failedAttempts = sequences.length - successfulAttempts;

  const totalAttemptsToSuccess = sequences
    .filter(s => s.success)
    .reduce((sum, s) => sum + s.attemptsToSuccess, 0);
  const averageAttemptsToSuccess = successfulAttempts > 0
    ? totalAttemptsToSuccess / successfulAttempts
    : 0;

  return {
    passAt1: Math.round(passAt1),
    passAt3: Math.round(passAt3),
    passAt5: Math.round(passAt5),
    totalAttempts: sequences.length,
    successfulAttempts,
    failedAttempts,
    averageAttemptsToSuccess: Math.round(averageAttemptsToSuccess * 10) / 10,
  };
}

/**
 * Get pass@k summary from tool list
 */
export function getPassAtKSummary(tools: ToolEntry[]): PassAtKSummary {
  if (tools.length === 0) {
    return {
      hasData: false,
      metrics: null,
      recentSuccessRate: 0,
    };
  }

  const sequences = groupAttemptSequences(tools);

  if (sequences.length === 0) {
    return {
      hasData: false,
      metrics: null,
      recentSuccessRate: 0,
    };
  }

  const metrics = calculatePassAtK(sequences);

  // Calculate recent success rate (last 10 sequences)
  const recentSequences = sequences.slice(-10);
  const recentSuccesses = recentSequences.filter(s => s.success).length;
  const recentSuccessRate = recentSequences.length > 0
    ? Math.round((recentSuccesses / recentSequences.length) * 100)
    : 0;

  debug('pass@k metrics:', metrics);

  return {
    hasData: true,
    metrics,
    recentSuccessRate,
  };
}
