export type ViolationType =
  | 'console_log'
  | 'hardcoded_secret'
  | 'large_file'
  | 'debug_statement'
  | 'todo_comment'
  | 'fixme_comment';

export interface Violation {
  type: ViolationType;
  file: string;
  line?: number;
  message: string;
  severity: 'warning' | 'error';
}

export interface ViolationSummary {
  total: number;
  byType: Map<ViolationType, number>;
  violations: Violation[];
}
