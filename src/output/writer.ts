/**
 * stdout output with NBSP conversion
 */

export function writeOutput(lines: string[]): void {
  for (const line of lines) {
    const converted = line.replace(/ /g, '\u00A0');
    console.log(converted);
  }
}
