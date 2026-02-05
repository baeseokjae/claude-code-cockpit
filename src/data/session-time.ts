/**
 * Session start time tracking
 * Stores session start time to calculate duration when not provided by Claude Code
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('session-time');

const SESSION_DIR = join(tmpdir(), 'cockpit-sessions');
const getSessionFile = (sessionId: string) => join(SESSION_DIR, `${sessionId}.json`);

interface SessionData {
  startTime: number;
  sessionId: string;
}

/**
 * Get or create session start time
 */
export function getSessionStartTime(sessionId: string | undefined): number {
  if (!sessionId) {
    debug('no session ID, using current time');
    return Date.now();
  }

  // Ensure session directory exists
  if (!existsSync(SESSION_DIR)) {
    try {
      mkdirSync(SESSION_DIR, { recursive: true });
    } catch (error) {
      debug('failed to create session directory:', error);
      return Date.now();
    }
  }

  const sessionFile = getSessionFile(sessionId);

  // Try to read existing session
  if (existsSync(sessionFile)) {
    try {
      const data: SessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
      debug('loaded session start time:', data.startTime);
      return data.startTime;
    } catch (error) {
      debug('failed to read session file:', error);
    }
  }

  // Create new session
  const startTime = Date.now();
  const data: SessionData = { startTime, sessionId };

  try {
    writeFileSync(sessionFile, JSON.stringify(data), 'utf8');
    debug('created new session:', sessionId, 'at', startTime);
  } catch (error) {
    debug('failed to write session file:', error);
  }

  return startTime;
}

/**
 * Calculate session duration in milliseconds
 */
export function calculateSessionDuration(sessionId: string | undefined, now: number = Date.now()): number {
  const startTime = getSessionStartTime(sessionId);
  return now - startTime;
}
