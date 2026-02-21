/**
 * Theme helpers unit tests
 */

import { describe, it, expect } from 'vitest';
import {
  getPercentColor,
  applyTextTransform,
  getSessionName,
  formatContextHint,
  formatContextHintPlain,
} from '../src/themes/helpers.js';
import { AURORA_PALETTE } from '../src/themes/palettes/aurora.js';
import type { RenderContext, StdinData, TranscriptData } from '../src/types/index.js';
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
