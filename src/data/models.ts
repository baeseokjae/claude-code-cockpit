/**
 * Unified model registry with pricing information
 */
import { createDebug } from '../utils/debug.js';

const debug = createDebug('models');

export interface ModelInfo {
  shortName: string;       // 'opus-4.6', 'sonnet-4.5', etc.
  input: number;           // input cost $/MTok
  output: number;          // output cost $/MTok
  cacheWrite: number;      // cache write cost $/MTok
  cacheRead: number;       // cache read cost $/MTok
}

// Prefix matching order (most specific first → most general last)
// Uses includes() matching so partial names like 'opus-4-6' match 'claude-opus-4-6-20250610'
const MODEL_REGISTRY: Array<[prefix: string, info: ModelInfo]> = [
  // Claude 4.6
  ['opus-4-6',    { shortName: 'opus-4.6',   input: 5.0,   output: 25.0,  cacheWrite: 6.25,  cacheRead: 0.50 }],
  ['opus-4.6',    { shortName: 'opus-4.6',   input: 5.0,   output: 25.0,  cacheWrite: 6.25,  cacheRead: 0.50 }],
  ['sonnet-4-6',  { shortName: 'sonnet-4.6', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['sonnet-4.6',  { shortName: 'sonnet-4.6', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  // Claude 4.5
  ['opus-4-5',    { shortName: 'opus-4.5',   input: 5.0,   output: 25.0,  cacheWrite: 6.25,  cacheRead: 0.50 }],
  ['opus-4.5',    { shortName: 'opus-4.5',   input: 5.0,   output: 25.0,  cacheWrite: 6.25,  cacheRead: 0.50 }],
  ['sonnet-4-5',  { shortName: 'sonnet-4.5', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['sonnet-4.5',  { shortName: 'sonnet-4.5', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['haiku-4-5',   { shortName: 'haiku-4.5',  input: 1.0,   output: 5.0,   cacheWrite: 1.25,  cacheRead: 0.10 }],
  ['haiku-4.5',   { shortName: 'haiku-4.5',  input: 1.0,   output: 5.0,   cacheWrite: 1.25,  cacheRead: 0.10 }],
  // Claude 4 (must come AFTER 4.5/4.6 to avoid premature matching)
  ['opus-4-1',    { shortName: 'opus-4.1',   input: 15.0,  output: 75.0,  cacheWrite: 18.75, cacheRead: 1.50 }],
  ['opus4',       { shortName: 'opus-4',     input: 15.0,  output: 75.0,  cacheWrite: 18.75, cacheRead: 1.50 }],
  ['opus-4',      { shortName: 'opus-4',     input: 15.0,  output: 75.0,  cacheWrite: 18.75, cacheRead: 1.50 }],
  ['sonnet4',     { shortName: 'sonnet-4',   input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['sonnet-4',    { shortName: 'sonnet-4',   input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['haiku-4',     { shortName: 'haiku-4',    input: 1.0,   output: 5.0,   cacheWrite: 1.25,  cacheRead: 0.10 }],
  // Claude 3.7 (deprecated)
  ['sonnet-3-7',  { shortName: 'sonnet-3.7', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['sonnet-3.7',  { shortName: 'sonnet-3.7', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  // Claude 3.5
  ['3-5-sonnet',  { shortName: 'sonnet-3.5', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['3.5-sonnet',  { shortName: 'sonnet-3.5', input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['3-5-haiku',   { shortName: 'haiku-3.5',  input: 0.8,   output: 4.0,   cacheWrite: 1.00,  cacheRead: 0.08 }],
  ['3.5-haiku',   { shortName: 'haiku-3.5',  input: 0.8,   output: 4.0,   cacheWrite: 1.00,  cacheRead: 0.08 }],
  ['haiku-3-5',   { shortName: 'haiku-3.5',  input: 0.8,   output: 4.0,   cacheWrite: 1.00,  cacheRead: 0.08 }],
  ['haiku-3.5',   { shortName: 'haiku-3.5',  input: 0.8,   output: 4.0,   cacheWrite: 1.00,  cacheRead: 0.08 }],
  // Claude 3 (must come AFTER 3.5/3.7 to avoid premature matching)
  ['3-opus',      { shortName: 'opus-3',     input: 15.0,  output: 75.0,  cacheWrite: 18.75, cacheRead: 1.50 }],
  ['3-sonnet',    { shortName: 'sonnet-3',   input: 3.0,   output: 15.0,  cacheWrite: 3.75,  cacheRead: 0.30 }],
  ['3-haiku',     { shortName: 'haiku-3',    input: 0.25,  output: 1.25,  cacheWrite: 0.30,  cacheRead: 0.03 }],
  // Bare 'haiku' prefix — match after haiku-3 etc.
  ['haiku',       { shortName: 'haiku',      input: 1.0,   output: 5.0,   cacheWrite: 1.25,  cacheRead: 0.10 }],
];

const DEFAULT_MODEL_INFO: ModelInfo = {
  shortName: 'unknown',
  input: 3.0,
  output: 15.0,
  cacheWrite: 3.75,
  cacheRead: 0.30,
};

export function getModelInfo(modelId: string): ModelInfo {
  if (!modelId) {
    return DEFAULT_MODEL_INFO;
  }

  const lower = modelId.toLowerCase();

  // Registry scan: most-specific prefixes are listed first
  for (const [prefix, info] of MODEL_REGISTRY) {
    if (lower.includes(prefix)) {
      return info;
    }
  }

  // Generic fallbacks for bare keywords not matched above
  // 'opus' alone (without a version number) → claude-3-opus pricing (15.0) to match legacy tests
  if (lower.includes('opus')) {
    return { shortName: 'opus', input: 15.0, output: 75.0, cacheWrite: 18.75, cacheRead: 1.50 };
  }
  if (lower.includes('sonnet')) {
    return { shortName: 'sonnet', input: 3.0, output: 15.0, cacheWrite: 3.75, cacheRead: 0.30 };
  }

  debug(`unknown model: ${modelId}, using default pricing`);
  return DEFAULT_MODEL_INFO;
}

export function getShortModelName(modelId: string): string {
  if (!modelId) return 'unknown';

  const lower = modelId.toLowerCase();

  // Registry scan for versioned short names
  for (const [prefix, info] of MODEL_REGISTRY) {
    if (lower.includes(prefix)) {
      return info.shortName;
    }
  }

  // Generic fallbacks: bare keyword → bare keyword as short name
  if (lower.includes('opus')) return 'opus';
  if (lower.includes('sonnet')) return 'sonnet';
  if (lower.includes('haiku')) return 'haiku';

  // Return first hyphen-separated segment (e.g. 'unknown-model' → 'unknown')
  return modelId.split('-')[0] || 'unknown';
}
