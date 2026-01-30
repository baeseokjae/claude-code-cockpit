/**
 * Count project configuration files
 */

import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ConfigCounts } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('config-reader');

function countClaudeMd(cwd: string): number {
  try {
    const claudeDir = join(cwd, '.claude');
    if (!existsSync(claudeDir)) return 0;

    const files = readdirSync(claudeDir);
    const count = files.filter(
      (f) => f.endsWith('.md') && f.toUpperCase().includes('CLAUDE')
    ).length;

    debug(`found ${count} CLAUDE.md files`);
    return count;
  } catch {
    return 0;
  }
}

function countRules(cwd: string): number {
  try {
    const rulesDir = join(cwd, '.claude', 'rules');
    if (!existsSync(rulesDir)) return 0;

    const files = readdirSync(rulesDir);
    const count = files.filter((f) => f.endsWith('.md')).length;

    debug(`found ${count} rules files`);
    return count;
  } catch {
    return 0;
  }
}

function countMcp(cwd: string): number {
  try {
    const mcpConfigPath = join(cwd, '.claude', 'mcp.json');
    if (!existsSync(mcpConfigPath)) return 0;

    return 1;
  } catch {
    return 0;
  }
}

function countHooks(cwd: string): number {
  try {
    const hooksDir = join(cwd, '.claude', 'hooks');
    if (!existsSync(hooksDir)) return 0;

    const files = readdirSync(hooksDir);
    const count = files.filter((f) => {
      const fullPath = join(hooksDir, f);
      const stat = statSync(fullPath);
      return stat.isFile() && (f.endsWith('.sh') || f.endsWith('.js') || f.endsWith('.ts'));
    }).length;

    debug(`found ${count} hooks files`);
    return count;
  } catch {
    return 0;
  }
}

export function countConfigs(cwd: string | null): ConfigCounts {
  if (!cwd) {
    return {
      claudeMdCount: 0,
      rulesCount: 0,
      mcpCount: 0,
      hooksCount: 0,
    };
  }

  return {
    claudeMdCount: countClaudeMd(cwd),
    rulesCount: countRules(cwd),
    mcpCount: countMcp(cwd),
    hooksCount: countHooks(cwd),
  };
}
