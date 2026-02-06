/**
 * tool-stats.test.ts
 * Tool statistics calculation tests
 */

import { describe, it, expect } from 'vitest';
import { calculateToolStats } from '../src/data/tool-stats.js';
import type { ToolEntry } from '../src/types/index.js';

describe('calculateToolStats', () => {
  it('should calculate success rate correctly', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'completed', startTime: new Date() },
      { id: '2', name: 'Edit', status: 'completed', startTime: new Date() },
      { id: '3', name: 'Bash', status: 'error', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(3);
    expect(result?.success).toBe(2);
    expect(result?.error).toBe(1);
    expect(result?.successRate).toBe(67); // 2/3 = 66.67 -> 67
  });

  it('should handle all successful tools', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'completed', startTime: new Date() },
      { id: '2', name: 'Edit', status: 'completed', startTime: new Date() },
      { id: '3', name: 'Bash', status: 'completed', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(3);
    expect(result?.success).toBe(3);
    expect(result?.error).toBe(0);
    expect(result?.successRate).toBe(100);
  });

  it('should handle all failed tools', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'error', startTime: new Date() },
      { id: '2', name: 'Edit', status: 'error', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(2);
    expect(result?.success).toBe(0);
    expect(result?.error).toBe(2);
    expect(result?.successRate).toBe(0);
  });

  it('should ignore running tools', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'completed', startTime: new Date() },
      { id: '2', name: 'Edit', status: 'running', startTime: new Date() },
      { id: '3', name: 'Bash', status: 'error', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(2); // Only completed + error
    expect(result?.success).toBe(1);
    expect(result?.error).toBe(1);
    expect(result?.successRate).toBe(50);
  });

  it('should round success rate to nearest integer', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'completed', startTime: new Date() },
      { id: '2', name: 'Read', status: 'completed', startTime: new Date() },
      { id: '3', name: 'Read', status: 'completed', startTime: new Date() },
      { id: '4', name: 'Bash', status: 'error', startTime: new Date() },
      { id: '5', name: 'Bash', status: 'error', startTime: new Date() },
      { id: '6', name: 'Bash', status: 'error', startTime: new Date() },
      { id: '7', name: 'Bash', status: 'error', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    // 3/7 = 42.857... -> 43
    expect(result?.successRate).toBe(43);
  });

  it('should return null for empty tools array', () => {
    const result = calculateToolStats([]);
    expect(result).toBeNull();
  });

  it('should return null when only running tools exist', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'running', startTime: new Date() },
      { id: '2', name: 'Edit', status: 'running', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).toBeNull();
  });

  it('should handle 50/50 split', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'completed', startTime: new Date() },
      { id: '2', name: 'Bash', status: 'error', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(2);
    expect(result?.success).toBe(1);
    expect(result?.error).toBe(1);
    expect(result?.successRate).toBe(50);
  });

  it('should handle single successful tool', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Read', status: 'completed', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(1);
    expect(result?.success).toBe(1);
    expect(result?.error).toBe(0);
    expect(result?.successRate).toBe(100);
  });

  it('should handle single failed tool', () => {
    const tools: ToolEntry[] = [
      { id: '1', name: 'Bash', status: 'error', startTime: new Date() },
    ];

    const result = calculateToolStats(tools);
    expect(result).not.toBeNull();
    expect(result?.total).toBe(1);
    expect(result?.success).toBe(0);
    expect(result?.error).toBe(1);
    expect(result?.successRate).toBe(0);
  });
});
