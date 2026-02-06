/**
 * git-activity.test.ts
 * Git activity extraction tests
 */

import { describe, it, expect } from 'vitest';
import { extractGitActivity } from '../src/data/git-activity.js';
import type { ToolEntry } from '../src/types/index.js';

describe('extractGitActivity', () => {
  it('should count git commits', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'git commit -m "test commit"',
        status: 'completed',
        startTime: new Date(),
      },
      {
        id: '2',
        name: 'Bash',
        target: 'git commit -m "another commit"',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).not.toBeNull();
    expect(result?.commits).toBe(2);
    expect(result?.pullRequests).toBe(0);
  });

  it('should count PR creations with gh cli', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'gh pr create --title "feat: add feature"',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).not.toBeNull();
    expect(result?.commits).toBe(0);
    expect(result?.pullRequests).toBe(1);
  });

  it('should count PR creations with hub', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'hub pull-request -m "fix: bug fix"',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).not.toBeNull();
    expect(result?.commits).toBe(0);
    expect(result?.pullRequests).toBe(1);
  });

  it('should ignore git commit --amend', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'git commit --amend',
        status: 'completed',
        startTime: new Date(),
      },
      {
        id: '2',
        name: 'Bash',
        target: 'git commit --amend --no-edit',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).toBeNull();
  });

  it('should be case-insensitive', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'GIT COMMIT -m "test"',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).not.toBeNull();
    expect(result?.commits).toBe(1);
  });

  it('should count mixed activity', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'git commit -m "feat: new feature"',
        status: 'completed',
        startTime: new Date(),
      },
      {
        id: '2',
        name: 'Bash',
        target: 'gh pr create --title "PR for feature"',
        status: 'completed',
        startTime: new Date(),
      },
      {
        id: '3',
        name: 'Bash',
        target: 'git commit -m "fix: typo"',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).not.toBeNull();
    expect(result?.commits).toBe(2);
    expect(result?.pullRequests).toBe(1);
  });

  it('should ignore non-bash tools', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Read',
        target: '/path/to/file.ts',
        status: 'completed',
        startTime: new Date(),
      },
      {
        id: '2',
        name: 'Edit',
        target: '/path/to/file.ts',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).toBeNull();
  });

  it('should return null when no activity found', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: 'npm install',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).toBeNull();
  });

  it('should handle empty tools array', () => {
    const result = extractGitActivity([]);
    expect(result).toBeNull();
  });

  it('should handle tools with empty target', () => {
    const tools: ToolEntry[] = [
      {
        id: '1',
        name: 'Bash',
        target: '',
        status: 'completed',
        startTime: new Date(),
      },
      {
        id: '2',
        name: 'Bash',
        status: 'completed',
        startTime: new Date(),
      },
    ];

    const result = extractGitActivity(tools);
    expect(result).toBeNull();
  });
});
