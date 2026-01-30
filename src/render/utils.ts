/**
 * Rendering utility functions
 */

import { basename, dirname } from 'node:path';

export function visualLength(text: string): number {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  return stripped.length;
}

export function truncate(text: string, maxLength: number, ellipsis = '…'): string {
  if (visualLength(text) <= maxLength) {
    return text;
  }
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  if (stripped.length <= maxLength) {
    return text;
  }

  return stripped.substring(0, maxLength - ellipsis.length) + ellipsis;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return `${tokens}`;
}

export function formatPath(path: string, pathLevels: number): string {
  if (pathLevels === 0) {
    return basename(path);
  }

  const parts: string[] = [];
  let current = path;

  for (let i = 0; i <= pathLevels; i++) {
    const base = basename(current);
    if (!base || base === '/' || base === '.') break;
    parts.unshift(base);
    current = dirname(current);
  }

  return parts.join('/');
}

export function createProgressBar(
  percent: number,
  length: number,
  filledChar: string,
  emptyChar: string
): string {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clampedPercent / 100) * length);
  const empty = length - filled;
  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}
