/**
 * alerts.test.ts
 * 알림 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  checkAlerts,
  getMostSevereAlert,
  getAlertColorKey,
  DEFAULT_ALERT_CONFIG,
} from '../src/data/alerts.js';
import type { StdinData, UsageData } from '../src/types/index.js';

describe('checkAlerts', () => {
  it('should return empty array when no alerts', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 200000,
        current_usage: { input_tokens: 10000, output_tokens: 1000 },
      },
      cost: { total_cost_usd: 0.1, total_duration_ms: 60000 },
    };
    const alerts = checkAlerts(stdin, null);
    expect(alerts).toHaveLength(0);
  });

  it('should detect critical context alert (90%+)', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 100000,
        current_usage: { input_tokens: 92000, output_tokens: 0 },
      },
    };
    const alerts = checkAlerts(stdin, null);
    const contextAlert = alerts.find((a) => a.type === 'context_critical');
    expect(contextAlert).toBeDefined();
    expect(contextAlert?.severity).toBe('critical');
  });

  it('should detect warning context alert (75-90%)', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 100000,
        current_usage: { input_tokens: 80000, output_tokens: 0 },
      },
    };
    const alerts = checkAlerts(stdin, null);
    const contextAlert = alerts.find((a) => a.type === 'context_high');
    expect(contextAlert).toBeDefined();
    expect(contextAlert?.severity).toBe('warning');
  });

  it('should detect cost alert', () => {
    const stdin: StdinData = {
      cost: { total_cost_usd: 2.5 },
    };
    const alerts = checkAlerts(stdin, null);
    const costAlert = alerts.find((a) => a.type === 'cost_high');
    expect(costAlert).toBeDefined();
    expect(costAlert?.severity).toBe('warning');
  });

  it('should detect session duration alert', () => {
    const stdin: StdinData = {
      cost: { total_duration_ms: 3600000 }, // 60 minutes
    };
    const alerts = checkAlerts(stdin, null);
    const sessionAlert = alerts.find((a) => a.type === 'session_long');
    expect(sessionAlert).toBeDefined();
    expect(sessionAlert?.severity).toBe('info');
  });

  it('should detect usage API alert', () => {
    const stdin: StdinData = {};
    const usageData: UsageData = {
      planName: 'Pro',
      fiveHour: 85,
      sevenDay: 50,
      fiveHourResetAt: null,
      sevenDayResetAt: null,
    };
    const alerts = checkAlerts(stdin, usageData);
    const usageAlert = alerts.find((a) => a.type === 'usage_high');
    expect(usageAlert).toBeDefined();
    expect(usageAlert?.severity).toBe('warning');
  });

  it('should detect critical usage alert (95%+)', () => {
    const stdin: StdinData = {};
    const usageData: UsageData = {
      planName: 'Pro',
      fiveHour: 98,
      sevenDay: 50,
      fiveHourResetAt: null,
      sevenDayResetAt: null,
    };
    const alerts = checkAlerts(stdin, usageData);
    const usageAlert = alerts.find((a) => a.type === 'usage_high');
    expect(usageAlert).toBeDefined();
    expect(usageAlert?.severity).toBe('critical');
  });

  it('should respect custom thresholds', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 100000,
        current_usage: { input_tokens: 60000, output_tokens: 0 },
      },
    };
    // Default threshold is 75%, so 60% should not trigger
    expect(checkAlerts(stdin, null)).toHaveLength(0);

    // Custom threshold of 50% should trigger
    const alerts = checkAlerts(stdin, null, { contextWarningThreshold: 50 });
    expect(alerts.some((a) => a.type === 'context_high')).toBe(true);
  });
});

describe('getMostSevereAlert', () => {
  it('should return null for empty array', () => {
    expect(getMostSevereAlert([])).toBeNull();
  });

  it('should return critical over warning', () => {
    const alerts = [
      { type: 'context_high' as const, severity: 'warning' as const, message: '', shortMessage: '' },
      { type: 'context_critical' as const, severity: 'critical' as const, message: '', shortMessage: '' },
    ];
    expect(getMostSevereAlert(alerts)?.severity).toBe('critical');
  });

  it('should return warning over info', () => {
    const alerts = [
      { type: 'session_long' as const, severity: 'info' as const, message: '', shortMessage: '' },
      { type: 'cost_high' as const, severity: 'warning' as const, message: '', shortMessage: '' },
    ];
    expect(getMostSevereAlert(alerts)?.severity).toBe('warning');
  });
});

describe('getAlertColorKey', () => {
  it('should return correct color keys', () => {
    expect(getAlertColorKey('critical')).toBe('progressCritical');
    expect(getAlertColorKey('warning')).toBe('progressHigh');
    expect(getAlertColorKey('info')).toBe('progressMid');
  });
});
