/**
 * DEBUG environment variable based logging
 */

function isDebugEnabled(namespace: string): boolean {
  const debug = process.env.DEBUG;
  if (!debug) return false;

  if (debug === '*' || debug === 'cockpit:*') return true;

  if (debug === `cockpit:${namespace}`) return true;

  const parts = debug.split(',').map((s) => s.trim());
  return parts.includes(`cockpit:${namespace}`);
}

export function createDebug(namespace: string) {
  return (...args: unknown[]) => {
    if (isDebugEnabled(namespace)) {
      console.error(`[cockpit:${namespace}]`, ...args);
    }
  };
}
