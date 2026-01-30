/**
 * Extract Git status information
 */

import { execSync } from 'node:child_process';
import type { GitStatus } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('git');

function execGit(cmd: string, cwd?: string): string {
  try {
    const result = execSync(cmd, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return result;
  } catch {
    throw new Error('git command failed');
  }
}

export async function getGitStatus(cwd?: string): Promise<GitStatus | null> {
  try {
    const branch = execGit('git rev-parse --abbrev-ref HEAD', cwd).trim();

    const status = execGit('git status --porcelain', cwd);
    const isDirty = status.trim().length > 0;
    let ahead = 0;
    let behind = 0;

    try {
      const upstream = execGit(`git rev-parse --abbrev-ref ${branch}@{upstream}`, cwd).trim();
      const counts = execGit(`git rev-list --left-right --count ${branch}...${upstream}`, cwd).trim();
      const parts = counts.split(/\s+/);
      if (parts.length === 2) {
        ahead = parseInt(parts[0], 10) || 0;
        behind = parseInt(parts[1], 10) || 0;
      }
    } catch {
      // No upstream or other error - ignore
    }

    debug(`git status: branch=${branch}, dirty=${isDirty}, ahead=${ahead}, behind=${behind}`);

    return {
      branch,
      isDirty,
      ahead,
      behind,
    };
  } catch (error) {
    debug('failed to get git status:', error);
    return null;
  }
}
