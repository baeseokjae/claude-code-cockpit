/**
 * CLI argument parsing
 */

import { createDebug } from '../utils/debug.js';

const debug = createDebug('cli');

export function parseExtraCmdArg(args: string[] = process.argv): string | null {
  const extraIndex = args.indexOf('--extra-cmd');
  if (extraIndex === -1 || extraIndex === args.length - 1) {
    return null;
  }

  const cmd = args[extraIndex + 1];
  debug(`parsed extra-cmd: ${cmd}`);
  return cmd;
}
