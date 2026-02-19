/**
 * Shared path resolution utilities
 * Respects CLAUDE_CONFIG_DIR for multi-profile support.
 */

import { join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Returns the Claude configuration directory.
 * Uses CLAUDE_CONFIG_DIR env var if set, otherwise defaults to ~/.claude.
 */
export function getClaudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
}
