/**
 * bash-errors.test.ts
 * Bash error extraction tests
 */

import { describe, it, expect } from 'vitest';
import { extractBashErrors } from '../src/data/bash-errors.js';
import type { ToolEntry } from '../src/types/index.js';

describe('extractBashErrors', () => {
  it('should extract bash errors with exit codes', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'gh search issues',
        status: 'error',
        startTime: new Date('2026-01-02T10:00:00Z'),
        details: {
          exit: 127,
          output: 'zsh:1: command not found: gh\n',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result?.[0].exitCode).toBe(127);
    expect(result?.[0].command).toBe('gh search issues');
    expect(result?.[0].output).toContain('command not found');
  });

  it('should limit output to 100 characters', () => {
    const longOutput = 'a'.repeat(200);
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'long-command',
        status: 'error',
        startTime: new Date(),
        details: {
          exit: 1,
          output: longOutput,
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result?.[0].output.length).toBe(100);
  });

  it('should limit to 5 errors maximum', () => {
    const tools: ToolEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      name: 'Bash',
      target: `cmd${i}`,
      status: 'error' as const,
      startTime: new Date(),
      details: {
        exit: 1,
        output: 'error',
      },
    }));

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(5);
  });

  it('should ignore bash tools with exit code 0', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'echo hello',
        status: 'error',
        startTime: new Date(),
        details: {
          exit: 0,
          output: 'hello',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).toBeNull();
  });

  it('should ignore bash tools without exit code', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'some-command',
        status: 'error',
        startTime: new Date(),
        details: {
          output: 'some error',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).toBeNull();
  });

  it('should ignore non-bash tools', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Read',
        target: '/path/to/file.ts',
        status: 'error',
        startTime: new Date(),
        details: {
          exit: 1,
          output: 'file not found',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).toBeNull();
  });

  it('should ignore successful bash tools', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'echo hello',
        status: 'completed',
        startTime: new Date(),
        details: {
          exit: 0,
          output: 'hello',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).toBeNull();
  });

  it('should handle tools with endTime', () => {
    const startTime = new Date('2026-01-02T10:00:00Z');
    const endTime = new Date('2026-01-02T10:00:05Z');
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'failing-command',
        status: 'error',
        startTime,
        endTime,
        details: {
          exit: 1,
          output: 'error',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result?.[0].timestamp).toEqual(endTime);
  });

  it('should use startTime when endTime is not available', () => {
    const startTime = new Date('2026-01-02T10:00:00Z');
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'failing-command',
        status: 'error',
        startTime,
        details: {
          exit: 1,
          output: 'error',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result?.[0].timestamp).toEqual(startTime);
  });

  it('should handle missing output field', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'failing-command',
        status: 'error',
        startTime: new Date(),
        details: {
          exit: 1,
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result?.[0].output).toBe('');
  });

  it('should handle empty tools array', () => {
    const result = extractBashErrors([]);
    expect(result).toBeNull();
  });

  it('should handle unknown command as default', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        status: 'error',
        startTime: new Date(),
        details: {
          exit: 1,
          output: 'error',
        },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result?.[0].command).toBe('unknown');
  });

  it('should extract multiple errors with different exit codes', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'command1',
        status: 'error',
        startTime: new Date(),
        details: { exit: 127, output: 'not found' },
      },
      {
        id: '2',
        name: 'Bash',
        target: 'command2',
        status: 'error',
        startTime: new Date(),
        details: { exit: 1, output: 'general error' },
      },
      {
        id: '3',
        name: 'Bash',
        target: 'command3',
        status: 'error',
        startTime: new Date(),
        details: { exit: 2, output: 'syntax error' },
      },
    ];

    const result = extractBashErrors(tools);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result?.[0].exitCode).toBe(127);
    expect(result?.[1].exitCode).toBe(1);
    expect(result?.[2].exitCode).toBe(2);
  });
});
