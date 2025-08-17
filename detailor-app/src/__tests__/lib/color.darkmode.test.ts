import { describe, it, expect } from 'vitest';
import { buildBrandCSSVariables, contrastRatio } from '@/lib/color';

const samplePrimaries = ['#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4'];

describe('brand color contrast across modes', () => {
  for (const color of samplePrimaries) {
    it(`primary foreground AA for ${color} in light mode`, () => {
      const vars = buildBrandCSSVariables(color, undefined, 'light');
      const bg = vars['--color-primary'];
      const fg = vars['--color-primary-foreground'];
      expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(4.5);
    });
    it(`primary foreground AA for ${color} in dark mode`, () => {
      const vars = buildBrandCSSVariables(color, undefined, 'dark');
      const bg = vars['--color-primary'];
      const fg = vars['--color-primary-foreground'];
      expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});


