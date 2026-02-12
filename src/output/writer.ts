/**
 * stdout output
 */

import { getTerminalWidth } from '../utils/terminal-width.js';

export function writeOutput(lines: string[]): void {
  const maxWidth = getTerminalWidth();
  for (const line of lines) {
    const output = truncateLine(line, maxWidth);
    console.log(output + '\x1b[0m');
  }
}

// ANSI escape sequence regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;

/**
 * Truncate a line to fit terminal width, preserving ANSI escape sequences.
 * Uses visual width (CJK/emoji = 2 columns).
 */
function truncateLine(line: string, maxWidth: number): string {
  // Fast path: measure visual length first
  if (lineVisualLength(line) < maxWidth) {
    return line;
  }

  const ellipsis = '\u2026'; // …
  const limit = maxWidth - 1; // reserve 1 column for ellipsis
  let result = '';
  let width = 0;
  let i = 0;

  while (i < line.length) {
    // Check for ANSI escape sequence at current position
    ANSI_RE.lastIndex = i;
    const ansiMatch = ANSI_RE.exec(line);
    if (ansiMatch && ansiMatch.index === i) {
      // Include ANSI sequence without counting width
      result += ansiMatch[0];
      i += ansiMatch[0].length;
      continue;
    }

    const cp = line.codePointAt(i);
    if (cp === undefined) break;

    const charWidth = isFullWidth(cp) ? 2 : 1;
    if (width + charWidth > limit) break;

    width += charWidth;
    const char = String.fromCodePoint(cp);
    result += char;
    i += char.length;
  }

  return result + ellipsis;
}

function lineVisualLength(text: string): number {
  const stripped = text.replace(ANSI_RE, '');
  let width = 0;
  for (const char of stripped) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    width += isFullWidth(cp) ? 2 : 1;
  }
  return width;
}

function isFullWidth(cp: number): boolean {
  return (
    (cp >= 0x4E00 && cp <= 0x9FFF) ||
    (cp >= 0x3400 && cp <= 0x4DBF) ||
    (cp >= 0x20000 && cp <= 0x2A6DF) ||
    (cp >= 0xF900 && cp <= 0xFAFF) ||
    (cp >= 0xAC00 && cp <= 0xD7AF) ||
    (cp >= 0x1100 && cp <= 0x11FF) ||
    (cp >= 0xFF01 && cp <= 0xFF60) ||
    (cp >= 0x3000 && cp <= 0x303F) ||
    (cp >= 0x3040 && cp <= 0x309F) ||
    (cp >= 0x30A0 && cp <= 0x30FF) ||
    (cp >= 0x3200 && cp <= 0x32FF) ||
    (cp >= 0x3300 && cp <= 0x33FF) ||
    (cp >= 0x1F300 && cp <= 0x1F9FF) ||
    (cp >= 0x2600 && cp <= 0x26FF) ||  // Miscellaneous Symbols (⚡, ☀, ★)
    (cp >= 0x2700 && cp <= 0x27BF) ||  // Dingbats (✂, ✈)
    (cp >= 0xFE00 && cp <= 0xFE0F) ||  // Variation Selectors
    (cp >= 0x1F000 && cp <= 0x1F02F) || // Mahjong/Domino
    (cp >= 0x1FA00 && cp <= 0x1FAFF)   // Extended-A Symbols
  );
}
