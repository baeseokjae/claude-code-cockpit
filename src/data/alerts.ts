/**
 * Alert system for state-based warnings
 */

import type { StdinData, UsageData } from '../types/index.js';
import { getContextPercent } from '../input/stdin.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('alerts');

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType =
  | 'context_high'
  | 'context_critical'
  | 'cost_high'
  | 'session_long'
  | 'usage_high';

export interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  shortMessage: string;
  value?: number;
  threshold?: number;
}

export interface AlertConfig {
  contextWarningThreshold: number;
  contextCriticalThreshold: number;
  costWarningThreshold: number;
  sessionWarningMinutes: number;
  usageWarningThreshold: number;
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  contextWarningThreshold: 75,
  contextCriticalThreshold: 90,
  costWarningThreshold: 1.0,
  sessionWarningMinutes: 30,
  usageWarningThreshold: 80,
};

export function checkAlerts(
  stdin: StdinData,
  usageData: UsageData | null,
  config: Partial<AlertConfig> = {}
): Alert[] {
  const alertConfig = { ...DEFAULT_ALERT_CONFIG, ...config };
  const alerts: Alert[] = [];

  const contextAlert = checkContextAlert(stdin, alertConfig);
  if (contextAlert) alerts.push(contextAlert);

  const costAlert = checkCostAlert(stdin, alertConfig);
  if (costAlert) alerts.push(costAlert);

  const sessionAlert = checkSessionAlert(stdin, alertConfig);
  if (sessionAlert) alerts.push(sessionAlert);
  if (usageData) {
    const usageAlert = checkUsageAlert(usageData, alertConfig);
    if (usageAlert) alerts.push(usageAlert);
  }

  debug(`checked alerts: ${alerts.length} active`);
  return alerts;
}

function checkContextAlert(stdin: StdinData, config: AlertConfig): Alert | null {
  const percent = getContextPercent(stdin);
  if (percent === null) return null;

  if (percent >= config.contextCriticalThreshold) {
    return {
      type: 'context_critical',
      severity: 'critical',
      message: `Context usage critical: ${percent}%`,
      shortMessage: `CTX ${percent}%!`,
      value: percent,
      threshold: config.contextCriticalThreshold,
    };
  }

  if (percent >= config.contextWarningThreshold) {
    return {
      type: 'context_high',
      severity: 'warning',
      message: `Context usage high: ${percent}%`,
      shortMessage: `CTX ${percent}%`,
      value: percent,
      threshold: config.contextWarningThreshold,
    };
  }

  return null;
}

function checkCostAlert(stdin: StdinData, config: AlertConfig): Alert | null {
  const cost = stdin.cost?.total_cost_usd;
  if (cost === undefined || cost === null) return null;

  if (cost >= config.costWarningThreshold) {
    return {
      type: 'cost_high',
      severity: 'warning',
      message: `Session cost: $${cost.toFixed(2)}`,
      shortMessage: `$${cost.toFixed(2)}`,
      value: cost,
      threshold: config.costWarningThreshold,
    };
  }

  return null;
}

function checkSessionAlert(stdin: StdinData, config: AlertConfig): Alert | null {
  const durationMs = stdin.cost?.total_duration_ms;
  if (durationMs === undefined || durationMs === null) return null;

  const minutes = durationMs / (1000 * 60);

  if (minutes >= config.sessionWarningMinutes) {
    return {
      type: 'session_long',
      severity: 'info',
      message: `Long session: ${Math.round(minutes)}m`,
      shortMessage: `${Math.round(minutes)}m`,
      value: minutes,
      threshold: config.sessionWarningMinutes,
    };
  }

  return null;
}

function checkUsageAlert(usageData: UsageData, config: AlertConfig): Alert | null {
  if (usageData.fiveHour >= config.usageWarningThreshold) {
    const severity: AlertSeverity = usageData.fiveHour >= 95 ? 'critical' : 'warning';
    return {
      type: 'usage_high',
      severity,
      message: `5h usage: ${usageData.fiveHour}%`,
      shortMessage: `5h: ${usageData.fiveHour}%`,
      value: usageData.fiveHour,
      threshold: config.usageWarningThreshold,
    };
  }

  if (usageData.sevenDay >= config.usageWarningThreshold) {
    return {
      type: 'usage_high',
      severity: 'warning',
      message: `7d usage: ${usageData.sevenDay}%`,
      shortMessage: `7d: ${usageData.sevenDay}%`,
      value: usageData.sevenDay,
      threshold: config.usageWarningThreshold,
    };
  }

  return null;
}

export function getMostSevereAlert(alerts: Alert[]): Alert | null {
  if (alerts.length === 0) return null;

  const severityOrder: Record<AlertSeverity, number> = {
    critical: 3,
    warning: 2,
    info: 1,
  };

  return alerts.reduce((most, current) =>
    severityOrder[current.severity] > severityOrder[most.severity] ? current : most
  );
}

export function getAlertColorKey(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'progressCritical';
    case 'warning':
      return 'progressHigh';
    case 'info':
      return 'progressMid';
    default:
      return 'text';
  }
}
