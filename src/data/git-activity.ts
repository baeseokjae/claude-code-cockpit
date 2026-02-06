/**
 * Extract git activity (commits and PRs) from bash tool invocations
 */

import type { ToolEntry, GitActivity } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('git-activity');

export function extractGitActivity(tools: ToolEntry[]): GitActivity | null {
  try {
    let commits = 0;
    let pullRequests = 0;

    const bashTools = tools.filter((t) => t.name === 'Bash');
    debug(`analyzing ${bashTools.length} bash tools`);

    for (const tool of bashTools) {
      const cmd = (tool.target?.toLowerCase() || '').trim();
      if (!cmd) continue;

      // Detect git commits (excluding amends)
      if (cmd.includes('git commit') && !cmd.includes('--amend')) {
        commits++;
        debug(`found commit: ${tool.target}`);
      }

      // Detect PR creations (gh cli or hub)
      if (cmd.includes('gh pr create') || cmd.includes('hub pull-request')) {
        pullRequests++;
        debug(`found PR creation: ${tool.target}`);
      }
    }

    if (commits === 0 && pullRequests === 0) {
      debug('no git activity found');
      return null;
    }

    debug(`git activity: ${commits} commits, ${pullRequests} PRs`);

    return {
      commits,
      pullRequests,
    };
  } catch (error) {
    debug('failed to extract git activity:', error);
    return null;
  }
}
