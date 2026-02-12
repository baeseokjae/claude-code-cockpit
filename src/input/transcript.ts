/**
 * Parse transcript.jsonl and track tools/agents/todos/skills
 */

import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import type {
  TranscriptData,
  ToolEntry,
  AgentEntry,
  TodoItem,
  SkillEntry,
  TranscriptEntry,
  ProgressEntry,
  ToolUseBlock,
  ToolResultBlock,
  TodoStatus,
} from '../types/index.js';
import { createDebug } from '../utils/debug.js';
import {
  MAX_TOOLS_DISPLAY,
  MAX_AGENTS_DISPLAY,
  MAX_SKILLS_DISPLAY,
} from '../utils/constants.js';
import { extractGitActivity } from '../data/git-activity.js';
import { calculateToolStats } from '../data/tool-stats.js';
import { extractBashErrors } from '../data/bash-errors.js';

const debug = createDebug('transcript');

export async function parseTranscript(
  transcriptPath: string | null
): Promise<TranscriptData> {
  const emptyData: TranscriptData = {
    tools: [],
    agents: [],
    todos: [],
    skills: [],
  };

  if (!transcriptPath || !existsSync(transcriptPath)) {
    debug('transcript file not found:', transcriptPath);
    return emptyData;
  }

  debug('parsing transcript:', transcriptPath);

  const toolsMap = new Map<string, ToolEntry>();
  const agentsMap = new Map<string, AgentEntry>();
  const skillsMap = new Map<string, SkillEntry>();
  const subagentToolCounts = new Map<string, number>();
  let currentTodos: TodoItem[] = [];

  try {
    const fileStream = createReadStream(transcriptPath, { encoding: 'utf8' });
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const raw = JSON.parse(line);

        if (raw.type === 'progress') {
          processProgressEntry(raw as ProgressEntry, subagentToolCounts);
        } else {
          processEntry(raw as TranscriptEntry, toolsMap, agentsMap, skillsMap, currentTodos);
        }
      } catch (error) {
        debug('failed to parse line:', error);
        continue;
      }
    }
  } catch (error) {
    debug('failed to read transcript:', error);
    return emptyData;
  }

  // Assign subagent tool counts to matching agents
  for (const [parentToolUseID, count] of subagentToolCounts) {
    const agent = agentsMap.get(parentToolUseID);
    if (agent) {
      agent.subagentToolCount = count;
    }
  }

  const tools = Array.from(toolsMap.values())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, MAX_TOOLS_DISPLAY);

  const agents = Array.from(agentsMap.values())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, MAX_AGENTS_DISPLAY);

  const skills = Array.from(skillsMap.values())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, MAX_SKILLS_DISPLAY);

  debug(`parsed: ${tools.length} tools, ${agents.length} agents, ${skills.length} skills, ${currentTodos.length} todos`);

  // Extract additional analytics from tools
  const allTools = Array.from(toolsMap.values());
  const gitActivity = extractGitActivity(allTools);
  const toolStats = calculateToolStats(allTools);
  const bashErrors = extractBashErrors(allTools);

  return {
    tools,
    agents,
    todos: currentTodos,
    skills,
    gitActivity: gitActivity || undefined,
    toolStats: toolStats || undefined,
    bashErrors: bashErrors || undefined,
  };
}

function processEntry(
  entry: TranscriptEntry,
  toolsMap: Map<string, ToolEntry>,
  agentsMap: Map<string, AgentEntry>,
  skillsMap: Map<string, SkillEntry>,
  currentTodos: TodoItem[]
): void {
  const { timestamp, message } = entry;

  // Guard: skip entries without message.content
  if (!message?.content || !Array.isArray(message.content)) {
    return;
  }

  const content = message.content;

  for (const block of content) {
    if (block.type === 'tool_use') {
      handleToolUse(block, timestamp, toolsMap, agentsMap, skillsMap);
    } else if (block.type === 'tool_result') {
      handleToolResult(block, toolsMap, agentsMap, skillsMap, currentTodos);
    }
  }
}

function handleToolUse(
  block: ToolUseBlock,
  timestamp: string,
  toolsMap: Map<string, ToolEntry>,
  agentsMap: Map<string, AgentEntry>,
  skillsMap: Map<string, SkillEntry>
): void {
  const { id, name, input } = block;
  const startTime = new Date(timestamp);

  if (name === 'Task') {
    const agent: AgentEntry = {
      id,
      type: (input.subagent_type as string) || 'unknown',
      model: extractModelFromPrompt(input.prompt as string, input),
      description: (input.description as string) || (input.prompt as string)?.substring(0, 50),
      status: 'running',
      startTime,
    };
    agentsMap.set(id, agent);
    return;
  }

  if (name === 'Skill') {
    const skill: SkillEntry = {
      id,
      name: (input.skill as string) || 'unknown',
      args: input.args as string,
      status: 'running',
      startTime,
    };
    skillsMap.set(id, skill);
    return;
  }

  // Handle TaskCreate (new Task API)
  if (name === 'TaskCreate') {
    const tool: ToolEntry = {
      id,
      name,
      target: (input.subject as string) || undefined,
      status: 'running',
      startTime,
      details: input,
    };
    toolsMap.set(id, tool);
    return;
  }

  // Handle TaskUpdate (new Task API)
  if (name === 'TaskUpdate') {
    const tool: ToolEntry = {
      id,
      name,
      target: (input.taskId as string) || undefined,
      status: 'running',
      startTime,
      details: input,
    };
    toolsMap.set(id, tool);
    return;
  }

  // Handle TodoWrite (legacy API)
  if (name === 'TodoWrite') {
    const tool: ToolEntry = {
      id,
      name,
      target: undefined,
      status: 'running',
      startTime,
      details: input,
    };
    toolsMap.set(id, tool);
    return;
  }

  const tool: ToolEntry = {
    id,
    name,
    target: extractTarget(name, input),
    status: 'running',
    startTime,
    details: input,
  };
  toolsMap.set(id, tool);
}

