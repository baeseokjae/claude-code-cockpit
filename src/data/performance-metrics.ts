/**
 * Performance metrics collection
 * Tracks build and test performance over time
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PerformanceMetrics, BuildMetrics, TestMetrics } from '../types/performance.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('performance-metrics');

/**
 * Check if package.json has build script
 */
function hasBuildScript(cwd: string): boolean {
  try {
    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) return false;

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return Boolean(pkg.scripts?.build);
  } catch {
    return false;
  }
}

/**
 * Check if package.json has test script
 */
function hasTestScript(cwd: string): boolean {
  try {
    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) return false;

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return Boolean(pkg.scripts?.test);
  } catch {
    return false;
  }
}

/**
 * Read build metrics from performance log
 * (This is a placeholder - actual implementation would track metrics over time)
 */
function getBuildMetrics(cwd: string): BuildMetrics {
  const hasBuild = hasBuildScript(cwd);

  // TODO: Implement actual performance tracking
  // This would require storing build times in a persistent file
  return {
    hasBuildScript: hasBuild,
    lastBuildTime: null,
    averageBuildTime: null,
    buildCount: 0,
  };
}

/**
 * Read test metrics from performance log
 */
function getTestMetrics(cwd: string): TestMetrics {
  const hasTest = hasTestScript(cwd);

  // TODO: Implement actual performance tracking
  return {
    hasTestScript: hasTest,
    lastTestTime: null,
    averageTestTime: null,
    testCount: 0,
    lastTestStatus: 'unknown',
  };
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics(cwd?: string): PerformanceMetrics | null {
  if (!cwd) {
    return null;
  }

  const build = getBuildMetrics(cwd);
  const test = getTestMetrics(cwd);

  const hasScripts = build.hasBuildScript || test.hasTestScript;

  if (!hasScripts) {
    return null;
  }

  debug('performance metrics:', { build, test });

  return {
    build,
    test,
    hasData: false, // Script detection only — no actual metrics tracking implemented
  };
}
