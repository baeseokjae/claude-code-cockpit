/**
 * Pass@k metrics type definitions
 * Measures AI code generation quality
 */

export interface PassAtKMetrics {
  passAt1: number;  // Success rate on first attempt
  passAt3: number;  // Success rate within 3 attempts
  passAt5: number;  // Success rate within 5 attempts
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageAttemptsToSuccess: number;
}

export interface PassAtKSummary {
  hasData: boolean;
  metrics: PassAtKMetrics | null;
  recentSuccessRate: number; // Success rate of last 10 attempts
}
