/**
 * stdout output
 */

export function writeOutput(lines: string[]): void {
  for (const line of lines) {
    console.log(line + '\x1b[0m');
  }
}
