import { describe, it, expect } from 'vitest';
import { calculateCompactSuggestion } from '../src/data/compact-suggestion.js';
import type { ToolEntry } from '../src/types/index.js';

describe('calculateCompactSuggestion', () => {
  const createTools = (count: number): ToolEntry[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `tool-${i}`,
      name: 'Read',
      status: 'completed' as const,
      startTime: new Date(),
    }));
  };

  it('should not suggest when under threshold', () => {
    const tools = createTools(49);
    const result = calculateCompactSuggestion(tools, 50);

    expect(result.shouldSuggest).toBe(false);
    expect(result.message).toBe('');
    expect(result.totalToolCalls).toBe(49);
    expect(result.threshold).toBe(50);
  });

  it('should suggest when at threshold', () => {
    const tools = createTools(50);
    const result = calculateCompactSuggestion(tools, 50);

    expect(result.shouldSuggest).toBe(true);
    expect(result.message).toContain('50');
    expect(result.message).toContain('/compact');
    expect(result.totalToolCalls).toBe(50);
    expect(result.threshold).toBe(50);
  });

  it('should suggest when over threshold', () => {
    const tools = createTools(75);
    const result = calculateCompactSuggestion(tools, 50);

    expect(result.shouldSuggest).toBe(true);
    expect(result.message).toContain('75');
    expect(result.totalToolCalls).toBe(75);
  });

  it('should work with custom threshold', () => {
    const tools = createTools(30);
    const result = calculateCompactSuggestion(tools, 25);

    expect(result.shouldSuggest).toBe(true);
    expect(result.threshold).toBe(25);
  });

  it('should handle zero tools', () => {
    const tools = createTools(0);
    const result = calculateCompactSuggestion(tools, 50);

    expect(result.shouldSuggest).toBe(false);
    expect(result.totalToolCalls).toBe(0);
  });

  it('should use default threshold when not provided', () => {
    const tools = createTools(50);
    const result = calculateCompactSuggestion(tools);

    expect(result.shouldSuggest).toBe(true);
    expect(result.threshold).toBe(50);
  });
});
