/**
 * Nerd Font detection utilities
 */

/**
 * Detect Nerd Font availability
 *
 * Detection methods:
 * 1. Explicit env var COCKPIT_NERD_FONT=1
 * 2. Explicit env var COCKPIT_NERD_FONT=0 to disable
 * 3. Known Nerd Font-friendly terminals
 * 4. Inference based on TERM_PROGRAM env var
 */
export function detectNerdFont(): boolean {
  // Explicit setting takes priority
  const explicit = process.env.COCKPIT_NERD_FONT;
  if (explicit === '1' || explicit === 'true') return true;
  if (explicit === '0' || explicit === 'false') return false;

  // Known Nerd Font-friendly terminals
  const termProgram = process.env.TERM_PROGRAM || '';
  const nerdFriendlyTerminals = [
    'iTerm.app',
    'WezTerm',
    'Alacritty',
    'kitty',
    'Hyper',
    'Tabby',
    'Rio',
  ];

  if (nerdFriendlyTerminals.some(t =>
    termProgram.toLowerCase().includes(t.toLowerCase())
  )) {
    return true;
  }

  // VS Code integrated terminal
  if (process.env.TERM_PROGRAM === 'vscode') {
    return true;
  }

  // Warp terminal
  if (process.env.WARP_TERMINAL) {
    return true;
  }

  // Default: assume no Nerd Font (safe fallback)
  return false;
}

/**
 * Cached result (performance optimization)
 */
let cachedResult: boolean | null = null;

export function hasNerdFont(): boolean {
  if (cachedResult === null) {
    cachedResult = detectNerdFont();
  }
  return cachedResult;
}

/**
 * Reset cache (for testing)
 */
export function resetNerdFontCache(): void {
  cachedResult = null;
}
