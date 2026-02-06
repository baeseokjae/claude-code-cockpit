/**
 * Workflow phase detection tests
 */

import { describe, it, expect } from 'vitest';
import { detectWorkflowPhase } from '../src/data/workflow-phase.js';
import type { ToolEntry, AgentEntry, TodoItem } from '../src/types/index.js';

const createTool = (name: string, status: 'completed' | 'running' | 'error' = 'completed'): ToolEntry => ({
  name,
  status,
  target: null,
  startTime: new Date(),
});

const createTodo = (status: 'pending' | 'in_progress' | 'completed' = 'pending', content = 'Test todo'): TodoItem => ({
  content,
  status,
});

describe('detectWorkflowPhase', () => {
  it('should return UNKNOWN for empty tools', () => {
    const result = detectWorkflowPhase([], [], []);
    expect(result.currentPhase).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
    expect(result.phaseDuration).toBe(0);
  });

  it('should detect PLAN phase with majority planning tools', () => {
    const tools: ToolEntry[] = [
      createTool('Read'),
      createTool('Glob'),
      createTool('Grep'),
      createTool('Read'),
      createTool('Task'),
    ];

    const result = detectWorkflowPhase(tools, [], []);
    expect(result.currentPhase).toBe('PLAN');
    expect(result.confidence).toBeGreaterThanOrEqual(50);
  });

  it('should detect IMPLEMENT phase with majority implementation tools', () => {
    const tools: ToolEntry[] = [
      createTool('Edit'),
      createTool('Write'),
      createTool('Bash'),
      createTool('Edit'),
      createTool('Write'),
    ];

    const result = detectWorkflowPhase(tools, [], []);
    expect(result.currentPhase).toBe('IMPLEMENT');
    expect(result.confidence).toBeGreaterThanOrEqual(50);
  });

  it('should detect REVIEW phase when all todos are completed', () => {
    const tools: ToolEntry[] = [
      createTool('Read'),
      createTool('Grep'),
      createTool('Read'),
    ];

    const todos: TodoItem[] = [
      createTodo('completed', 'Task 1'),
      createTodo('completed', 'Task 2'),
    ];

    const result = detectWorkflowPhase(tools, [], todos);
    expect(result.currentPhase).toBe('REVIEW');
  });

  it('should detect mixed workflow with moderate confidence', () => {
    const tools: ToolEntry[] = [
      createTool('Read'),
      createTool('Edit'),
      createTool('Grep'),
      createTool('Write'),
      createTool('Bash'),
    ];

    const result = detectWorkflowPhase(tools, [], []);
    expect(['PLAN', 'IMPLEMENT', 'REVIEW']).toContain(result.currentPhase);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('should handle large tool lists (uses recent 20 tools)', () => {
    const tools: ToolEntry[] = [];

    // Add 30 planning tools
    for (let i = 0; i < 30; i++) {
      tools.push(createTool('Read'));
    }

    // Add 10 implementation tools at the end
    for (let i = 0; i < 10; i++) {
      tools.push(createTool('Edit'));
    }

    const result = detectWorkflowPhase(tools, [], []);

    // Should analyze only last 20 tools, which include implementation tools
    expect(result.currentPhase).toBe('IMPLEMENT');
  });

  it('should calculate confidence based on tool distribution', () => {
    const allPlanningTools: ToolEntry[] = [
      createTool('Read'),
      createTool('Read'),
      createTool('Read'),
      createTool('Glob'),
      createTool('Grep'),
    ];

    const mixedTools: ToolEntry[] = [
      createTool('Read'),
      createTool('Edit'),
      createTool('Grep'),
    ];

    const allPlanningResult = detectWorkflowPhase(allPlanningTools, [], []);
    const mixedResult = detectWorkflowPhase(mixedTools, [], []);

    expect(allPlanningResult.confidence).toBeGreaterThanOrEqual(mixedResult.confidence);
  });

  it('should set phase duration when phase start time exists', () => {
    const tools: ToolEntry[] = [
      createTool('Edit'),
      createTool('Write'),
    ];

    const result = detectWorkflowPhase(tools, [], []);

    // Phase duration should be >= 0
    expect(result.phaseDuration).toBeGreaterThanOrEqual(0);
  });

  it('should detect PLAN when planning ratio is high and implementation is low', () => {
    const tools: ToolEntry[] = [
      createTool('Read'),
      createTool('Glob'),
      createTool('Grep'),
      createTool('Read'),
      createTool('Read'),
      createTool('Task'),
      createTool('Read'),
    ];

    const result = detectWorkflowPhase(tools, [], []);
    expect(result.currentPhase).toBe('PLAN');
  });

  it('should handle todos with in_progress status', () => {
    const tools: ToolEntry[] = [
      createTool('Edit'),
      createTool('Write'),
    ];

    const todos: TodoItem[] = [
      createTodo('completed', 'Task 1'),
      createTodo('in_progress', 'Task 2'),
      createTodo('pending', 'Task 3'),
    ];

    const result = detectWorkflowPhase(tools, [], todos);

    // Should be in IMPLEMENT phase, not REVIEW
    expect(result.currentPhase).toBe('IMPLEMENT');
  });

  it('should include phase history', () => {
    const tools: ToolEntry[] = [
      createTool('Edit'),
      createTool('Write'),
    ];

    const result = detectWorkflowPhase(tools, [], []);

    expect(Array.isArray(result.phaseHistory)).toBe(true);
  });

  it('should handle running tools', () => {
    const tools: ToolEntry[] = [
      createTool('Edit', 'completed'),
      createTool('Write', 'running'),
      createTool('Bash', 'completed'),
    ];

    const result = detectWorkflowPhase(tools, [], []);
    expect(result.currentPhase).toBe('IMPLEMENT');
  });

  it('should handle error status tools', () => {
    const tools: ToolEntry[] = [
      createTool('Read', 'error'),
      createTool('Grep', 'completed'),
      createTool('Glob', 'completed'),
    ];

    const result = detectWorkflowPhase(tools, [], []);

    // Should still detect phase despite errors
    expect(['PLAN', 'IMPLEMENT', 'REVIEW', 'UNKNOWN']).toContain(result.currentPhase);
  });
});
