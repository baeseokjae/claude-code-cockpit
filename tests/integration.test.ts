/**
 * integration.test.ts
 * 통합 테스트 - 전체 렌더링 파이프라인 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main, type MainDeps } from '../src/index.js';
import type { StdinData, CockpitConfig, TranscriptData, GitStatus } from '../src/types/index.js';
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
      checkAlerts: vi.fn(),
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
    (mockDeps.checkAlerts as any).mockReturnValue([]);
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

  it('should include alerts in output when present', async () => {
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
    (mockDeps.checkAlerts as any).mockReturnValue([
      {
        type: 'context_critical',
        severity: 'critical',
        message: 'Context at 95%',
        shortMessage: 'CTX 95%!',
      },
    ]);
    (mockDeps.loadConfig as any).mockReturnValue(DEFAULT_CONFIG);
    (mockDeps.loadTheme as any).mockReturnValue(auroraTheme);

    await main(mockDeps);

    expect(capturedOutput.length).toBeGreaterThan(0);
    const fullOutput = capturedOutput.join('\n');
    // Should contain the alert badge
    expect(fullOutput).toContain('CTX 95%!');
  });

  it('should render tool activity', async () => {
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
    (mockDeps.checkAlerts as any).mockReturnValue([]);
    (mockDeps.loadConfig as any).mockReturnValue(DEFAULT_CONFIG);
    (mockDeps.loadTheme as any).mockReturnValue(auroraTheme);

    await main(mockDeps);

    expect(capturedOutput.length).toBeGreaterThan(0);
    const fullOutput = capturedOutput.join('\n');
    expect(fullOutput).toContain('Read');
    expect(fullOutput).toContain('Edit');
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
      extraLabel: null,
      sessionDuration: '1m',
      theme: auroraTheme,
      detailMode: false,
      alerts: [],
    };

    const lines = auroraTheme.render(ctx);

    expect(lines.length).toBeGreaterThan(0);
    // Should contain ANSI escape codes
    expect(lines[0]).toMatch(/\x1b\[/);
  });
});
