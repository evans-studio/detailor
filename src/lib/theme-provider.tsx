"use client";
import * as React from 'react';
import master from '@/styles/palettes/master.json';
import luxury from '@/styles/palettes/luxury.json';
import bold from '@/styles/palettes/bold.json';

type Palette = {
  brand: Record<string, string>;
  neutrals: Record<string, string>;
  text: Record<string, string>;
  status: Record<string, string>;
  states: Record<string, string>;
};

function applyPaletteToCSS(palette: Palette) {
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set('--color-primary', palette.brand['primary']);
  set('--color-primary-foreground', palette.brand['primary-foreground']);
  set('--color-secondary', palette.brand['secondary']);
  set('--color-secondary-foreground', palette.brand['secondary-foreground']);
  set('--color-bg', palette.neutrals['bg']);
  set('--color-surface', palette.neutrals['surface']);
  set('--color-border', palette.neutrals['border']);
  set('--color-muted', palette.neutrals['muted']);
  set('--color-muted-foreground', palette.neutrals['muted-foreground']);
  set('--color-text', palette.text['text']);
  set('--color-text-muted', palette.text['text-muted']);
  set('--color-inverse-text', palette.text['inverse-text']);
  set('--color-success', palette.status['success']);
  set('--color-success-foreground', palette.status['success-foreground']);
  set('--color-warning', palette.status['warning']);
  set('--color-warning-foreground', palette.status['warning-foreground']);
  set('--color-error', palette.status['error']);
  set('--color-error-foreground', palette.status['error-foreground']);
  set('--color-info', palette.status['info']);
  set('--color-info-foreground', palette.status['info-foreground']);
  set('--color-focus-ring', palette.states['focus-ring']);
  set('--color-selection', palette.states['selection']);
  set('--color-hover-surface', palette.states['hover-surface']);
}

export function ThemeProvider({ children, paletteName = 'Master' }: { children: React.ReactNode; paletteName?: 'Master' | 'Luxury' | 'Bold' }) {
  React.useEffect(() => {
    const map: Record<string, Palette> = { Master: master as Palette, Luxury: luxury as Palette, Bold: bold as Palette };
    applyPaletteToCSS(map[paletteName]);
  }, [paletteName]);
  return <>{children}</>;
}


