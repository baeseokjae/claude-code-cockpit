/**
 * Tests for rendering utility functions
 */

import { describe, it, expect } from 'vitest';
import { visualLength } from '../src/render/utils.js';

describe('visualLength', () => {
  it('should correctly measure ASCII characters', () => {
    expect(visualLength('abc')).toBe(3);
    expect(visualLength('Hello World')).toBe(11);
    expect(visualLength('test123')).toBe(7);
  });

  it('should correctly measure 한글 (Korean)', () => {
    expect(visualLength('한글')).toBe(4);
    expect(visualLength('한글테스트')).toBe(10);
    expect(visualLength('프로젝트')).toBe(8);
  });

  it('should correctly measure 일본어 (Japanese)', () => {
    expect(visualLength('日本語')).toBe(6);
    expect(visualLength('ひらがな')).toBe(8);
    expect(visualLength('カタカナ')).toBe(8);
  });

  it('should correctly measure 한자 (Chinese)', () => {
    expect(visualLength('中文')).toBe(4);
    expect(visualLength('测试')).toBe(4);
  });

  it('should ignore ANSI codes and measure actual content', () => {
    expect(visualLength('\x1b[31m에러\x1b[0m')).toBe(4);
    expect(visualLength('\x1b[32mテスト\x1b[0m')).toBe(6);
    expect(visualLength('\x1b[1;32mSuccess\x1b[0m')).toBe(7);
  });

  it('should correctly measure mixed content', () => {
    expect(visualLength('Code 코드')).toBe(9); // 'Code ' (5) + '코드' (4)
    expect(visualLength('Test 테스트')).toBe(11); // 'Test ' (5) + '테스트' (6)
    expect(visualLength('日本語 Japanese')).toBe(15); // '日本語' (6) + ' Japanese' (9)
  });

  it('should handle empty string', () => {
    expect(visualLength('')).toBe(0);
  });

  it('should handle only ANSI codes', () => {
    expect(visualLength('\x1b[31m\x1b[0m')).toBe(0);
  });
});
