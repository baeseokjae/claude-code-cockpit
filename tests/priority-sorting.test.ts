/**
 * Tests for priority-based widget sorting
 */

import { describe, it, expect } from 'vitest';
import { collectActivityWidgets, type ActivityWidget } from '../src/themes/helpers.js';
import type { RenderContext } from '../src/types/index.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';

function createMockContext(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    config: DEFAULT_CONFIG,
    stdin: { model: 'claude-3-5-sonnet', budget: { tokens: 100000, usd: 1.0 }, cwd: '/test' },
    transcript: {
      messages: [],
      tools: [],
      agents: [],
      todos: [],
      skills: [],
      usage: { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 },
    },
    git: null,
    startTime: Date.now(),
    ...overrides,
  } as RenderContext;
}

describe('Priority-based widget sorting', () => {
  it('should assign all widgets a priority field', () => {
    const ctx = createMockContext({
      config: {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showGitActivity: true,
          showTestCoverage: true,
        },
      },
    });

    const widgets = collectActivityWidgets(
      ctx,
      { fg: '#fff', bg: '#000', blue: '#00f', green: '#0f0', red: '#f00', yellow: '#ff0', mauve: '#f0f', muted: '#888' },
      { error: '✗', warning: '⚠', info: 'ℹ', success: '✓', pending: '○' }
    );

    // 모든 위젯이 priority 필드를 가져야 함
    widgets.forEach(widget => {
      expect(widget).toHaveProperty('priority');
      expect(typeof widget.priority).toBe('number');
      expect(widget.priority).toBeGreaterThanOrEqual(0);
      expect(widget.priority).toBeLessThanOrEqual(99);
    });
  });

  it('should assign priority 0 to bashErrors when errors exist', () => {
    const ctx = createMockContext({
      bashErrors: [{ command: 'test', error: 'error', exitCode: 1, timestamp: 0 }],
    });

    const widgets = collectActivityWidgets(
      ctx,
      { fg: '#fff', bg: '#000', blue: '#00f', green: '#0f0', red: '#f00', yellow: '#ff0', mauve: '#f0f', muted: '#888' },
      { error: '✗', warning: '⚠', info: 'ℹ', success: '✓', pending: '○' }
    );

    const bashErrorWidget = widgets.find(w => w.category === 'critical');
    expect(bashErrorWidget?.priority).toBe(0);
  });

  it('should assign priority 5 to violations with secrets', () => {
    const ctx = createMockContext({
      violations: {
        total: 2,
        byType: new Map([['hardcoded_secret', 1], ['other', 1]]),
        byFile: new Map(),
      },
    });

    const widgets = collectActivityWidgets(
      ctx,
      { fg: '#fff', bg: '#000', blue: '#00f', green: '#0f0', red: '#f00', yellow: '#ff0', mauve: '#f0f', muted: '#888' },
      { error: '✗', warning: '⚠', info: 'ℹ', success: '✓', pending: '○' }
    );

    const violationWidget = widgets.find(w => w.category === 'critical');
    expect(violationWidget?.priority).toBe(5);
  });

  it('should assign priority 15 to violations without secrets', () => {
    const ctx = createMockContext({
      violations: {
        total: 1,
        byType: new Map([['other', 1]]),
        byFile: new Map(),
      },
    });

    const widgets = collectActivityWidgets(
      ctx,
      { fg: '#fff', bg: '#000', blue: '#00f', green: '#0f0', red: '#f00', yellow: '#ff0', mauve: '#f0f', muted: '#888' },
      { error: '✗', warning: '⚠', info: 'ℹ', success: '✓', pending: '○' }
    );

    const violationWidget = widgets.find(w => w.category === 'critical');
    expect(violationWidget?.priority).toBe(15);
  });

  it('should boost instanceSync priority to 35 when conflicts exist', () => {
    const ctx = createMockContext({
      instanceSync: {
        lastSync: Date.now(),
        instanceId: 'test-instance',
        conflictCount: 3,
        isTeamMode: false,
        hasMultipleInstances: true,
        instanceCount: 2,
        hasActiveTeam: false,
      },
      config: {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showInstanceSync: true,
        },
      },
    });

    const widgets = collectActivityWidgets(
      ctx,
      { fg: '#fff', bg: '#000', blue: '#00f', green: '#0f0', red: '#f00', yellow: '#ff0', mauve: '#f0f', muted: '#888', teal: '#0ff' },
      { error: '✗', warning: '⚠', info: 'ℹ', success: '✓', pending: '○' }
    );

    const instanceSyncWidget = widgets.find(w => w.category === 'analytics');
    expect(instanceSyncWidget?.priority).toBe(35);
  });

  it('should assign priority 95 to instanceSync when no conflicts', () => {
    const ctx = createMockContext({
      instanceSync: {
        lastSync: Date.now(),
        instanceId: 'test-instance',
        conflictCount: 0,
        isTeamMode: false,
        hasMultipleInstances: true,
        instanceCount: 2,
        hasActiveTeam: false,
      },
      config: {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showInstanceSync: true,
        },
      },
    });

    const widgets = collectActivityWidgets(
      ctx,
      { fg: '#fff', bg: '#000', blue: '#00f', green: '#0f0', red: '#f00', yellow: '#ff0', mauve: '#f0f', muted: '#888', teal: '#0ff' },
      { error: '✗', warning: '⚠', info: 'ℹ', success: '✓', pending: '○' }
    );

    const instanceSyncWidget = widgets.find(w => w.category === 'analytics');
    expect(instanceSyncWidget?.priority).toBe(95);
  });

  it('should maintain ascending priority order', () => {
    const ctx = createMockContext({
      bashErrors: [{ command: 'test', error: 'error', exitCode: 1, timestamp: 0 }],
      violations: {
        total: 1,
        byType: new Map([['hardcoded_secret', 1]]),
        byFile: new Map(),
      },
      config: {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showGitActivity: true,
          showToolStats: true,
          showTestCoverage: true,
          showLearningTracker: true,
        },
      },
    });

    const widgets = collectActivityWidgets(
      ctx,
      { fg: '#fff', bg: '#000', blue: '#00f', green: '#0f0', red: '#f00', yellow: '#ff0', mauve: '#f0f', muted: '#888' },
      { error: '✗', warning: '⚠', info: 'ℹ', success: '✓', pending: '○' }
    );

    // 위젯이 priority 오름차순으로 정렬되어 있는지 확인
    for (let i = 1; i < widgets.length; i++) {
      expect(widgets[i].priority).toBeGreaterThanOrEqual(widgets[i - 1].priority);
    }
  });
});
