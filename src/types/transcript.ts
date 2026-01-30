/**
 * Transcript.jsonl parsing result types
 */

export type ToolStatus = 'running' | 'completed' | 'error';

export interface ToolEntry {
  id: string;
  name: string;
  target?: string;
  status: ToolStatus;
  startTime: Date;
  endTime?: Date;
  error?: string;
  details?: unknown;
}

export type AgentStatus = 'running' | 'completed' | 'error';

export interface AgentEntry {
  id: string;
  type: string;
  model?: string;
  description?: string;
  status: AgentStatus;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface TodoItem {
  content: string;
  status: TodoStatus;
  activeForm: string;
}

export interface TranscriptData {
  tools: ToolEntry[];
  agents: AgentEntry[];
  todos: TodoItem[];
  skills: SkillEntry[];
}

export interface SkillEntry {
  id: string;
  name: string;
  args?: string;
  status: ToolStatus;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface TranscriptEntry {
  timestamp: string;
  message: {
    content: ContentBlock[];
  };
}

export type ContentBlock = ToolUseBlock | ToolResultBlock | TextBlock;

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  is_error?: boolean;
  content?: string | ContentBlock[];
}

export interface TextBlock {
  type: 'text';
  text: string;
}
