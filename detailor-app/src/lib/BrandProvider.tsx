"use client";
import * as React from 'react';

export function BrandProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/brand', { cache: 'no-store' });
        const json = await res.json();
        const palette = json?.data?.palette || json?.palette;
        if (!palette || cancelled) return;
        const root = document.documentElement;
        const set = (name: string, value?: string) => {
          if (!value) return;
          root.style.setProperty(name, value);
        };
        set('--color-primary', palette.brand?.primary);
        set('--color-secondary', palette.brand?.secondary);
        set('--color-background', palette.neutrals?.bg);
        set('--color-surface', palette.neutrals?.surface);
        set('--color-border', palette.neutrals?.border);
        set('--color-text', palette.text?.text);
        set('--color-bg', palette.neutrals?.bg);
        set('--color-primary-foreground', palette.brand?.['primary-foreground']);
        set('--color-text-secondary', palette.text?.['text-muted']);
        set('--color-text-muted', palette.text?.['text-muted']);
        set('--color-border-strong', palette.neutrals?.border);
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return <>{children}</>;
}


