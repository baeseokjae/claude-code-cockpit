/**
 * ANSI color functions
 */

export const RESET = '\x1b[0m';

export function red(text: string): string {
  return `\x1b[31m${text}${RESET}`;
}

export function green(text: string): string {
  return `\x1b[32m${text}${RESET}`;
}

export function yellow(text: string): string {
  return `\x1b[33m${text}${RESET}`;
}

export function blue(text: string): string {
  return `\x1b[34m${text}${RESET}`;
}

export function magenta(text: string): string {
  return `\x1b[35m${text}${RESET}`;
}

export function cyan(text: string): string {
  return `\x1b[36m${text}${RESET}`;
}

export function white(text: string): string {
  return `\x1b[37m${text}${RESET}`;
}

export function gray(text: string): string {
  return `\x1b[90m${text}${RESET}`;
}

export function bold(text: string): string {
  return `\x1b[1m${text}\x1b[22m`;
}

export function dim(text: string): string {
  return `\x1b[2m${text}\x1b[22m`;
}

export function italic(text: string): string {
  return `\x1b[3m${text}\x1b[23m`;
}

export function underline(text: string): string {
  return `\x1b[4m${text}\x1b[24m`;
}

export function rgb(r: number, g: number, b: number, text: string): string {
  return `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
}

export function hex(color: string, text: string): string {
  const clean = color.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return rgb(r, g, b, text);
}
