/**
 * Pass@k metrics calculation tests
 */

import { describe, it, expect } from 'vitest';
import { getPassAtKSummary } from '../src/data/pass-at-k.js';
import type { ToolEntry } from '../src/types/index.js';

const createTool = (name: string, status: 'completed' | 'running' | 'error' = 'completed'): ToolEntry => ({
  name,
  status,
  target: null,
  startTime: new Date(),
});

describe('getPassAtKSummary', () => {
  it('should return no data for empty tools', () => {
    const result = getPassAtKSummary([]);
    expect(result.hasData).toBe(false);
    expect(result.metrics).toBeNull();
  });

  it('should calculate pass@1 for first-attempt successes', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'completed'),
      createTool('Write', 'completed'),
      createTool('Bash', 'completed'),
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.passAt1).toBe(100);
    expect(result.metrics?.totalAttempts).toBe(3);
  });

  it('should handle multiple attempts for same tool', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
      createTool('Edit', 'completed'),
      createTool('Write', 'completed'),
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.passAt1).toBe(50); // 1 out of 2 sequences succeeded on first attempt
    expect(result.metrics?.passAt3).toBe(100); // Both succeeded within 3 attempts
  });

  it('should calculate average attempts to success', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'completed'),
      createTool('Write', 'error'),
      createTool('Write', 'error'),
      createTool('Write', 'completed'),
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.averageAttemptsToSuccess).toBe(2); // (1 + 3) / 2 = 2
  });

  it('should handle failed sequences', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.passAt1).toBe(0);
    expect(result.metrics?.passAt3).toBe(0);
    expect(result.metrics?.failedAttempts).toBe(1);
  });

  it('should calculate recent success rate', () => {
    const tools: ToolEntry[] = [];

    // Add 5 successful sequences
    for (let i = 0; i < 5; i++) {
      tools.push(createTool('Edit', 'completed'));
      tools.push(createTool('Write', 'completed'));
    }

    // Add 5 failed sequences
    for (let i = 0; i < 5; i++) {
      tools.push(createTool('Bash', 'error'));
      tools.push(createTool('Read', 'error'));
    }

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.recentSuccessRate).toBe(0); // Last 10 sequences all failed
  });

  it('should only track relevant tools', () => {
    const tools: ToolEntry[] = [
      createTool('Grep', 'completed'), // Not tracked
      createTool('Glob', 'completed'), // Not tracked
      createTool('Edit', 'completed'), // Tracked
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.totalAttempts).toBe(1); // Only Edit is counted
  });

  it('should handle mixed tool types', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'completed'),
      createTool('Write', 'error'),
      createTool('Write', 'completed'),
      createTool('Bash', 'completed'),
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.totalAttempts).toBe(3);
    expect(result.metrics?.successfulAttempts).toBe(3);
  });

  it('should calculate pass@5 correctly', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
      createTool('Edit', 'completed'),
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.passAt1).toBe(0);
    expect(result.metrics?.passAt3).toBe(0);
    expect(result.metrics?.passAt5).toBe(100);
    expect(result.metrics?.averageAttemptsToSuccess).toBe(5);
  });

  it('should handle running tools', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'completed'),
      createTool('Write', 'running'), // Running should be treated as not completed
    ];

    const result = getPassAtKSummary(tools);
    expect(result.hasData).toBe(true);
    expect(result.metrics?.totalAttempts).toBe(2);
  });
});
