import { describe, it, expect } from 'vitest';
import { buildBrandCSSVariables, contrastRatio } from '@/lib/color';

describe('color accessibility', () => {
  it('ensures primary foreground has at least AA contrast', () => {
    const vars = buildBrandCSSVariables('#3B82F6');
    const bg = vars['--color-primary'];
    const fg = vars['--color-primary-foreground'];
    expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(4.5);
  });
});


