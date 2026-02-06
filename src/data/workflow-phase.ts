/**
 * Workflow phase detection
 * Analyzes tool patterns to determine current phase
 */

import type { ToolEntry, AgentEntry, TodoItem } from '../types/index.js';
import type { WorkflowPhase, WorkflowState } from '../types/workflow.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('workflow-phase');

const PLANNING_TOOLS = ['Read', 'Glob', 'Grep', 'Task'];
const IMPLEMENTATION_TOOLS = ['Edit', 'Write', 'Bash'];
const REVIEW_TOOLS = ['Read', 'Grep'];

interface ToolWindow {
  planning: number;
  implementation: number;
  review: number;
}

export function detectWorkflowPhase(
  tools: ToolEntry[],
  _agents: AgentEntry[],
  todos: TodoItem[]
): WorkflowState {
  if (tools.length === 0) {
    return {
      currentPhase: 'UNKNOWN',
      phaseStartTime: null,
      phaseDuration: 0,
      phaseHistory: [],
      confidence: 0,
    };
  }

  // Analyze recent tools (last 20)
  const recentTools = tools.slice(-20);
  const window = countToolTypes(recentTools);

  // Determine phase based on tool distribution
  const currentPhase = determinePhase(window, todos);
  const confidence = calculateConfidence(window);

  // Find phase start time
  const phaseStartTime = findPhaseStartTime(tools, currentPhase);
  const phaseDuration = phaseStartTime
    ? Date.now() - phaseStartTime.getTime()
    : 0;

  debug(`detected phase: ${currentPhase} (confidence: ${confidence}%)`);

  return {
    currentPhase,
    phaseStartTime,
    phaseDuration,
    phaseHistory: [], // Could be expanded to track full history
    confidence,
  };
}

function countToolTypes(tools: ToolEntry[]): ToolWindow {
  const window: ToolWindow = { planning: 0, implementation: 0, review: 0 };

  for (const tool of tools) {
    if (PLANNING_TOOLS.includes(tool.name)) window.planning++;
    if (IMPLEMENTATION_TOOLS.includes(tool.name)) window.implementation++;
    if (REVIEW_TOOLS.includes(tool.name)) window.review++;
  }

  return window;
}

function determinePhase(window: ToolWindow, todos: TodoItem[]): WorkflowPhase {
  const total = window.planning + window.implementation + window.review;
  if (total === 0) return 'UNKNOWN';

  const planningRatio = window.planning / total;
  const implRatio = window.implementation / total;

  // Check if all todos completed -> REVIEW phase
  const allTodosComplete = todos.length > 0 &&
    todos.every(t => t.status === 'completed');
  if (allTodosComplete && implRatio < 0.3) {
    return 'REVIEW';
  }

  // High implementation activity -> IMPLEMENT
  if (implRatio > 0.5) {
    return 'IMPLEMENT';
  }

  // High planning activity with low implementation -> PLAN
  if (planningRatio > 0.6 && implRatio < 0.2) {
    return 'PLAN';
  }

  // Mixed activity, likely implementing
  if (implRatio > 0.2) {
    return 'IMPLEMENT';
  }

  return 'PLAN';
}

function calculateConfidence(window: ToolWindow): number {
  const total = window.planning + window.implementation + window.review;
  if (total < 5) return 30; // Low sample size
  if (total < 10) return 50;

  const maxRatio = Math.max(
    window.planning / total,
    window.implementation / total
  );

  return Math.round(maxRatio * 100);
}

function findPhaseStartTime(tools: ToolEntry[], _phase: WorkflowPhase): Date | null {
  // Simplified: return start of recent activity
  if (tools.length === 0) return null;
  const recentTools = tools.slice(-10);
  return recentTools[0]?.startTime || null;
}
