/**
 * Test coverage analysis
 * Reads coverage data from coverage reports (vitest, jest, etc.)
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { TestCoverage, CoverageSummary, CoverageMetrics } from '../types/test-coverage.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('test-coverage');

/**
 * Detect test framework from package.json
 */
export function detectTestFramework(cwd: string): 'vitest' | 'jest' | 'mocha' | 'ava' | 'none' {
  try {
    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) return 'none';

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if (allDeps.vitest) return 'vitest';
    if (allDeps.jest || allDeps['@jest/core']) return 'jest';
    if (allDeps.mocha) return 'mocha';
    if (allDeps.ava) return 'ava';

    return 'none';
  } catch (error) {
    debug('failed to detect test framework:', error);
    return 'none';
  }
}

/**
 * Read coverage summary from coverage-summary.json
 */
export function readCoverageSummary(cwd: string): TestCoverage | null {
  const coveragePaths = [
    join(cwd, 'coverage', 'coverage-summary.json'),
    join(cwd, '.coverage', 'coverage-summary.json'),
    join(cwd, 'coverage', 'coverage-final.json'),
  ];

  for (const path of coveragePaths) {
    if (existsSync(path)) {
      try {
        const data = JSON.parse(readFileSync(path, 'utf8'));

        // Extract total coverage from different formats
        const total = data.total || data;

        if (total.statements || total.lines) {
          const metrics: CoverageMetrics = {
            statements: total.statements?.pct || 0,
            branches: total.branches?.pct || 0,
            functions: total.functions?.pct || 0,
            lines: total.lines?.pct || 0,
          };

          return {
            overall: metrics,
            hasData: true,
            threshold: null,
            files: Object.keys(data).length - 1, // Exclude 'total'
          };
        }
      } catch (error) {
        debug('failed to read coverage from', path, error);
      }
    }
  }

  return null;
}

/**
 * Get test coverage summary
 */
export function getTestCoverageSummary(cwd?: string): CoverageSummary {
  if (!cwd) {
    return {
      coverage: null,
      hasTestFramework: false,
      testFramework: 'none',
    };
  }

  const testFramework = detectTestFramework(cwd);
  const hasTestFramework = testFramework !== 'none';
  const coverage = hasTestFramework ? readCoverageSummary(cwd) : null;

  return {
    coverage,
    hasTestFramework,
    testFramework,
  };
}
