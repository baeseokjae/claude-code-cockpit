/**
 * stdout output
 */

import { getTerminalWidth } from '../utils/terminal-width.js';
import { isFullWidth, visualLength } from '../render/utils.js';

export function writeOutput(lines: string[]): void {
  const maxWidth = getTerminalWidth();
  for (const line of lines) {
    const truncated = truncateLine(line, maxWidth);
    const safe = truncated.replace(/ /g, '\u00A0');
    console.log('\x1b[0m' + safe + '\x1b[0m');
  }
}

const ANSI_RE = /\x1b\[[0-9;]*m/g;

/**
 * Truncate a line to fit terminal width, preserving ANSI escape sequences.
 * Uses visual width (CJK/emoji = 2 columns).
 */
function truncateLine(line: string, maxWidth: number): string {
  // Fast path: measure visual length first
  if (visualLength(line) <= maxWidth) {
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
