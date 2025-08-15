"use client";
import * as React from 'react';

type Palette = {
  brand: Record<string, string>;
  neutrals: Record<string, string>;
  text: Record<string, string>;
  status: Record<string, string>;
  states: Record<string, string>;
};

export function useTenantBrand(tenantId?: string) {
  const cacheKey = `df:palette:${tenantId || 'default'}`;
  const [palette, setPalette] = React.useState<Palette | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // In-memory cache to avoid re-parsing storage repeatedly within a session
  const memoryCacheRef = React.useRef<Map<string, Palette>>(new Map());

  React.useEffect(() => {
    let cancelled = false;

    // 1) Try in-memory cache
    const fromMem = memoryCacheRef.current.get(cacheKey);
    if (fromMem) {
      setPalette(fromMem);
      setLoading(false);
    } else {
      // 2) Try sessionStorage for SSR/FOUC minimization
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const stored = JSON.parse(raw) as Palette;
          setPalette(stored);
          setLoading(false);
          memoryCacheRef.current.set(cacheKey, stored);
        }
      } catch {}
    }

    // 3) Always fetch to refresh cache in background
    (async () => {
      try {
        const url = tenantId ? `/api/brand?tenant_id=${tenantId}` : '/api/brand';
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        const next = (json?.data?.palette || json?.palette) as Palette | undefined;
        if (!cancelled) {
          if (res.ok && next) {
            setPalette(next);
            setError(null);
            memoryCacheRef.current.set(cacheKey, next);
            try { sessionStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
          } else {
            setError(json?.error?.message || 'Failed to load palette');
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // 4) On brand updates, clear caches to force refresh
    const handleBrandUpdated = () => {
      memoryCacheRef.current.delete(cacheKey);
      try { sessionStorage.removeItem(cacheKey); } catch {}
    };
    window.addEventListener('brand-updated', handleBrandUpdated as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener('brand-updated', handleBrandUpdated as EventListener);
    };
  }, [cacheKey, tenantId]);

  return { palette, loading, error } as const;
}


