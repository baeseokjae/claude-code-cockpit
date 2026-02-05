/**
 * Git tag tests
 */

import { describe, it, expect } from 'vitest';
import { getGitStatus } from '../src/data/git.js';

describe('getGitStatus with tag', () => {
  it('should include tag when includeTag option is true', async () => {
    const result = await getGitStatus(process.cwd(), {
      includeTag: true,
    });

    if (result) {
      // Tag may or may not exist depending on the repo state
      expect(result).toHaveProperty('tag');

      // If tag exists, it should be a string
      if (result.tag) {
        expect(typeof result.tag).toBe('string');
        expect(result.tag.length).toBeGreaterThan(0);
      }
    }
  });

  it('should not include tag when includeTag option is false', async () => {
    const result = await getGitStatus(process.cwd(), {
      includeTag: false,
    });

    if (result) {
      expect(result.tag).toBeUndefined();
    }
  });

  it('should not include tag when includeTag option is not provided', async () => {
    const result = await getGitStatus(process.cwd());

    if (result) {
      expect(result.tag).toBeUndefined();
    }
  });
});
