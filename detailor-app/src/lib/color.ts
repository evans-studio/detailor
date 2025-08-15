/**
 * Color utilities for brand theming and accessibility.
 */

export type RGB = { r: number; g: number; b: number };

export function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '').trim();
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(Math.max(0, Math.min(255, Math.round(g))))}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
}

export function luminance({ r, g, b }: RGB): number {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const [L1, L2] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (L1 + 0.05) / (L2 + 0.05);
}

export function mix(hex: string, amount: number, withHex: string): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, amount, '#ffffff');
}

export function darken(hex: string, amount: number): string {
  return mix(hex, amount, '#000000');
}

/**
 * Picks black or white text to maximize contrast against background.
 * Ensures at least WCAG AA contrast for normal text (>= 4.5) where possible.
 */
export function bestTextOn(hexBackground: string): string {
  const black = '#000000';
  const white = '#ffffff';
  const blackContrast = contrastRatio(hexBackground, black);
  const whiteContrast = contrastRatio(hexBackground, white);
  return whiteContrast >= blackContrast ? white : black;
}

/**
 * Generates a 50..900 shade scale derived from a primary color.
 * The steps are tuned for visually pleasing Tailwind-like ramp.
 */
export function generatePrimaryShades(primaryHex: string): Record<string, string> {
  return {
    '50': lighten(primaryHex, 0.88),
    '100': lighten(primaryHex, 0.76),
    '200': lighten(primaryHex, 0.6),
    '300': lighten(primaryHex, 0.42),
    '400': lighten(primaryHex, 0.24),
    '500': primaryHex,
    '600': darken(primaryHex, 0.12),
    '700': darken(primaryHex, 0.24),
    '800': darken(primaryHex, 0.36),
    '900': darken(primaryHex, 0.48),
  };
}

export function ensureAAContrast(bg: string, preferredText: string): string {
  const ratio = contrastRatio(bg, preferredText);
  if (ratio >= 4.5) return preferredText;
  return bestTextOn(bg);
}

export function buildBrandCSSVariables(primary: string, secondary?: string) {
  const shades = generatePrimaryShades(primary);
  const primaryForeground = ensureAAContrast(primary, bestTextOn(primary));
  const hoverPrimary = darken(primary, 0.12);
  const selection = lighten(primary, 0.75);
  const focusRing = mix(primary, 0.5, '#ffffff');
  const vars: Record<string, string> = {
    '--color-primary': primary,
    '--color-primary-foreground': primaryForeground,
    '--color-hover-primary': hoverPrimary,
    '--color-selection': selection,
    '--color-focus-ring': focusRing,
  };
  Object.entries(shades).forEach(([k, v]) => { vars[`--color-primary-${k}`] = v; });
  if (secondary) {
    const secText = ensureAAContrast(secondary, bestTextOn(secondary));
    vars['--color-secondary'] = secondary;
    vars['--color-secondary-foreground'] = secText;
  }
  return vars;
}


