/**
 * learning-tracker.test.ts
 * Learning tracker tests
 */

import { describe, it, expect } from 'vitest';
import { createLearningTracker } from '../src/data/learning-tracker.js';
import type { ToolEntry } from '../src/types/index.js';
import type { BashError } from '../src/types/transcript.js';

const createTool = (name: string, status: 'completed' | 'error' = 'completed'): ToolEntry => ({
  id: `tool-${Math.random()}`,
  name,
  status,
  target: null as any,
  startTime: new Date(),
});

const createBashError = (command: string, exitCode: number, output = 'error'): BashError => ({
  command,
  exitCode,
  output,
  timestamp: new Date(),
});

describe('createLearningTracker', () => {
  it('should return null for empty tools', () => {
    const result = createLearningTracker([], null);
    expect(result).toBeNull();
  });

  it('should extract error learnings from bash errors', () => {
    const tools = [createTool('Bash')];
    const errors = [
      createBashError('npm test', 1, 'test failed'),
      createBashError('npm build', 2, 'build failed'),
    ];

    const result = createLearningTracker(tools, errors);

    expect(result).not.toBeNull();
    expect(result!.sessionLearnings.length).toBe(2);
    expect(result!.sessionLearnings[0].category).toBe('error');
    expect(result!.sessionLearnings[0].title).toBe('Exit code 1');
    expect(result!.recentErrors.length).toBe(2);
  });

  it('should limit error learnings to 5', () => {
    const tools = [createTool('Bash')];
    const errors = Array.from({ length: 10 }, (_, i) =>
      createBashError(`cmd-${i}`, i + 1, 'err')
    );

    const result = createLearningTracker(tools, errors);

    expect(result).not.toBeNull();
    expect(result!.sessionLearnings.length).toBe(5);
  });

  it('should detect retry patterns (consecutive errors)', () => {
    const tools = [
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
      createTool('Edit', 'error'),
      createTool('Read'),
    ];

    const result = createLearningTracker(tools, null);

    expect(result).not.toBeNull();
    const retryPattern = result!.patterns.find(p => p.name.includes('Edit'));
    expect(retryPattern).toBeDefined();
  });

  it('should detect Read-Edit-Write pattern', () => {
    const tools = [
      createTool('Read'),
      createTool('Edit'),
      createTool('Write'),
    ];

    const result = createLearningTracker(tools, null);

    expect(result).not.toBeNull();
    const rewPattern = result!.patterns.find(p => p.name === 'Read-Edit-Write pattern');
    expect(rewPattern).toBeDefined();
    expect(rewPattern!.occurrences).toBe(1);
  });

  it('should suggest improvements for many direct edits', () => {
    const tools = [
      createTool('Edit'),
      createTool('Edit'),
      createTool('Edit'),
      createTool('Edit'),
      createTool('Edit'),
    ];

    const result = createLearningTracker(tools, null);

    expect(result).not.toBeNull();
    expect(result!.improvements.some(i => i.includes('reading files'))).toBe(true);
  });

  it('should suggest improvements for high error streaks', () => {
    const tools = [
      createTool('Bash', 'error'),
      createTool('Bash', 'error'),
      createTool('Bash', 'error'),
      createTool('Bash', 'error'),
      createTool('Bash', 'error'),
    ];

    const result = createLearningTracker(tools, null);

    expect(result).not.toBeNull();
    expect(result!.improvements.some(i => i.includes('error rate'))).toBe(true);
  });

  it('should handle null bashErrors', () => {
    const tools = [createTool('Read'), createTool('Edit')];
    const result = createLearningTracker(tools, null);

    expect(result).not.toBeNull();
    expect(result!.sessionLearnings.length).toBe(0);
    expect(result!.recentErrors.length).toBe(0);
  });

  it('should set hasLearnings correctly', () => {
    // With no patterns or errors, hasLearnings depends on improvements
    const tools = [createTool('Read')];
    const result = createLearningTracker(tools, null);

    expect(result).not.toBeNull();
    // Single Read tool - no patterns, no errors, no improvements detected
    expect(result!.hasLearnings).toBe(false);
  });
});
