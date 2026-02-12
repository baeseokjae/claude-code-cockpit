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
  subagentToolCount?: number;
}

export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface TodoItem {
  id?: string;
  content: string;
  status: TodoStatus;
  activeForm?: string;
}

export interface TranscriptData {
  tools: ToolEntry[];
  agents: AgentEntry[];
  todos: TodoItem[];
  skills: SkillEntry[];
  gitActivity?: GitActivity;
  toolStats?: ToolStats;
  bashErrors?: BashError[];
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

/**
 * Git activity tracking (commits and PRs created in this session)
 */
export interface GitActivity {
  commits: number;
  pullRequests: number;
}

/**
 * Tool execution statistics
 */
export interface ToolStats {
  total: number;
  success: number;
  error: number;
  successRate: number; // 0-100
}

/**
 * Bash command error details
 */
export interface BashError {
  command: string;
  exitCode: number;
  output: string;
  timestamp: Date;
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

/**
 * Progress entry from subagent streaming (type: 'progress')
 */
export interface ProgressEntry {
  type: 'progress';
  parentToolUseID: string;
  data: {
    type?: string; // hook_progress, bash_progress — skip these
    message?: {
      message: {
        content: ContentBlock[];
      };
    };
  };
}

/**
 * Raw transcript line — either a standard message entry or a progress entry
 */
export type RawTranscriptEntry = TranscriptEntry | ProgressEntry;
