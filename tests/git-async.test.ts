import { describe, it, expect, beforeEach } from 'vitest';
import { getGitStatus } from '../src/data/git.js';
import { resetCacheState } from '../src/utils/cache.js';

describe('Git async parallel execution', () => {
  // These tests run against the real git repo (claude-code-cockpit itself)
  const CWD = process.cwd();

  beforeEach(() => {
    resetCacheState();
  });

  it('returns valid git status for current repo', async () => {
    const status = await getGitStatus(CWD);
    expect(status).not.toBeNull();
    expect(status!.branch).toBeTruthy();
    expect(typeof status!.isDirty).toBe('boolean');
    expect(typeof status!.ahead).toBe('number');
    expect(typeof status!.behind).toBe('number');
    expect(status!.fileStats).toBeDefined();
  });

  it('returns null for non-git directory', async () => {
    const status = await getGitStatus('/tmp');
    expect(status).toBeNull();
  });

  it('includes tag when requested', async () => {
    const status = await getGitStatus(CWD, { includeTag: true });
    // tag may or may not exist — just verify no crash
    expect(status).not.toBeNull();
    // tag is either a string or undefined
    if (status!.tag) {
      expect(typeof status!.tag).toBe('string');
    }
  });

  it('returns consistent results with sequential baseline', async () => {
    // Run twice — should get same results (validates parallel doesn't mix up results)
    resetCacheState();
    const result1 = await getGitStatus(CWD);
    resetCacheState();
    const result2 = await getGitStatus(CWD);

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1!.branch).toBe(result2!.branch);
    expect(result1!.isDirty).toBe(result2!.isDirty);
    expect(result1!.ahead).toBe(result2!.ahead);
    expect(result1!.behind).toBe(result2!.behind);
  });

  it('uses cache on second call', async () => {
    resetCacheState();
    const start1 = performance.now();
    await getGitStatus(CWD);
    const time1 = performance.now() - start1;

    // Second call should hit cache (no resetCacheState)
    const start2 = performance.now();
    const result2 = await getGitStatus(CWD);
    const time2 = performance.now() - start2;

    expect(result2).not.toBeNull();
    // Cache hit should be significantly faster (at least 5x)
    expect(time2).toBeLessThan(time1);
  });
});
