/**
 * Test coverage type definitions
 */

export interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface TestCoverage {
  overall: CoverageMetrics;
  hasData: boolean;
  threshold: CoverageMetrics | null;
  files?: number;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
}

export interface CoverageSummary {
  coverage: TestCoverage | null;
  hasTestFramework: boolean;
  testFramework: 'vitest' | 'jest' | 'mocha' | 'ava' | 'none';
}
