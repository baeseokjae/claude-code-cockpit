/**
 * Terminal hyperlink utilities (OSC 8)
 * Supports clickable links in compatible terminals
 */

/**
 * Create a clickable hyperlink using OSC 8 escape sequences
 * Format: \x1b]8;;URL\x07TEXT\x1b]8;;\x07
 *
 * @param url - The URL to link to
 * @param text - The text to display
 * @returns The hyperlinked text with OSC 8 escape sequences
 */
export function hyperlink(url: string, text: string): string {
  const OSC = '\x1b]';
  const BEL = '\x07';
  const start = `${OSC}8;;${url}${BEL}`;
  const end = `${OSC}8;;${BEL}`;
  return `${start}${text}${end}`;
}

/**
 * Create a file:// URL from an absolute path
 * @param path - Absolute file system path
 * @returns file:// URL
 */
export function fileUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `file://${normalizedPath}`;
}

/**
 * Create a GitHub branch URL
 * @param repoUrl - Base repository URL (e.g., https://github.com/user/repo)
 * @param branch - Branch name
 * @returns Full GitHub branch URL
 */
export function githubBranchUrl(repoUrl: string, branch: string): string {
  return `${repoUrl}/tree/${encodeURIComponent(branch)}`;
}

/**
 * Check if terminal supports hyperlinks
 * Heuristic based on common terminal environment variables
 */
export function supportsHyperlinks(): boolean {
  const term = process.env.TERM || '';
  const termProgram = process.env.TERM_PROGRAM || '';

  // Known NOT to support OSC 8
  if (termProgram === 'WarpTerminal') return false;

  // Known to support OSC 8
  if (termProgram === 'iTerm.app') return true;
  if (termProgram === 'Apple_Terminal') return true;
  if (termProgram === 'vscode') return true;
  if (term.includes('kitty')) return true;
  if (process.env.WT_SESSION) return true; // Windows Terminal
  if (process.env.GHOSTTY_RESOURCES_DIR) return true; // Ghostty

  return false;
}
