import { describe, it, expect } from 'vitest';
import { extractViolations } from '../src/data/rule-violations.js';
import type { ToolEntry } from '../src/types/index.js';

describe('extractViolations', () => {
  const createEditTool = (target: string, newString: string): ToolEntry => ({
    id: 'tool-1',
    name: 'Edit',
    status: 'completed',
    target,
    startTime: new Date(),
    details: { new_string: newString },
  });

  const createWriteTool = (target: string, content: string): ToolEntry => ({
    id: 'tool-2',
    name: 'Write',
    status: 'completed',
    target,
    startTime: new Date(),
    details: { content },
  });

  it('should detect console.log', () => {
    const tools = [createEditTool('test.js', 'console.log("test")')];
    const result = extractViolations(tools);

    expect(result.byType.get('console_log')).toBe(1);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should detect multiple console methods', () => {
    const tools = [
      createEditTool('test.js', 'console.log("a"); console.error("b"); console.warn("c")'),
    ];
    const result = extractViolations(tools);

    expect(result.byType.get('console_log')).toBe(3);
  });

  it('should detect hardcoded secrets', () => {
    const tools = [
      createWriteTool('config.js', 'const API_KEY = "sk-1234567890abcdef1234567890abcdef"'),
    ];
    const result = extractViolations(tools);

    expect(result.byType.get('hardcoded_secret')).toBeGreaterThan(0);
    const violation = result.violations.find(v => v.type === 'hardcoded_secret');
    expect(violation?.severity).toBe('error');
  });

  it('should detect GitHub tokens', () => {
    const tools = [
      createWriteTool('config.js', 'const TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz123456"'),
    ];
    const result = extractViolations(tools);

    expect(result.byType.get('hardcoded_secret')).toBeGreaterThan(0);
  });

  it('should detect large files', () => {
    const largeContent = 'line\n'.repeat(600);
    const tools = [createWriteTool('large.js', largeContent)];
    const result = extractViolations(tools);

    expect(result.byType.get('large_file')).toBe(1);
  });

  it('should detect debugger statements', () => {
    const tools = [createEditTool('test.js', 'debugger;')];
    const result = extractViolations(tools);

    expect(result.byType.get('debug_statement')).toBe(1);
  });

  it('should detect TODO comments', () => {
    const tools = [
      createEditTool('test.js', '// TODO: fix this later'),
    ];
    const result = extractViolations(tools);

    expect(result.byType.get('todo_comment')).toBe(1);
  });

  it('should detect Python print statements', () => {
    const tools = [createEditTool('test.py', 'print("hello")')];
    const result = extractViolations(tools);

    expect(result.byType.get('console_log')).toBe(1);
  });

  it('should only check Edit and Write tools', () => {
    const tools: ToolEntry[] = [
      {
        id: 'read-1',
        name: 'Read',
        status: 'completed',
        target: 'test.js',
        startTime: new Date(),
        details: { content: 'console.log("test")' },
      },
    ];
    const result = extractViolations(tools);

    expect(result.total).toBe(0);
  });

  it('should ignore incomplete tools', () => {
    const tools: ToolEntry[] = [
      {
        id: 'edit-1',
        name: 'Edit',
        status: 'running',
        target: 'test.js',
        startTime: new Date(),
        details: { new_string: 'console.log("test")' },
      },
    ];
    const result = extractViolations(tools);

    expect(result.total).toBe(0);
  });

  it('should handle empty tools array', () => {
    const result = extractViolations([]);

    expect(result.total).toBe(0);
    expect(result.byType.size).toBe(0);
    expect(result.violations.length).toBe(0);
  });

  it('should aggregate multiple violation types', () => {
    const tools = [
      createEditTool('test.js', 'console.log("test"); debugger; // TODO: fix'),
    ];
    const result = extractViolations(tools);

    expect(result.total).toBeGreaterThan(2);
    expect(result.byType.get('console_log')).toBeGreaterThan(0);
    expect(result.byType.get('debug_statement')).toBeGreaterThan(0);
    expect(result.byType.get('todo_comment')).toBeGreaterThan(0);
  });
});
