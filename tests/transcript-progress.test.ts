/**
 * Tests for processProgressEntry (via parseTranscript integration)
 *
 * Verifies subagentToolCount parsing from progress entries in transcript.jsonl
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseTranscript } from '../src/input/transcript.js';

function createTempTranscript(lines: unknown[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'cockpit-test-'));
  const filePath = join(dir, 'transcript.jsonl');
  writeFileSync(filePath, lines.map(l => JSON.stringify(l)).join('\n'));
  return filePath;
}

const tempFiles: string[] = [];

function makeTempTranscript(lines: unknown[]): string {
  const path = createTempTranscript(lines);
  tempFiles.push(path);
  return path;
}

afterEach(() => {
  for (const f of tempFiles) {
    try { unlinkSync(f); } catch { /* ignore */ }
  }
  tempFiles.length = 0;
});

describe('processProgressEntry (via parseTranscript)', () => {
  it('should count tool_use blocks in progress entries', async () => {
    const path = makeTempTranscript([
      // Agent tool_use (Task)
      {
        timestamp: '2024-01-01T00:00:00Z',
        message: {
          content: [{
            type: 'tool_use',
            id: 'agent_1',
            name: 'Task',
            input: { subagent_type: 'general-purpose', prompt: 'do stuff' },
          }],
        },
      },
      // Progress with 2 tool_use blocks
      {
        type: 'progress',
        parentToolUseID: 'agent_1',
        data: {
          message: {
            message: {
              content: [
                { type: 'tool_use', id: 'sub_1', name: 'Read', input: {} },
                { type: 'text', text: 'reading...' },
                { type: 'tool_use', id: 'sub_2', name: 'Edit', input: {} },
              ],
            },
          },
        },
      },
      // Agent completes
      {
        timestamp: '2024-01-01T00:00:01Z',
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'agent_1',
            is_error: false,
          }],
        },
      },
    ]);

    const result = await parseTranscript(path);
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].subagentToolCount).toBe(2);
  });

  it('should accumulate tool counts from multiple progress entries for the same agent', async () => {
    const path = makeTempTranscript([
      {
        timestamp: '2024-01-01T00:00:00Z',
        message: {
          content: [{
            type: 'tool_use',
            id: 'agent_2',
            name: 'Task',
            input: { subagent_type: 'Explore', prompt: 'search' },
          }],
        },
      },
      // First progress: 1 tool
      {
        type: 'progress',
        parentToolUseID: 'agent_2',
        data: {
          message: {
            message: {
              content: [
                { type: 'tool_use', id: 's1', name: 'Grep', input: {} },
              ],
            },
          },
        },
      },
      // Second progress: 3 tools
      {
        type: 'progress',
        parentToolUseID: 'agent_2',
        data: {
          message: {
            message: {
              content: [
                { type: 'tool_use', id: 's2', name: 'Read', input: {} },
                { type: 'tool_use', id: 's3', name: 'Glob', input: {} },
                { type: 'tool_use', id: 's4', name: 'Read', input: {} },
              ],
            },
          },
        },
      },
      {
        timestamp: '2024-01-01T00:00:02Z',
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'agent_2',
            is_error: false,
          }],
        },
      },
    ]);

    const result = await parseTranscript(path);
    expect(result.agents[0].subagentToolCount).toBe(4); // 1 + 3
  });

  it('should skip progress entries with data.type (hook_progress etc.)', async () => {
    const path = makeTempTranscript([
      {
        timestamp: '2024-01-01T00:00:00Z',
        message: {
          content: [{
            type: 'tool_use',
            id: 'agent_3',
            name: 'Task',
            input: { subagent_type: 'general-purpose', prompt: 'work' },
          }],
        },
      },
      // hook_progress — should be skipped
      {
        type: 'progress',
        parentToolUseID: 'agent_3',
        data: {
          type: 'hook_progress',
          message: {
            message: {
              content: [
                { type: 'tool_use', id: 'h1', name: 'Bash', input: {} },
              ],
            },
          },
        },
      },
      // Real progress with 1 tool
      {
        type: 'progress',
        parentToolUseID: 'agent_3',
        data: {
          message: {
            message: {
              content: [
                { type: 'tool_use', id: 's1', name: 'Read', input: {} },
              ],
            },
          },
        },
      },
      {
        timestamp: '2024-01-01T00:00:01Z',
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'agent_3',
            is_error: false,
          }],
        },
      },
    ]);

    const result = await parseTranscript(path);
    expect(result.agents[0].subagentToolCount).toBe(1); // hook_progress skipped
  });

  it('should handle progress entries with empty or missing content', async () => {
    const path = makeTempTranscript([
      {
        timestamp: '2024-01-01T00:00:00Z',
        message: {
          content: [{
            type: 'tool_use',
            id: 'agent_4',
            name: 'Task',
            input: { subagent_type: 'Plan', prompt: 'plan' },
          }],
        },
      },
      // Progress with no content
      {
        type: 'progress',
        parentToolUseID: 'agent_4',
        data: {},
      },
      // Progress with empty content array
      {
        type: 'progress',
        parentToolUseID: 'agent_4',
        data: {
          message: {
            message: {
              content: [],
            },
          },
        },
      },
      // Progress with only text blocks (no tool_use)
      {
        type: 'progress',
        parentToolUseID: 'agent_4',
        data: {
          message: {
            message: {
              content: [
                { type: 'text', text: 'thinking...' },
              ],
            },
          },
        },
      },
      {
        timestamp: '2024-01-01T00:00:01Z',
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'agent_4',
            is_error: false,
          }],
        },
      },
    ]);

    const result = await parseTranscript(path);
    expect(result.agents[0].subagentToolCount).toBeUndefined();
  });

  it('should not assign subagentToolCount when no progress entries exist', async () => {
    const path = makeTempTranscript([
      {
        timestamp: '2024-01-01T00:00:00Z',
        message: {
          content: [{
            type: 'tool_use',
            id: 'agent_5',
            name: 'Task',
            input: { subagent_type: 'general-purpose', prompt: 'quick task' },
          }],
        },
      },
      {
        timestamp: '2024-01-01T00:00:01Z',
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'agent_5',
            is_error: false,
          }],
        },
      },
    ]);

    const result = await parseTranscript(path);
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].subagentToolCount).toBeUndefined();
  });
});
