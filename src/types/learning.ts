/**
 * Learning tracker type definitions
 * Tracks patterns and learnings from sessions
 */

export interface LearningEntry {
  id: string;
  timestamp: Date;
  category: 'pattern' | 'error' | 'optimization' | 'best-practice';
  title: string;
  description: string;
  context: string;
  tags: string[];
}

export interface LearningPattern {
  name: string;
  occurrences: number;
  lastSeen: Date;
  confidence: number; // 0-100
  examples: string[];
}

export interface LearningTracker {
  hasLearnings: boolean;
  totalEntries: number;
  sessionLearnings: LearningEntry[];
  patterns: LearningPattern[];
  recentErrors: string[];
  improvements: string[];
}
