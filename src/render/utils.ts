/**
 * Rendering utility functions
 */

import { basename, dirname } from 'node:path';

export function visualLength(text: string): number {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  let width = 0;

  for (const char of stripped) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;

    if (isFullWidth(cp)) {
      width += 2;
    } else {
      width += 1;
    }
  }

  return width;
}

function isFullWidth(cp: number): boolean {
  return (
    // CJK Unified Ideographs (한자)
    (cp >= 0x4E00 && cp <= 0x9FFF) ||
    // CJK Extension A
    (cp >= 0x3400 && cp <= 0x4DBF) ||
    // CJK Extension B
    (cp >= 0x20000 && cp <= 0x2A6DF) ||
    // CJK Compatibility Ideographs
    (cp >= 0xF900 && cp <= 0xFAFF) ||
    // Hangul Syllables (한글)
    (cp >= 0xAC00 && cp <= 0xD7AF) ||
    // Hangul Jamo
    (cp >= 0x1100 && cp <= 0x11FF) ||
    // Fullwidth Latin/Symbols
    (cp >= 0xFF01 && cp <= 0xFF60) ||
    // CJK Symbols and Punctuation
    (cp >= 0x3000 && cp <= 0x303F) ||
    // Hiragana (히라가나)
    (cp >= 0x3040 && cp <= 0x309F) ||
    // Katakana (가타카나)
    (cp >= 0x30A0 && cp <= 0x30FF) ||
    // Enclosed CJK
    (cp >= 0x3200 && cp <= 0x32FF) ||
    // CJK Compatibility
    (cp >= 0x3300 && cp <= 0x33FF) ||
    // Emoji (approximate - 표현 방식에 따라 다름)
    (cp >= 0x1F300 && cp <= 0x1F9FF) ||
    // Box Drawings (─, │, ╭, ╮, ╰, ╯) - Ambiguous width, 2 cols in CJK terminals
    (cp >= 0x2500 && cp <= 0x257F) ||
    // Block Elements (▀, █, ▌)
    (cp >= 0x2580 && cp <= 0x259F) ||
    // Geometric Shapes (●, ▰, ▱, ◆, ▸)
    (cp >= 0x25A0 && cp <= 0x25FF) ||
    // Miscellaneous Symbols (⚡, ☀, ★)
    (cp >= 0x2600 && cp <= 0x26FF) ||
    // Dingbats (✂, ✈, ✓, ✗)
    (cp >= 0x2700 && cp <= 0x27BF)
  );
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
