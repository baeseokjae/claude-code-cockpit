/**
 * URL utilities for project/git links
 */

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
