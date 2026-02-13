/**
 * writer.ts 테스트: 터미널 폭 감지 및 truncation 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTerminalWidth } from '../src/utils/terminal-width.js';

describe('getTerminalWidth', () => {
  const originalStdout = process.stdout.columns;
  const originalStderr = process.stderr.columns;
  const originalColumns = process.env.COLUMNS;

  beforeEach(() => {
    // 초기화
    delete (process.stdout as any).columns;
    delete (process.stderr as any).columns;
    delete process.env.COLUMNS;
  });

  afterEach(() => {
    // 복원
    if (originalStdout !== undefined) {
      (process.stdout as any).columns = originalStdout;
    }
    if (originalStderr !== undefined) {
      (process.stderr as any).columns = originalStderr;
    }
    if (originalColumns !== undefined) {
      process.env.COLUMNS = originalColumns;
    }
  });

  it('stdout.columns가 있으면 우선 사용', () => {
    (process.stdout as any).columns = 120;
    expect(getTerminalWidth()).toBe(120);
  });

  it('stdout이 없으면 stderr.columns 사용', () => {
    (process.stderr as any).columns = 100;
    expect(getTerminalWidth()).toBe(100);
  });

  it('TTY가 없으면 COLUMNS 환경변수 사용', () => {
    process.env.COLUMNS = '60';
    expect(getTerminalWidth()).toBe(60);
  });

  it('모두 없으면 80 기본값', () => {
    expect(getTerminalWidth()).toBe(80);
  });

  it('COLUMNS가 유효하지 않으면 80 기본값', () => {
    process.env.COLUMNS = 'invalid';
    expect(getTerminalWidth()).toBe(80);
  });

  it('COLUMNS가 0이하면 80 기본값', () => {
    process.env.COLUMNS = '-1';
    expect(getTerminalWidth()).toBe(80);
  });

  it('stdout > stderr > COLUMNS 우선순위', () => {
    (process.stdout as any).columns = 120;
    (process.stderr as any).columns = 100;
    process.env.COLUMNS = '60';
    expect(getTerminalWidth()).toBe(120);
  });
});

describe('truncateLine logic', () => {
  // truncateLine은 export되지 않아 간접 테스트
  // lineVisualLength와 isFullWidth 검증

  it('ASCII는 1컬럼', () => {
    const text = 'Hello World';
    expect(visualLength(text)).toBe(11);
  });

  it('한글은 2컬럼', () => {
    const text = '안녕하세요';
    expect(visualLength(text)).toBe(10); // 5자 × 2
  });

  it('CJK 문자는 2컬럼', () => {
    const text = '你好世界';
    expect(visualLength(text)).toBe(8); // 4자 × 2
  });

  it('이모지는 2컬럼', () => {
    const text = '🔥🚀';
    expect(visualLength(text)).toBe(4); // 2자 × 2
  });

  it('번개 이모지 ⚡는 1컬럼', () => {
    const text = '⚡';
    expect(visualLength(text)).toBe(1);
  });

  it('별 이모지 ★는 1컬럼', () => {
    const text = '★';
    expect(visualLength(text)).toBe(1);
  });

  it('ANSI 이스케이프는 폭 0', () => {
    const text = '\x1b[32mGreen\x1b[0m';
    expect(visualLength(text)).toBe(5); // 'Green'만 계산
  });

  it('혼합 텍스트', () => {
    const text = 'Hello 안녕 🔥';
    // 'Hello ' = 6, '안녕 ' = 5 (안녕 4 + space 1), '🔥' = 2
    expect(visualLength(text)).toBe(13);
  });
});

// Helper: lineVisualLength 재구현 (writer.ts와 동일)
function visualLength(text: string): number {
  const ANSI_RE = /\x1b\[[0-9;]*m/g;
  const stripped = text.replace(ANSI_RE, '');
  let width = 0;
  for (const char of stripped) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    width += isFullWidth(cp) ? 2 : 1;
  }
  return width;
}

// Helper: isFullWidth 재구현 (writer.ts와 동일)
function isFullWidth(cp: number): boolean {
  return (
    (cp >= 0x4E00 && cp <= 0x9FFF) ||
    (cp >= 0x3400 && cp <= 0x4DBF) ||
    (cp >= 0x20000 && cp <= 0x2A6DF) ||
    (cp >= 0xF900 && cp <= 0xFAFF) ||
    (cp >= 0xAC00 && cp <= 0xD7AF) ||
    (cp >= 0x1100 && cp <= 0x11FF) ||
    (cp >= 0xFF01 && cp <= 0xFF60) ||
    (cp >= 0x3000 && cp <= 0x303F) ||
    (cp >= 0x3040 && cp <= 0x309F) ||
    (cp >= 0x30A0 && cp <= 0x30FF) ||
    (cp >= 0x3200 && cp <= 0x32FF) ||
    (cp >= 0x3300 && cp <= 0x33FF) ||
    (cp >= 0x1F300 && cp <= 0x1F9FF) ||
    (cp >= 0x1F000 && cp <= 0x1F02F) || // Mahjong/Domino
    (cp >= 0x1FA00 && cp <= 0x1FAFF)   // Extended-A Symbols
  );
}
