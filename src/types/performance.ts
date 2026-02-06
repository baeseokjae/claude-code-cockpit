/**
 * Performance metrics type definitions
 */

export interface BuildMetrics {
  hasBuildScript: boolean;
  lastBuildTime: number | null; // milliseconds
  averageBuildTime: number | null;
  buildCount: number;
}

export interface TestMetrics {
  hasTestScript: boolean;
  lastTestTime: number | null; // milliseconds
  averageTestTime: number | null;
  testCount: number;
  lastTestStatus: 'pass' | 'fail' | 'unknown';
}

export interface PerformanceMetrics {
  build: BuildMetrics;
  test: TestMetrics;
  hasData: boolean;
}
