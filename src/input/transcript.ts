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
  ToolUseBlock,
  ToolResultBlock,
} from '../types/index.js';
import { createDebug } from '../utils/debug.js';
import {
  MAX_TOOLS_DISPLAY,
  MAX_AGENTS_DISPLAY,
  MAX_SKILLS_DISPLAY,
} from '../utils/constants.js';

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
  let currentTodos: TodoItem[] = [];

  try {
    const fileStream = createReadStream(transcriptPath, { encoding: 'utf8' });
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as TranscriptEntry;
        processEntry(entry, toolsMap, agentsMap, skillsMap, currentTodos);
      } catch (error) {
        debug('failed to parse line:', error);
        continue;
      }
    }
  } catch (error) {
    debug('failed to read transcript:', error);
    return emptyData;
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

  return {
    tools,
    agents,
    todos: currentTodos,
    skills,
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
      model: extractModelFromPrompt(input.prompt as string),
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

  const tool: ToolEntry = {
    id,
    name,
    target: extractTarget(name, input),
    status: 'running',
    startTime,
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

    if (tool.name === 'TodoWrite' && !is_error && typeof content === 'string') {
      try {
        const todos = parseTodosFromResult(content);
        if (todos.length > 0) {
          currentTodos.length = 0;
          currentTodos.push(...todos);
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

function extractModelFromPrompt(prompt: string): string | undefined {
  if (!prompt) return undefined;

  const lower = prompt.toLowerCase();
  if (lower.includes('opus')) return 'opus';
  if (lower.includes('sonnet')) return 'sonnet';
  if (lower.includes('haiku')) return 'haiku';

  return undefined;
}

function parseTodosFromResult(_content: string): TodoItem[] {
  try {
    return [];
  } catch {
    return [];
  }
}
