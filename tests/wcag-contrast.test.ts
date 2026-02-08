import { describe, it, expect } from 'vitest';
import { AURORA_PALETTE } from '../src/themes/palettes/aurora.js';
import { NEON_PALETTE } from '../src/themes/palettes/neon.js';
import { MONO_PALETTE } from '../src/themes/palettes/mono.js';
import { RETRO_PALETTE } from '../src/themes/palettes/retro.js';
import { ZEN_PALETTE } from '../src/themes/palettes/zen.js';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex: ${hex}`);
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(...hexToRgb(hex1));
  const l2 = relativeLuminance(...hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG AA contrast ratios', () => {
  const palettes = [
    { name: 'Aurora', palette: AURORA_PALETTE },
    { name: 'Neon', palette: NEON_PALETTE },
    { name: 'Mono', palette: MONO_PALETTE },
    { name: 'Retro', palette: RETRO_PALETTE },
    { name: 'Zen', palette: ZEN_PALETTE },
  ];

  for (const { name, palette } of palettes) {
    it(`${name}: muted vs base >= 4.5:1`, () => {
      const ratio = contrastRatio(palette.muted, palette.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it(`${name}: text vs base >= 4.5:1`, () => {
      const ratio = contrastRatio(palette.text, palette.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it(`${name}: subtext vs base >= 4.5:1`, () => {
      const ratio = contrastRatio(palette.subtext, palette.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
});
