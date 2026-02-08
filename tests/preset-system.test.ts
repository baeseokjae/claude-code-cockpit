/**
 * Tests for preset system
 */

import { describe, it, expect } from 'vitest';
import { PRESETS } from '../src/config/presets.js';
import { getDefaultDisplay } from '../src/config/defaults.js';

describe('Preset System', () => {
  it('should have all three presets defined', () => {
    expect(PRESETS).toBeDefined();
    expect(PRESETS.minimal).toBeDefined();
    expect(PRESETS.developer).toBeDefined();
    expect(PRESETS.full).toBeDefined();
  });

  it('minimal preset should disable most features', () => {
    const display = getDefaultDisplay('minimal');
    expect(display.showTools).toBe(false);
    expect(display.showAgents).toBe(false);
    expect(display.showGit).toBe(false);
    expect(display.showBashErrors).toBe(true); // 항상 표시
    expect(display.showViolations).toBe(true); // 항상 표시
    expect(display.showUsage).toBe(true);
    expect(display.showCost).toBe(true);
  });

  it('developer preset should enable core + activity widgets', () => {
    const display = getDefaultDisplay('developer');
    expect(display.showTools).toBe(true);
    expect(display.showAgents).toBe(true);
    expect(display.showGit).toBe(true);
    expect(display.showGitActivity).toBe(true);
    expect(display.showToolStats).toBe(true);
    expect(display.showTestCoverage).toBe(false);
  });

  it('full preset should enable all features', () => {
    const display = getDefaultDisplay('full');
    expect(display.showTools).toBe(true);
    expect(display.showAgents).toBe(true);
    expect(display.showGit).toBe(true);
    expect(display.showGitActivity).toBe(true);
    expect(display.showToolStats).toBe(true);
    expect(display.showTestCoverage).toBe(true);
    expect(display.showPassAtK).toBe(true);
    expect(display.showPerformanceMetrics).toBe(true);
    expect(display.showSecurityDashboard).toBe(true);
    expect(display.showLearningTracker).toBe(true);
    expect(display.showInstanceSync).toBe(true);
  });

  it('should return default display when no preset specified', () => {
    const display = getDefaultDisplay();
    expect(display).toBeDefined();
    expect(display.showGit).toBe(true);
    expect(display.showTools).toBe(true);
  });

  it('should return default display for invalid preset', () => {
    const display = getDefaultDisplay('invalid' as any);
    expect(display).toBeDefined();
    expect(display.showGit).toBe(true);
    expect(display.showTools).toBe(true);
  });
});
