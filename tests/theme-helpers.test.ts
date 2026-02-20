/**
 * Theme helpers unit tests
 */

import { describe, it, expect } from 'vitest';
import {
  getPercentColor,
  applyTextTransform,
  aggregateToolCounts,
  aggregateTodos,
  getSessionName,
  extractProjectGitData,
  formatContextHint,
  formatContextHintPlain,
} from '../src/themes/helpers.js';
import { AURORA_PALETTE } from '../src/themes/palettes/aurora.js';
import type { RenderContext, StdinData, TranscriptData, GitStatus } from '../src/types/index.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';

describe('theme helpers', () => {
  describe('getPercentColor', () => {
    it('should return progressCritical for >= 90%', () => {
      expect(getPercentColor(95, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressCritical);
      expect(getPercentColor(90, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressCritical);
    });

    it('should return progressHigh for >= 75%', () => {
      expect(getPercentColor(75, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressHigh);
      expect(getPercentColor(89, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressHigh);
    });

    it('should return progressMid for >= 50%', () => {
      expect(getPercentColor(50, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressMid);
      expect(getPercentColor(74, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressMid);
    });

    it('should return progressLow for < 50%', () => {
      expect(getPercentColor(49, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressLow);
      expect(getPercentColor(0, AURORA_PALETTE)).toBe(AURORA_PALETTE.progressLow);
    });

    it('should return text color for null', () => {
      expect(getPercentColor(null, AURORA_PALETTE)).toBe(AURORA_PALETTE.text);
    });
  });

  describe('applyTextTransform', () => {
    it('should handle upper case', () => {
      expect(applyTextTransform('hello', { case: 'upper' })).toBe('HELLO');
    });

    it('should handle lower case', () => {
      expect(applyTextTransform('HELLO', { case: 'lower' })).toBe('hello');
    });

    it('should handle none', () => {
      expect(applyTextTransform('Hello', { case: 'none' })).toBe('Hello');
    });
  });

  describe('getSessionName', () => {
    it('should return plan_name if showSessionName is true', () => {
      const ctx = createMockContext({}, { showSessionName: true });
      ctx.stdin.plan_name = 'my-plan';
      expect(getSessionName(ctx)).toBe('my-plan');
    });

    it('should return session_id substring if no plan_name', () => {
      const ctx = createMockContext({}, { showSessionName: true });
      ctx.stdin.session_id = 'abc123def456';
      expect(getSessionName(ctx)).toBe('abc123de');
    });

    it('should return null if showSessionName is false', () => {
      const ctx = createMockContext({}, { showSessionName: false });
      ctx.stdin.plan_name = 'my-plan';
      expect(getSessionName(ctx)).toBe(null);
    });
  });

  describe('aggregateToolCounts', () => {
    it('should count tools correctly', () => {
      const ctx = createMockContext({
        tools: [
          { id: '1', name: 'Read', status: 'completed' },
          { id: '2', name: 'Read', status: 'completed' },
          { id: '3', name: 'Edit', status: 'running' },
        ],
      });

      const result = aggregateToolCounts(ctx);

      expect(result.counts.get('Read')).toBe(2);
      expect(result.counts.get('Edit')).toBe(1);
      expect(result.runningTool).toBe('Edit');
      expect(result.total).toBe(3);
    });

    it('should handle empty tools', () => {
      const ctx = createMockContext({ tools: [] });
      const result = aggregateToolCounts(ctx);

      expect(result.counts.size).toBe(0);
      expect(result.runningTool).toBe(null);
      expect(result.total).toBe(0);
    });
  });

  describe('aggregateTodos', () => {
    it('should summarize todos correctly', () => {
      const ctx = createMockContext({
        todos: [
          { id: '1', content: 'Task 1', status: 'completed', activeForm: 'Task 1' },
          { id: '2', content: 'Task 2', status: 'in_progress', activeForm: 'Task 2' },
          { id: '3', content: 'Task 3', status: 'pending', activeForm: 'Task 3' },
        ],
      });

      const result = aggregateTodos(ctx);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(1);
      expect(result.inProgress?.content).toBe('Task 2');
    });

    it('should handle no in_progress todo', () => {
      const ctx = createMockContext({
        todos: [
          { id: '1', content: 'Task 1', status: 'completed', activeForm: 'Task 1' },
          { id: '2', content: 'Task 2', status: 'pending', activeForm: 'Task 2' },
        ],
      });

      const result = aggregateTodos(ctx);

      expect(result.total).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.inProgress).toBe(null);
    });
  });

  describe('extractProjectGitData', () => {
    it('should extract project and git data', () => {
      const ctx = createMockContext({});
      ctx.stdin.cwd = '/Users/patrick/project';
      ctx.gitStatus = {
        branch: 'main',
        isDirty: true,
        remoteUrl: 'https://github.com/user/repo',
        ahead: 0,
        behind: 0,
        fileStats: { modified: 0, added: 0, deleted: 0, untracked: 0 },
        subRepos: [
          { path: 'sub1', branch: 'dev', isDirty: false },
        ],
      };

      const result = extractProjectGitData(ctx);

      expect(result.project).toBe('project');
      expect(result.projectUrl).toBe('file:///Users/patrick/project');
      expect(result.branch).toBe('main');
      expect(result.branchUrl).toContain('github.com');
      expect(result.dirty).toBe(true);
      expect(result.subRepos).toHaveLength(1);
    });

    it('should handle no git status', () => {
      const ctx = createMockContext({});
      ctx.stdin.cwd = '/Users/patrick/project';
      ctx.gitStatus = null;

      const result = extractProjectGitData(ctx);

      expect(result.project).toBe('project');
      expect(result.branch).toBe(null);
      expect(result.dirty).toBe(false);
      expect(result.subRepos).toHaveLength(0);
    });
  });

  describe('formatContextHint', () => {
    it('should return null below 90%', () => {
      expect(formatContextHint(89, AURORA_PALETTE)).toBeNull();
      expect(formatContextHint(50, AURORA_PALETTE)).toBeNull();
      expect(formatContextHint(0, AURORA_PALETTE)).toBeNull();
    });

    it('should return hint at 90%+', () => {
      const hint = formatContextHint(90, AURORA_PALETTE);
      expect(hint).not.toBeNull();
      expect(hint).toContain('/compact');
    });

    it('should return hint at 95%', () => {
      const hint = formatContextHint(95, AURORA_PALETTE);
      expect(hint).not.toBeNull();
      expect(hint).toContain('/compact');
    });

    it('should return null for null percent', () => {
      expect(formatContextHint(null, AURORA_PALETTE)).toBeNull();
    });
  });

  describe('formatContextHintPlain', () => {
    it('should return null below 90%', () => {
      expect(formatContextHintPlain(89)).toBeNull();
    });

    it('should return hint at 90%+', () => {
      const hint = formatContextHintPlain(90);
      expect(hint).not.toBeNull();
      expect(hint).toContain('/compact');
    });

    it('should return null for null percent', () => {
      expect(formatContextHintPlain(null)).toBeNull();
    });
  });
});

// Helper to create mock context
function createMockContext(
  transcript: Partial<TranscriptData>,
  displayOverrides?: Partial<typeof DEFAULT_CONFIG.display>
): RenderContext {
  return {
    stdin: {
      model: { display_name: 'Test' },
      cwd: null,
      plan_name: null,
      session_id: null,
    } as StdinData,
    transcript: {
      tools: [],
      agents: [],
      todos: [],
      skills: [],
      ...transcript,
    },
    config: {
      ...DEFAULT_CONFIG,
      display: {
        ...DEFAULT_CONFIG.display,
        ...displayOverrides,
      },
    },
    configCounts: { claudeMdCount: 0, rulesCount: 0, mcpCount: 0, hooksCount: 0 },
    gitStatus: null,
    usageData: null,
    tokenSpeed: null,
    sessionDuration: '1m',
    theme: {} as any,
    detailMode: false,
    tier: 3,
  };
}
