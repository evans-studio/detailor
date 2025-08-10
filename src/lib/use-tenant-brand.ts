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
  const [palette, setPalette] = React.useState<Palette | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url = tenantId ? `/api/brand?tenant_id=${tenantId}` : '/api/brand';
        const res = await fetch(url);
        const json = await res.json();
        if (json.ok) setPalette(json.palette);
        else setError(json.error || 'Failed to load palette');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId]);
  return { palette, loading, error } as const;
}


