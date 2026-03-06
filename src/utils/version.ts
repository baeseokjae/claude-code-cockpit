import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let cached: string | null = null;

export function getVersion(): string {
  if (!cached) {
    try {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
      cached = pkg.version || '0.0.0';
    } catch {
      cached = '0.0.0';
    }
  }
  return cached!;
}
