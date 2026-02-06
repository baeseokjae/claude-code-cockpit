/**
 * security-dashboard.test.ts
 * Security dashboard tests
 */

import { describe, it, expect } from 'vitest';
import { createSecurityDashboard } from '../src/data/security-dashboard.js';
import type { Violation, ViolationSummary, ViolationType } from '../src/types/violations.js';

function createViolation(type: ViolationType, file = 'test.js', line?: number): Violation {
  return {
    type,
    file,
    line,
    message: `Found ${type.replace('_', ' ')}`,
    severity: type === 'hardcoded_secret' ? 'error' : 'warning',
  };
}

function createViolationSummary(violations: Violation[]): ViolationSummary {
  const byType = new Map<ViolationType, number>();
  for (const v of violations) {
    byType.set(v.type, (byType.get(v.type) || 0) + 1);
  }
  return { total: violations.length, byType, violations };
}

describe('createSecurityDashboard', () => {
  it('should return null for null violations', () => {
    expect(createSecurityDashboard(null)).toBeNull();
  });

  it('should return null for zero violations', () => {
    const summary = createViolationSummary([]);
    expect(createSecurityDashboard(summary)).toBeNull();
  });

  it('should create dashboard from violations', () => {
    const violations = [
      createViolation('console_log'),
      createViolation('hardcoded_secret'),
    ];
    const summary = createViolationSummary(violations);
    const result = createSecurityDashboard(summary);

    expect(result).not.toBeNull();
    expect(result!.hasIssues).toBe(true);
    expect(result!.issues.length).toBe(2);
  });

  it('should count severity levels correctly', () => {
    const violations = [
      createViolation('hardcoded_secret'),
      createViolation('hardcoded_secret'),
      createViolation('large_file'),
      createViolation('console_log'),
      createViolation('todo_comment'),
    ];
    const summary = createViolationSummary(violations);
    const result = createSecurityDashboard(summary)!;

    expect(result.criticalCount).toBe(2); // hardcoded_secret = critical
    expect(result.mediumCount).toBe(1); // large_file = medium
    expect(result.lowCount).toBe(2); // console_log + todo_comment = low
    expect(result.highCount).toBe(0);
  });

  it('should calculate score with secrets deduction', () => {
    const violations = [createViolation('hardcoded_secret')];
    const summary = createViolationSummary(violations);
    const result = createSecurityDashboard(summary)!;

    // critical = 30 points deduction from secrets
    expect(result.score.secrets).toBe(70);
    expect(result.score.codeQuality).toBe(100);
  });

  it('should calculate score with code quality deduction', () => {
    const violations = [
      createViolation('console_log'),
      createViolation('console_log'),
    ];
    const summary = createViolationSummary(violations);
    const result = createSecurityDashboard(summary)!;

    // 2 x low (5 points each) = 10 deduction from codeQuality
    expect(result.score.secrets).toBe(100);
    expect(result.score.codeQuality).toBe(90);
  });

  it('should set dependencies to -1 (unmeasured)', () => {
    const violations = [createViolation('console_log')];
    const summary = createViolationSummary(violations);
    const result = createSecurityDashboard(summary)!;

    expect(result.score.dependencies).toBe(-1);
  });

  it('should compute overall from secrets and codeQuality only', () => {
    const violations = [
      createViolation('hardcoded_secret'), // -30 from secrets
      createViolation('console_log'), // -5 from codeQuality
    ];
    const summary = createViolationSummary(violations);
    const result = createSecurityDashboard(summary)!;

    // secrets = 70, codeQuality = 95, overall = (70+95)/2 = 82.5 → 83
    expect(result.score.overall).toBe(83);
    expect(result.score.dependencies).toBe(-1);
  });

  it('should map severity correctly', () => {
    const violations = [
      createViolation('hardcoded_secret'),
      createViolation('large_file'),
      createViolation('console_log'),
      createViolation('debug_statement'),
      createViolation('todo_comment'),
    ];
    const summary = createViolationSummary(violations);
    const result = createSecurityDashboard(summary)!;

    const findIssue = (type: string) => result.issues.find(i => i.type === type)!;
    expect(findIssue('hardcoded_secret').severity).toBe('critical');
    expect(findIssue('large_file').severity).toBe('medium');
    expect(findIssue('console_log').severity).toBe('low');
    expect(findIssue('debug_statement').severity).toBe('low');
    expect(findIssue('todo_comment').severity).toBe('low');
  });
});
