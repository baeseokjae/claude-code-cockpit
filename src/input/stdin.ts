/**
 * Read and parse JSON from stdin
 */

import type { StdinData } from '../types/index.js';
import { createDebug } from '../utils/debug.js';
import { AUTOCOMPACT_BUFFER_PERCENT } from '../utils/constants.js';

const debug = createDebug('stdin');

export async function readStdin(): Promise<StdinData | null> {
  if (process.stdin.isTTY) {
    debug('stdin is TTY, no data available');
    return null;
  }

  const chunks: string[] = [];
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    chunks.push(chunk as string);
  }

  const raw = chunks.join('');
  if (!raw.trim()) {
    debug('stdin is empty');
    return null;
  }

  try {
    const data = JSON.parse(raw) as StdinData;
    debug('parsed stdin data:', data);
    return data;
  } catch (error) {
    debug('failed to parse stdin:', error);
    return null;
  }
}

export function getModelName(stdin: StdinData): string {
  return stdin.model?.display_name || 'Unknown';
}

export function getContextPercent(stdin: StdinData): number | null {
  if (stdin.context_window?.used_percentage !== undefined) {
    return stdin.context_window.used_percentage;
  }
  const size = stdin.context_window?.context_window_size;
  const usage = stdin.context_window?.current_usage;

  if (!size || !usage) return null;

  const total =
    (usage.input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.output_tokens || 0);

  return (total / size) * 100;
}

export function getBufferedPercent(stdin: StdinData): number | null {
  const percent = getContextPercent(stdin);
  if (percent === null) return null;

  return percent + AUTOCOMPACT_BUFFER_PERCENT;
}

export function getCwd(stdin: StdinData): string | null {
  return stdin.cwd || stdin.workspace?.current_dir || stdin.workspace?.project_dir || null;
}

export function getSessionId(stdin: StdinData): string | null {
  return stdin.session_id || null;
}

export function getPlanName(stdin: StdinData): string | null {
  return stdin.plan_name || null;
}
