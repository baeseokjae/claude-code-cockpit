/**
 * Read and parse JSON from stdin
 */

import type { StdinData } from '../types/index.js';
import { createDebug } from '../utils/debug.js';

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
  const modelId = stdin.model?.id;
  
  // Detect AWS Bedrock models
  if (modelId && isBedrockModel(modelId)) {
    return 'Bedrock';
  }
  
  return stdin.model?.display_name || 'Unknown';
}

export function isBedrockModel(modelId: string): boolean {
  // Bedrock model IDs follow the pattern: {region}.anthropic.{model}:{version}
  // Examples: eu.anthropic.claude-opus-4-5-20251101-v1:0, us.anthropic.claude-3-5-sonnet-20241022-v2:0
  const bedrockPattern = /^(eu|us|ap|ca)\.anthropic\./;
  return bedrockPattern.test(modelId);
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

export function getCwd(stdin: StdinData): string | null {
  return stdin.cwd || stdin.workspace?.current_dir || stdin.workspace?.project_dir || null;
}

export function getAbsoluteTokens(stdin: StdinData): { used: number; total: number } | null {
  const size = stdin.context_window?.context_window_size;
  const usage = stdin.context_window?.current_usage;

  if (!size || !usage) return null;

  const total =
    (usage.input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.output_tokens || 0);

  return { used: total, total: size };
}
