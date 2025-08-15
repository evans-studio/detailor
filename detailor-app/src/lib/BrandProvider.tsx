"use client";
import * as React from 'react';
import { buildBrandCSSVariables } from '@/lib/color';

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const applyPalette = React.useCallback(async () => {
    try {
      // Resolve tenant id from cookie or API fallback
      let tenantId: string | null = null;
      try {
        const cookie = document.cookie.split('; ').find(c => c.startsWith('df-tenant='));
        if (cookie) tenantId = decodeURIComponent(cookie.split('=')[1]);
      } catch {}
      if (!tenantId) {
        try {
          const r = await fetch('/api/tenant/me', { cache: 'no-store' });
          const j = await r.json();
          tenantId = j?.data?.id || j?.id || null;
        } catch {}
      }

      const url = tenantId ? `/api/brand?tenant_id=${encodeURIComponent(tenantId)}` : '/api/brand';
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      const palette = json?.data?.palette || json?.palette;
      if (!palette) return;
      const root = document.documentElement;
      const set = (name: string, value?: string) => {
        if (!value) return;
        root.style.setProperty(name, value);
      };
      // Compute shades + WCAG-safe foregrounds
      const dynamicVars = buildBrandCSSVariables(String(palette.brand?.primary || '#3B82F6'), String(palette.brand?.secondary || ''));
      Object.entries(dynamicVars).forEach(([k, v]) => root.style.setProperty(k, v));
      set('--color-secondary', palette.brand?.secondary);
      set('--color-background', palette.neutrals?.bg);
      set('--color-surface', palette.neutrals?.surface);
      set('--color-border', palette.neutrals?.border);
      set('--color-text', palette.text?.text);
      set('--color-bg', palette.neutrals?.bg);
      set('--color-text-secondary', palette.text?.['text-muted']);
      set('--color-text-muted', palette.text?.['text-muted']);
      set('--color-border-strong', palette.neutrals?.border);
    } catch {
      // no-op
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await applyPalette();
    })();
    const onBrandUpdated = async () => { if (!cancelled) await applyPalette(); };
    window.addEventListener('brand-updated', onBrandUpdated as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener('brand-updated', onBrandUpdated as EventListener);
    };
  }, [applyPalette]);
  return <>{children}</>;
}


