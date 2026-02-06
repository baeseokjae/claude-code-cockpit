/**
 * Security dashboard
 * Aggregates security issues and calculates security score
 */

import type { ViolationSummary } from '../types/violations.js';
import type { SecurityDashboard, SecurityIssue, SecurityScore, SecuritySeverity } from '../types/security.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('security-dashboard');

/**
 * Map violation type to security severity
 */
function getSecuritySeverity(violationType: string): SecuritySeverity {
  switch (violationType) {
    case 'hardcoded_secret':
      return 'critical';
    case 'large_file':
      return 'medium';
    case 'console_log':
    case 'debug_statement':
      return 'low';
    case 'todo_comment':
    case 'fixme_comment':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Convert violation to security issue
 */
function violationToSecurityIssue(violation: any, index: number): SecurityIssue {
  const severity = getSecuritySeverity(violation.type);

  let title = '';
  let description = '';
  let recommendation = '';

  switch (violation.type) {
    case 'hardcoded_secret':
      title = 'Hardcoded Secret Detected';
      description = 'Potential hardcoded secret or API key found in code';
      recommendation = 'Use environment variables or secret management service';
      break;
    case 'console_log':
      title = 'Console Log Statement';
      description = 'Debug console.log statement found';
      recommendation = 'Remove or replace with proper logging';
      break;
    case 'large_file':
      title = 'Large File Detected';
      description = 'File exceeds recommended size limit';
      recommendation = 'Consider splitting into smaller modules';
      break;
    case 'debug_statement':
      title = 'Debug Statement';
      description = 'Debug statement found in code';
      recommendation = 'Remove debug code before production';
      break;
    default:
      title = violation.type.replace('_', ' ').toUpperCase();
      description = violation.message;
      recommendation = 'Review and address this issue';
  }

  return {
    id: `sec-${index}`,
    type: violation.type,
    severity,
    title,
    description,
    file: violation.file,
    line: violation.line,
    recommendation,
  };
}

/**
 * Calculate security score (0-100)
 */
function calculateSecurityScore(issues: SecurityIssue[]): SecurityScore {
  if (issues.length === 0) {
    return {
      overall: 100,
      secrets: 100,
      codeQuality: 100,
      dependencies: 100,
    };
  }

  // Deduct points based on severity
  let secretsDeduction = 0;
  let codeQualityDeduction = 0;

  for (const issue of issues) {
    const points = issue.severity === 'critical' ? 30 :
                   issue.severity === 'high' ? 20 :
                   issue.severity === 'medium' ? 10 :
                   5;

    if (issue.type === 'hardcoded_secret') {
      secretsDeduction += points;
    } else {
      codeQualityDeduction += points;
    }
  }

  const secrets = Math.max(0, 100 - secretsDeduction);
  const codeQuality = Math.max(0, 100 - codeQualityDeduction);
  const dependencies = 100; // Placeholder (would check package vulnerabilities)

  const overall = Math.round((secrets + codeQuality + dependencies) / 3);

  return {
    overall,
    secrets,
    codeQuality,
    dependencies,
  };
}

/**
 * Create security dashboard from violations
 */
export function createSecurityDashboard(violations: ViolationSummary | null): SecurityDashboard | null {
  if (!violations || violations.total === 0) {
    return null;
  }

  const issues = violations.violations.map((v, idx) => violationToSecurityIssue(v, idx));

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;
  const lowCount = issues.filter(i => i.severity === 'low').length;

  const score = calculateSecurityScore(issues);

  debug('security dashboard:', { issueCount: issues.length, score: score.overall });

  return {
    hasIssues: issues.length > 0,
    score,
    issues,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  };
}
