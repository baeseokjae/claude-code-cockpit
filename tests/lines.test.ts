/**
 * Lines data tests
 */

import { describe, it, expect } from 'vitest';
import { getLinesData, formatLines, formatLinesCompact } from '../src/data/lines.js';
import type { StdinData } from '../src/types/index.js';

describe('getLinesData', () => {
  it('should extract lines data from stdin', () => {
    const stdin: StdinData = {
      cost: {
        total_lines_added: 152,
        total_lines_removed: 48,
      },
    };

    const result = getLinesData(stdin);

    expect(result).toEqual({
      added: 152,
      removed: 48,
      net: 104,
    });
  });

  it('should return null when both values are 0', () => {
    const stdin: StdinData = {
      cost: {
        total_lines_added: 0,
        total_lines_removed: 0,
      },
    };

    const result = getLinesData(stdin);
    expect(result).toBeNull();
  });

  it('should return null when cost is undefined', () => {
    const stdin: StdinData = {};
    const result = getLinesData(stdin);
    expect(result).toBeNull();
  });

  it('should handle missing fields as 0', () => {
    const stdin: StdinData = {
      cost: {},
    };

    const result = getLinesData(stdin);
    expect(result).toBeNull();
  });

  it('should handle only added lines', () => {
    const stdin: StdinData = {
      cost: {
        total_lines_added: 100,
      },
    };

    const result = getLinesData(stdin);

    expect(result).toEqual({
      added: 100,
      removed: 0,
      net: 100,
    });
  });

  it('should handle only removed lines', () => {
    const stdin: StdinData = {
      cost: {
        total_lines_removed: 50,
      },
    };

    const result = getLinesData(stdin);

    expect(result).toEqual({
      added: 0,
      removed: 50,
      net: -50,
    });
  });
});

describe('formatLines', () => {
  it('should format lines with standard notation', () => {
    const data = {
      added: 152,
      removed: 48,
      net: 104,
    };

    const result = formatLines(data);
    expect(result).toBe('+152 -48');
  });

  it('should handle zero values', () => {
    const data = {
      added: 0,
      removed: 0,
      net: 0,
    };

    const result = formatLines(data);
    expect(result).toBe('+0 -0');
  });

  it('should handle large numbers', () => {
    const data = {
      added: 5000,
      removed: 3000,
      net: 2000,
    };

    const result = formatLines(data);
    expect(result).toBe('+5000 -3000');
  });
});

describe('formatLinesCompact', () => {
  it('should format small numbers normally', () => {
    const data = {
      added: 152,
      removed: 48,
      net: 104,
    };

    const result = formatLinesCompact(data);
    expect(result).toBe('+152 -48');
  });

  it('should format large numbers with k suffix', () => {
    const data = {
      added: 5000,
      removed: 3000,
      net: 2000,
    };

    const result = formatLinesCompact(data);
    expect(result).toBe('+5.0k -3.0k');
  });

  it('should handle zero values', () => {
    const data = {
      added: 0,
      removed: 0,
      net: 0,
    };

    const result = formatLinesCompact(data);
    expect(result).toBe('+0 -0');
  });
});
