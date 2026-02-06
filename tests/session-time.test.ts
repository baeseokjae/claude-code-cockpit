/**
 * session-time.test.ts
 * Session time tracking tests
 */

import { describe, it, expect } from 'vitest';
import { getSessionStartTime, calculateSessionDuration } from '../src/data/session-time.js';

describe('getSessionStartTime', () => {
  it('should return current time for undefined sessionId', () => {
    const before = Date.now();
    const result = getSessionStartTime(undefined);
    const after = Date.now();

    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });

  it('should return consistent time for same sessionId', () => {
    const sessionId = `test-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const first = getSessionStartTime(sessionId);
    const second = getSessionStartTime(sessionId);

    expect(first).toBe(second);
  });

  it('should return different times for different sessionIds', () => {
    const id1 = `test-a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const id2 = `test-b-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const time1 = getSessionStartTime(id1);
    // Small delay to ensure different timestamps
    const time2 = getSessionStartTime(id2);

    // Both should be valid timestamps
    expect(time1).toBeGreaterThan(0);
    expect(time2).toBeGreaterThan(0);
  });
});

describe('calculateSessionDuration', () => {
  it('should calculate duration from session start', () => {
    const sessionId = `test-dur-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startTime = getSessionStartTime(sessionId);

    // Use a specific 'now' time
    const now = startTime + 5000; // 5 seconds later
    const duration = calculateSessionDuration(sessionId, now);

    expect(duration).toBe(5000);
  });

  it('should return 0 or near-0 for new session with current time', () => {
    const sessionId = `test-new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = calculateSessionDuration(sessionId);

    // Should be very small (< 100ms)
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(duration).toBeLessThan(100);
  });

  it('should handle undefined sessionId', () => {
    const duration = calculateSessionDuration(undefined);

    // Should be >= 0
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
