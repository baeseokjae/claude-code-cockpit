/**
 * integration.test.ts
 * 통합 테스트 - 전체 렌더링 파이프라인 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main, type MainDeps } from '../src/index.js';
import type { StdinData, CockpitConfig, TranscriptData, GitStatus } from '../src/types/index.js';
import { calculateTokenSpeed, formatTokenSpeed, type TokenSpeed } from '../src/data/speed-tracker.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { auroraTheme } from '../src/themes/aurora.js';

describe('main integration', () => {
  let mockDeps: MainDeps;
  let capturedOutput: string[];

  beforeEach(() => {
    capturedOutput = [];
    mockDeps = {
      readStdin: vi.fn(),
      parseTranscript: vi.fn(),
      countConfigs: vi.fn(),
      getGitStatus: vi.fn(),
      fetchUsage: vi.fn(),
      loadConfig: vi.fn(),
      loadTheme: vi.fn(),
      parseExtraCmdArg: vi.fn(),
      writeOutput: vi.fn((lines: string[]) => {
        capturedOutput = lines;
      }),
      now: () => Date.now(),
    };
  });

  it('should render basic output with minimal data', async () => {
    const stdin: StdinData = {
      model: { display_name: 'Sonnet' },
      cwd: '/Users/test/my-project',
      context_window: {
        context_window_size: 200000,
        current_usage: { input_tokens: 50000, output_tokens: 10000 },
      },
      cost: { total_duration_ms: 300000 },
    };

    const transcript: TranscriptData = {
      tools: [],
      agents: [],
      todos: [],
      skills: [],
    };

    const gitStatus: GitStatus = {
      branch: 'main',
      isDirty: false,
    };

    (mockDeps.readStdin as any).mockResolvedValue(stdin);
    (mockDeps.parseTranscript as any).mockResolvedValue(transcript);
    (mockDeps.countConfigs as any).mockReturnValue({
      claudeMdCount: 1,
      rulesCount: 0,
      mcpCount: 2,
      hooksCount: 0,
    });
    (mockDeps.getGitStatus as any).mockResolvedValue(gitStatus);
    (mockDeps.fetchUsage as any).mockResolvedValue(null);
    (mockDeps.loadConfig as any).mockReturnValue(DEFAULT_CONFIG);
    (mockDeps.loadTheme as any).mockReturnValue(auroraTheme);

    await main(mockDeps);

    expect(capturedOutput.length).toBeGreaterThan(0);
    // Output should contain model name and percentage
    const fullOutput = capturedOutput.join('\n');
    expect(fullOutput).toContain('Sonnet');
    expect(fullOutput).toMatch(/\d+%/); // percentage
  });

  it('should handle null stdin gracefully', async () => {
    (mockDeps.readStdin as any).mockResolvedValue(null);

    await main(mockDeps);

    expect(mockDeps.writeOutput).not.toHaveBeenCalled();
  });

  it('should handle high context usage', async () => {
    const stdin: StdinData = {
      model: { display_name: 'Opus' },
      cwd: '/test',
      context_window: {
        context_window_size: 100000,
        current_usage: { input_tokens: 95000, output_tokens: 0 },
      },
    };

    const transcript: TranscriptData = {
      tools: [],
      agents: [],
      todos: [],
      skills: [],
    };

    (mockDeps.readStdin as any).mockResolvedValue(stdin);
    (mockDeps.parseTranscript as any).mockResolvedValue(transcript);
    (mockDeps.countConfigs as any).mockReturnValue({
      claudeMdCount: 0,
      rulesCount: 0,
      mcpCount: 0,
      hooksCount: 0,
    });
    (mockDeps.getGitStatus as any).mockResolvedValue(null);
    (mockDeps.fetchUsage as any).mockResolvedValue(null);
    (mockDeps.loadConfig as any).mockReturnValue(DEFAULT_CONFIG);
    (mockDeps.loadTheme as any).mockReturnValue(auroraTheme);

    await main(mockDeps);

    expect(capturedOutput.length).toBeGreaterThan(0);
    const fullOutput = capturedOutput.join('\n');
    // Should contain high percentage
    expect(fullOutput).toMatch(/95%/);
  });

  it('should render tool activity', async () => {
    // Effective width must reach compactWidth (80): 80 / 0.6 = 134
    const savedColumns = process.env.COLUMNS;
    process.env.COLUMNS = '140';

    const stdin: StdinData = {
      model: { display_name: 'Sonnet' },
      cwd: '/test',
    };

    const transcript: TranscriptData = {
      tools: [
        { id: '1', name: 'Read', status: 'completed' },
        { id: '2', name: 'Read', status: 'completed' },
        { id: '3', name: 'Edit', status: 'running' },
      ],
      agents: [],
      todos: [],
      skills: [],
    };

    (mockDeps.readStdin as any).mockResolvedValue(stdin);
    (mockDeps.parseTranscript as any).mockResolvedValue(transcript);
    (mockDeps.countConfigs as any).mockReturnValue({
      claudeMdCount: 0,
      rulesCount: 0,
      mcpCount: 0,
      hooksCount: 0,
    });
    (mockDeps.getGitStatus as any).mockResolvedValue(null);
    (mockDeps.fetchUsage as any).mockResolvedValue(null);
    (mockDeps.loadConfig as any).mockReturnValue(DEFAULT_CONFIG);
    (mockDeps.loadTheme as any).mockReturnValue(auroraTheme);

    await main(mockDeps);

    expect(capturedOutput.length).toBeGreaterThan(0);
    const fullOutput = capturedOutput.join('\n');
    expect(fullOutput).toContain('Read');
    expect(fullOutput).toContain('Edit');

    if (savedColumns === undefined) delete process.env.COLUMNS;
    else process.env.COLUMNS = savedColumns;
  });

  it('should handle errors gracefully without throwing', async () => {
    (mockDeps.readStdin as any).mockRejectedValue(new Error('stdin error'));

    // Should not throw
    await expect(main(mockDeps)).resolves.not.toThrow();
  });
});

describe('theme rendering', () => {
  it('aurora theme should produce valid ANSI output', () => {
    const ctx = {
      stdin: {
        model: { display_name: 'Sonnet' },
        cwd: '/test/project',
        context_window: {
          context_window_size: 200000,
          current_usage: { input_tokens: 100000, output_tokens: 0 },
        },
        cost: { total_duration_ms: 60000 },
      } as StdinData,
      transcript: {
        tools: [],
        agents: [],
        todos: [],
        skills: [],
      } as TranscriptData,
      config: DEFAULT_CONFIG,
      configCounts: { claudeMdCount: 0, rulesCount: 0, mcpCount: 0, hooksCount: 0 },
      gitStatus: { branch: 'main', isDirty: true } as GitStatus,
      usageData: null,
      tokenSpeed: null,
      sessionDuration: '1m',
      theme: auroraTheme,
      detailMode: false,
      tier: 3,
    };

    const lines = auroraTheme.renderFull(ctx);

    expect(lines.length).toBeGreaterThan(0);
    // Should contain ANSI escape codes
    expect(lines[0]).toMatch(/\x1b\[/);
  });
});

describe('speed-tracker', () => {
  describe('calculateTokenSpeed', () => {
    it('should calculate token speed correctly', () => {
      const stdin: StdinData = {
        model: { display_name: 'Sonnet' },
        context_window: {
          context_window_size: 200000,
          current_usage: {
            input_tokens: 50000,
            output_tokens: 10000,
          },
        },
        cost: {
          total_duration_ms: 60000, // 60 seconds
        },
      };

      const speed = calculateTokenSpeed(stdin);

      expect(speed).not.toBeNull();
      expect(speed!.outputTokensPerSecond).toBeCloseTo(166.67, 1); // 10000 / 60
      expect(speed!.inputTokensPerSecond).toBeCloseTo(833.33, 1); // 50000 / 60
      expect(speed!.totalTokensPerSecond).toBeCloseTo(1000, 1); // 60000 / 60
    });

    it('should include cache tokens in input calculation', () => {
      const stdin: StdinData = {
        model: { display_name: 'Sonnet' },
        context_window: {
          context_window_size: 200000,
          current_usage: {
            input_tokens: 10000,
            output_tokens: 5000,
            cache_creation_input_tokens: 20000,
            cache_read_input_tokens: 30000,
          },
        },
        cost: {
          total_duration_ms: 60000,
        },
      };

      const speed = calculateTokenSpeed(stdin);

      expect(speed).not.toBeNull();
      // Input = 10000 + 20000 + 30000 = 60000
      expect(speed!.inputTokensPerSecond).toBeCloseTo(1000, 1); // 60000 / 60
    });

    it('should return null when missing usage data', () => {
      const stdin: StdinData = {
        model: { display_name: 'Sonnet' },
        cost: { total_duration_ms: 60000 },
      };

      const speed = calculateTokenSpeed(stdin);

      expect(speed).toBeNull();
    });

    it('should return null when missing duration', () => {
      const stdin: StdinData = {
        model: { display_name: 'Sonnet' },
        context_window: {
          context_window_size: 200000,
          current_usage: { input_tokens: 50000, output_tokens: 10000 },
        },
      };

      const speed = calculateTokenSpeed(stdin);

      expect(speed).toBeNull();
    });

    it('should return null when duration is zero', () => {
      const stdin: StdinData = {
        model: { display_name: 'Sonnet' },
        context_window: {
          context_window_size: 200000,
          current_usage: { input_tokens: 50000, output_tokens: 10000 },
        },
        cost: { total_duration_ms: 0 },
      };

      const speed = calculateTokenSpeed(stdin);

      expect(speed).toBeNull();
    });
  });

  describe('formatTokenSpeed', () => {
    it('should format output speed correctly', () => {
      const speed: TokenSpeed = {
        outputTokensPerSecond: 166.67,
        inputTokensPerSecond: 833.33,
        totalTokensPerSecond: 1000,
      };

      expect(formatTokenSpeed(speed, 'output')).toBe('167 tok/s');
      expect(formatTokenSpeed(speed, 'input')).toBe('833 tok/s');
      expect(formatTokenSpeed(speed, 'total')).toBe('1000 tok/s');
    });

    it('should format low speeds with decimal', () => {
      const speed: TokenSpeed = {
        outputTokensPerSecond: 5.5,
        inputTokensPerSecond: 8.2,
        totalTokensPerSecond: 13.7,
      };

      expect(formatTokenSpeed(speed, 'output')).toBe('5.5 tok/s');
      expect(formatTokenSpeed(speed, 'input')).toBe('8.2 tok/s');
    });

    it('should return empty string for null speed', () => {
      expect(formatTokenSpeed(null)).toBe('');
    });

    it('should return 0 tok/s for very low speeds', () => {
      const speed: TokenSpeed = {
        outputTokensPerSecond: 0.5,
        inputTokensPerSecond: 0.3,
        totalTokensPerSecond: 0.8,
      };

      expect(formatTokenSpeed(speed, 'output')).toBe('0 tok/s');
    });

    it('should default to output mode', () => {
      const speed: TokenSpeed = {
        outputTokensPerSecond: 100,
        inputTokensPerSecond: 200,
        totalTokensPerSecond: 300,
      };

      expect(formatTokenSpeed(speed)).toBe('100 tok/s');
    });
  });
});
