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
  agents: AgentEntry[],
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

  // Build phase history by analyzing tool windows
  const phaseHistory: WorkflowState['phaseHistory'] = [];
  const windowSize = 5;
  let prevPhase: WorkflowPhase | null = null;
  let phaseStart: Date | null = null;

  for (let i = 0; i <= tools.length - windowSize; i += windowSize) {
    const windowTools = tools.slice(i, i + windowSize);
    const window = countToolTypes(windowTools);
    const phase = determinePhase(window, i + windowSize >= tools.length ? todos : []);

    if (phase !== prevPhase && prevPhase !== null && phaseStart) {
      const endTime = windowTools[0]?.startTime || new Date();
      phaseHistory.push({
        phase: prevPhase,
        startTime: phaseStart,
        endTime,
        duration: endTime.getTime() - phaseStart.getTime(),
      });
    }

    if (phase !== prevPhase) {
      phaseStart = windowTools[0]?.startTime || new Date();
    }
    prevPhase = phase;
  }

  // Keep only last 10 phase transitions
  const trimmedHistory = phaseHistory.slice(-10);

  // Analyze recent tools (last 20) for current phase
  const recentTools = tools.slice(-20);
  const window = countToolTypes(recentTools);

  // Bias toward IMPLEMENT if agents are running
  const hasRunningAgents = agents.some(a => a.status === 'running');
  if (hasRunningAgents) {
    window.implementation += 3;
  }

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
    phaseHistory: trimmedHistory,
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
