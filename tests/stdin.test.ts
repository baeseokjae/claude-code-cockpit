/**
 * stdin.test.ts
 * stdin 파싱 테스트
 */

import { describe, it, expect } from 'vitest';
import { getModelName, getContextPercent, getCwd } from '../src/input/stdin.js';
import type { StdinData } from '../src/types/index.js';

describe('getModelName', () => {
  it('should return display_name when available', () => {
    const stdin: StdinData = {
      model: { display_name: 'Claude Opus 4' },
    };
    expect(getModelName(stdin)).toBe('Claude Opus 4');
  });

  it('should return Unknown when display_name is missing', () => {
    const stdin: StdinData = {};
    expect(getModelName(stdin)).toBe('Unknown');
  });

  it('should return Unknown when model is null', () => {
    const stdin: StdinData = { model: null as any };
    expect(getModelName(stdin)).toBe('Unknown');
  });
});

describe('getContextPercent', () => {
  it('should return used_percentage when available', () => {
    const stdin: StdinData = {
      context_window: {
        used_percentage: 45.5,
        context_window_size: 200000,
      },
    };
    expect(getContextPercent(stdin)).toBe(45.5);
  });

  it('should calculate percentage from tokens', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 200000,
        current_usage: {
          input_tokens: 50000,
          output_tokens: 10000,
        },
      },
    };
    expect(getContextPercent(stdin)).toBe(30); // (50000 + 10000) / 200000 * 100
  });

  it('should include cache tokens in calculation', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 100000,
        current_usage: {
          input_tokens: 10000,
          cache_creation_input_tokens: 5000,
          cache_read_input_tokens: 3000,
          output_tokens: 2000,
        },
      },
    };
    expect(getContextPercent(stdin)).toBe(20); // (10000 + 5000 + 3000 + 2000) / 100000 * 100
  });

  it('should return null when context_window is missing', () => {
    const stdin: StdinData = {};
    expect(getContextPercent(stdin)).toBeNull();
  });

  it('should return null when current_usage is missing', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 200000,
      },
    };
    expect(getContextPercent(stdin)).toBeNull();
  });
});

describe('getCwd', () => {
  it('should return cwd when available', () => {
    const stdin: StdinData = {
      cwd: '/Users/test/project',
    };
    expect(getCwd(stdin)).toBe('/Users/test/project');
  });

  it('should fallback to workspace.current_dir', () => {
    const stdin: StdinData = {
      workspace: {
        current_dir: '/Users/test/workspace',
      },
    };
    expect(getCwd(stdin)).toBe('/Users/test/workspace');
  });

  it('should fallback to workspace.project_dir', () => {
    const stdin: StdinData = {
      workspace: {
        project_dir: '/Users/test/project-dir',
      },
    };
    expect(getCwd(stdin)).toBe('/Users/test/project-dir');
  });

  it('should return null when no cwd is available', () => {
    const stdin: StdinData = {};
    expect(getCwd(stdin)).toBeNull();
  });
});
