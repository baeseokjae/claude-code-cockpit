/**
 * Extract Git status information
 */

import { execSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { GitStatus, FileStats, SubRepoStatus, WorktreeInfo } from '../types/index.js';
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

/**
 * Normalize SSH host alias to actual hostname
 * Handles SSH config aliases like:
 * - github.com-username → github.com
 * - github-work → github.com
 * - gitlab.com-personal → gitlab.com
 */
function normalizeHost(host: string): string {
  // Known git hosting services
  const knownHosts = ['github.com', 'gitlab.com', 'bitbucket.org'];

  for (const knownHost of knownHosts) {
    // Check if host contains the known host (e.g., github.com-seokjae)
    if (host.includes(knownHost.split('.')[0])) {
      return knownHost;
    }
  }

  return host;
}

/**
 * Convert git remote URL to HTTPS URL
 * git@github.com:user/repo.git → https://github.com/user/repo
 * git@github.com-alias:user/repo.git → https://github.com/user/repo
 * https://github.com/user/repo.git → https://github.com/user/repo
 */
function parseRemoteUrl(remoteUrl: string): string | null {
  try {
    // SSH format: git@github.com:user/repo.git
    const sshMatch = remoteUrl.match(/git@([^:]+):(.+?)(\.git)?$/);
    if (sshMatch) {
      const host = normalizeHost(sshMatch[1]);
      const path = sshMatch[2];
      return `https://${host}/${path}`;
    }

    // HTTPS format: https://github.com/user/repo.git
    const httpsMatch = remoteUrl.match(/https?:\/\/([^\/]+)\/(.+?)(\.git)?$/);
    if (httpsMatch) {
      const host = normalizeHost(httpsMatch[1]);
      const path = httpsMatch[2];
      return `https://${host}/${path}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse file stats from git status --porcelain output
 * Format: XY filename
 * X = staged status, Y = working tree status
 * 
 * Priority order (most significant change first):
 * 1. Renamed (R) - file was renamed
 * 2. Added (A) - new file added to index
 * 3. Deleted (D) - file deleted
 * 4. Modified (M) - existing file modified
 * 5. Untracked (??) - not tracked by git
 */
function parseFileStats(statusOutput: string): FileStats {
  const stats: FileStats = {
    modified: 0,
    added: 0,
    deleted: 0,
    renamed: 0,
    untracked: 0,
  };

  const lines = statusOutput.trim().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;

    const x = line[0]; // staged
    const y = line[1]; // working tree

    // Untracked files
    if (x === '?' && y === '?') {
      stats.untracked++;
      continue;
    }

    // Renamed files (priority: highest for staged changes)
    if (x === 'R') {
      stats.renamed++;
      continue;
    }

    // Added files (staged)
    if (x === 'A') {
      stats.added++;
      continue;
    }

    // Deleted files (staged or unstaged)
    if (x === 'D' || y === 'D') {
      stats.deleted++;
      continue;
    }

    // Modified files (staged or unstaged)
    if (x === 'M' || y === 'M') {
      stats.modified++;
      continue;
    }
  }

  return stats;
}

/**
 * Scan subdirectories for git repositories
 */
function scanSubRepos(basePath: string, depth: number, maxDepth: number): SubRepoStatus[] {
  if (depth >= maxDepth) return [];

  const subRepos: SubRepoStatus[] = [];

  try {
    const entries = readdirSync(basePath);

    for (const entry of entries) {
      // Skip hidden directories except .git
      if (entry.startsWith('.') && entry !== '.git') continue;

      const fullPath = join(basePath, entry);

      try {
        const stat = statSync(fullPath);
        if (!stat.isDirectory()) continue;

        // Check if this directory has a .git subdirectory
        const gitPath = join(fullPath, '.git');
        if (existsSync(gitPath)) {
          try {
            const branch = execGit('git rev-parse --abbrev-ref HEAD', fullPath).trim();
            const status = execGit('git status --porcelain', fullPath);
            const isDirty = status.trim().length > 0;

            subRepos.push({
              path: entry,
              branch,
              isDirty,
            });
          } catch {
            // Skip if git commands fail
          }
        } else if (depth + 1 < maxDepth) {
          // Recursively scan subdirectories
          const nested = scanSubRepos(fullPath, depth + 1, maxDepth);
          for (const sub of nested) {
            subRepos.push({
              ...sub,
              path: `${entry}/${sub.path}`,
            });
          }
        }
      } catch {
        // Skip entries that can't be accessed
      }
    }
  } catch {
    // Skip if base path can't be read
  }

  return subRepos;
}

function getLatestTag(cwd?: string): string | null {
  try {
    const tag = execGit('git describe --tags --abbrev=0', cwd).trim();
    return tag || null;
  } catch {
    return null;
  }
}

/**
 * Get list of git worktrees
 */
function getWorktrees(cwd?: string): WorktreeInfo[] {
  try {
    const output = execGit('git worktree list --porcelain', cwd);
    const worktrees: WorktreeInfo[] = [];

    // Parse porcelain output
    let currentWorktree: Partial<WorktreeInfo> = {};

    for (const line of output.split('\n')) {
      if (line.startsWith('worktree ')) {
        const path = line.substring(9).trim();
        currentWorktree.path = path;
      } else if (line.startsWith('branch ')) {
        const branch = line.substring(7).replace('refs/heads/', '').trim();
        currentWorktree.branch = branch;
      } else if (line.startsWith('HEAD ')) {
        const commit = line.substring(5).trim();
        currentWorktree.commit = commit;
      } else if (line === '') {
        // Empty line marks end of worktree entry
        if (currentWorktree.path && currentWorktree.branch && currentWorktree.commit) {
          // Check if worktree is dirty
          let isDirty = false;
          try {
            const status = execGit('git status --porcelain', currentWorktree.path);
            isDirty = status.trim().length > 0;
          } catch {
            isDirty = false;
          }

          worktrees.push({
            path: currentWorktree.path,
            branch: currentWorktree.branch,
            commit: currentWorktree.commit.substring(0, 8),
            isDirty,
            isMain: worktrees.length === 0, // First worktree is main
          });
        }
        currentWorktree = {};
      }
    }

    return worktrees;
  } catch {
    return [];
  }
}

export async function getGitStatus(cwd?: string, options?: { showAllBranches?: boolean; showAllBranchesDepth?: number; includeTag?: boolean; includeWorktrees?: boolean }): Promise<GitStatus | null> {
  try {
    const branch = execGit('git rev-parse --abbrev-ref HEAD', cwd).trim();

    const status = execGit('git status --porcelain', cwd);
    const isDirty = status.trim().length > 0;
    const fileStats = parseFileStats(status);
    
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

    // Get remote URL
    let remoteUrl: string | undefined;
    try {
      const rawRemoteUrl = execGit('git remote get-url origin', cwd).trim();
      const parsedUrl = parseRemoteUrl(rawRemoteUrl);
      if (parsedUrl) {
        remoteUrl = parsedUrl;
      }
    } catch {
      // No remote or other error - ignore
    }

    debug(`git status: branch=${branch}, dirty=${isDirty}, ahead=${ahead}, behind=${behind}, remoteUrl=${remoteUrl}, fileStats=${JSON.stringify(fileStats)}`);

    // Scan subdirectories if enabled
    let subRepos: SubRepoStatus[] | undefined;
    if (options?.showAllBranches && cwd) {
      const depth = options.showAllBranchesDepth || 2;
      subRepos = scanSubRepos(cwd, 0, depth);
      if (subRepos.length > 0) {
        debug(`found ${subRepos.length} sub-repositories`);
      }
    }

    // Get latest tag if enabled
    let tag: string | undefined;
    if (options?.includeTag) {
      const latestTag = getLatestTag(cwd);
      if (latestTag) {
        tag = latestTag;
        debug(`found tag: ${tag}`);
      }
    }

    // Get worktrees if enabled
    let worktrees: WorktreeInfo[] | undefined;
    if (options?.includeWorktrees) {
      const worktreeList = getWorktrees(cwd);
      if (worktreeList.length > 0) {
        worktrees = worktreeList;
        debug(`found ${worktrees.length} worktrees`);
      }
    }

    return {
      branch,
      isDirty,
      ahead,
      behind,
      remoteUrl,
      fileStats,
      subRepos,
      tag,
      worktrees,
    };
  } catch (error) {
    debug('failed to get git status:', error);
    return null;
  }
}
