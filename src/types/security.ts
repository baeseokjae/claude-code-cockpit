/**
 * Security dashboard type definitions
 */

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityIssue {
  id: string;
  type: string;
  severity: SecuritySeverity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation?: string;
}

export interface SecurityScore {
  overall: number; // 0-100
  secrets: number;
  codeQuality: number;
  dependencies: number;
}

export interface SecurityDashboard {
  hasIssues: boolean;
  score: SecurityScore;
  issues: SecurityIssue[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}
