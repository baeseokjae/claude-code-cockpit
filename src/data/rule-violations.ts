/**
 * Rule violation detection from tool results
 */

import type { ToolEntry } from '../types/index.js';
import type { Violation, ViolationSummary, ViolationType } from '../types/violations.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('rule-violations');

const PATTERNS: Record<ViolationType, RegExp[]> = {
  console_log: [
    /console\.(log|debug|info|warn|error)\s*\(/g,
    /print\s*\(/g, // Python
  ],
  hardcoded_secret: [
    /['"]?(api[_-]?key|secret|password|token|credential)['"]?\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    /sk-[a-zA-Z0-9]{24,}/g, // OpenAI key pattern
    /ghp_[a-zA-Z0-9]{36}/g, // GitHub token pattern
  ],
  large_file: [], // Detected by line count
  debug_statement: [
    /debugger;/g,
    /import\s+pdb/g,
    /pdb\.set_trace\(\)/g,
  ],
  todo_comment: [
    /\/\/\s*TODO[:\s]/gi,
    /#\s*TODO[:\s]/gi,
  ],
  fixme_comment: [
    /\/\/\s*FIXME[:\s]/gi,
    /#\s*FIXME[:\s]/gi,
  ],
};

export function extractViolations(tools: ToolEntry[]): ViolationSummary {
  const violations: Violation[] = [];
  const byType = new Map<ViolationType, number>();

  for (const tool of tools) {
    if (tool.name !== 'Edit' && tool.name !== 'Write') continue;
    if (tool.status !== 'completed') continue;

    const filePath = tool.target || 'unknown';
    const details = tool.details as Record<string, unknown> | undefined;
    const content = details?.content as string || '';
    const newText = details?.new_string as string || '';

    const textToCheck = newText || content;
    if (!textToCheck) continue;

    // Check each pattern type
    for (const [type, patterns] of Object.entries(PATTERNS)) {
      const violationType = type as ViolationType;
      for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex state
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(textToCheck)) !== null) {
          const line = textToCheck.substring(0, match.index).split('\n').length;
          violations.push({
            type: violationType,
            file: filePath,
            line,
            message: `Found ${type.replace('_', ' ')}: ${match[0].substring(0, 30)}...`,
            severity: violationType === 'hardcoded_secret' ? 'error' : 'warning',
          });
          byType.set(violationType, (byType.get(violationType) || 0) + 1);
        }
      }
    }

    // Check for large file (>500 lines)
    const lineCount = textToCheck.split('\n').length;
    if (lineCount > 500) {
      violations.push({
        type: 'large_file',
        file: filePath,
        message: `File has ${lineCount} lines (>500)`,
        severity: 'warning',
      });
      byType.set('large_file', (byType.get('large_file') || 0) + 1);
    }
  }

  debug(`found ${violations.length} violations`);

  return {
    total: violations.length,
    byType,
    violations,
  };
}