function handleToolResult(
  block: ToolResultBlock,
  toolsMap: Map<string, ToolEntry>,
  agentsMap: Map<string, AgentEntry>,
  skillsMap: Map<string, SkillEntry>,
  currentTodos: TodoItem[]
): void {
  const { tool_use_id, is_error, content } = block;

  if (agentsMap.has(tool_use_id)) {
    const agent = agentsMap.get(tool_use_id)!;
    agent.status = is_error ? 'error' : 'completed';
    agent.endTime = new Date();
    if (is_error && typeof content === 'string') {
      agent.error = content;
    }
    return;
  }

  if (skillsMap.has(tool_use_id)) {
    const skill = skillsMap.get(tool_use_id)!;
    skill.status = is_error ? 'error' : 'completed';
    skill.endTime = new Date();
    if (is_error && typeof content === 'string') {
      skill.error = content;
    }
    return;
  }

  if (toolsMap.has(tool_use_id)) {
    const tool = toolsMap.get(tool_use_id)!;
    tool.status = is_error ? 'error' : 'completed';
    tool.endTime = new Date();
    if (is_error && typeof content === 'string') {
      tool.error = content;
    }

    // Handle TodoWrite (legacy API)
    if (tool.name === 'TodoWrite' && !is_error) {
      try {
        const input = tool.details as Record<string, unknown>;
        const todos = input?.todos as Array<{ content: string; status: TodoStatus; id?: string; activeForm?: string }> | undefined;
        
        if (todos && Array.isArray(todos) && todos.length > 0) {
          currentTodos.length = 0;
          currentTodos.push(...todos.map(t => ({
            id: t.id,
            content: t.content,
            status: t.status,
            activeForm: t.activeForm,
          })));
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // Handle TaskCreate (new Task API)
    if (tool.name === 'TaskCreate' && !is_error) {
      try {
        const input = tool.details as Record<string, unknown>;
        
        // Extract task ID from the result content
        let taskId = tool_use_id; // fallback to tool_use_id
        if (typeof content === 'string') {
          try {
            const result = JSON.parse(content);
            if (result.taskId) {
              taskId = result.taskId;
            }
          } catch {
            // If parsing fails, use tool_use_id as fallback
          }
        }
        
        const todoItem: TodoItem = {
          id: taskId,
          content: (input?.subject as string) ?? '',
          status: 'pending',
        };
        currentTodos.push(todoItem);
      } catch {
        // Ignore parsing errors
      }
    }

    // Handle TaskUpdate (new Task API)
    if (tool.name === 'TaskUpdate' && !is_error) {
      try {
        const input = tool.details as Record<string, unknown>;
        const taskId = input?.taskId as string;
        const newStatus = input?.status as TodoStatus | undefined;
        const newContent = input?.subject as string | undefined;
        
        if (taskId) {
          const todo = currentTodos.find(t => t.id === taskId);
          if (todo) {
            if (newStatus) {
              todo.status = newStatus;
            }
            if (newContent) {
              todo.content = newContent;
            }
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }
}

function extractTarget(toolName: string, input: Record<string, unknown>): string | undefined {
  if (toolName === 'Read' || toolName === 'Edit' || toolName === 'Write') {
    return input.file_path as string;
  }
  if (toolName === 'Bash') {
    return input.command as string;
  }
  if (toolName === 'Grep') {
    return input.pattern as string;
  }
  return undefined;
}

function processProgressEntry(
  entry: ProgressEntry,
  subagentToolCounts: Map<string, number>
): void {
  // Skip non-subagent progress (hook_progress, bash_progress, etc.)
  if (entry.data?.type) return;

  const content = entry.data?.message?.message?.content;
  if (!content || !Array.isArray(content)) return;

  let toolCount = 0;
  for (const block of content) {
    if (block.type === 'tool_use') {
      toolCount++;
    }
  }

  if (toolCount > 0) {
    const parentId = entry.parentToolUseID;
    subagentToolCounts.set(parentId, (subagentToolCounts.get(parentId) || 0) + toolCount);
  }
}

function extractModelFromPrompt(prompt: string, input?: Record<string, unknown>): string | undefined {
  // First check explicit model field in input
  if (input?.model) {
    const modelStr = String(input.model).toLowerCase();
    if (modelStr.includes('opus')) return 'opus';
    if (modelStr.includes('sonnet')) return 'sonnet';
    if (modelStr.includes('haiku')) return 'haiku';
  }

  // Check subagent_model field (new API)
  if (input?.subagent_model) {
    const modelStr = String(input.subagent_model).toLowerCase();
    if (modelStr.includes('opus')) return 'opus';
    if (modelStr.includes('sonnet')) return 'sonnet';
    if (modelStr.includes('haiku')) return 'haiku';
  }

  // Fallback to prompt analysis
  if (!prompt) return undefined;

  const lower = prompt.toLowerCase();
  if (lower.includes('opus')) return 'opus';
  if (lower.includes('sonnet')) return 'sonnet';
  if (lower.includes('haiku')) return 'haiku';

  return undefined;
}
