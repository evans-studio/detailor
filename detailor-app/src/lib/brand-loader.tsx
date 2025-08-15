"use client";
import * as React from 'react';
import { useTenantBrand } from './use-tenant-brand';
import { useAuth } from './auth-context';

type Profile = { tenant_id?: string };
type Palette = {
  brand?: Record<string, string>;
  neutrals?: Record<string, string>;
  text?: Record<string, string>;
  status?: Record<string, string>;
  states?: Record<string, string>;
};

function applyPaletteToCSS(palette: Palette) {
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  if (!palette) return;
  const m: Palette = palette;
  if (m.brand) {
    if (m.brand.primary) set('--color-primary', m.brand.primary);
    if (m.brand['primary-foreground']) set('--color-primary-foreground', m.brand['primary-foreground']);
    if (m.brand.secondary) set('--color-secondary', m.brand.secondary);
    if (m.brand['secondary-foreground']) set('--color-secondary-foreground', m.brand['secondary-foreground']);
  }
  if (m.neutrals) {
    if (m.neutrals.bg) set('--color-bg', m.neutrals.bg);
    if (m.neutrals.surface) set('--color-surface', m.neutrals.surface);
    if (m.neutrals.border) set('--color-border', m.neutrals.border);
    if (m.neutrals.muted) set('--color-muted', m.neutrals.muted);
    if (m.neutrals['muted-foreground']) set('--color-text-muted', m.neutrals['muted-foreground']);
  }
  if (m.text) {
    if (m.text.text) set('--color-text', m.text.text);
    if (m.text['text-muted']) set('--color-text-muted', m.text['text-muted']);
    if (m.text['inverse-text']) set('--color-inverse-text', m.text['inverse-text']);
  }
  if (m.status) {
    if (m.status.success) set('--color-success', m.status.success);
    if (m.status['success-foreground']) set('--color-success-foreground', m.status['success-foreground']);
    if (m.status.warning) set('--color-warning', m.status.warning);
    if (m.status['warning-foreground']) set('--color-warning-foreground', m.status['warning-foreground']);
    if (m.status.error) set('--color-error', m.status.error);
    if (m.status['error-foreground']) set('--color-error-foreground', m.status['error-foreground']);
    if (m.status.info) set('--color-info', m.status.info);
    if (m.status['info-foreground']) set('--color-info-foreground', m.status['info-foreground']);
  }
  if (m.states) {
    if (m.states['focus-ring']) set('--color-focus-ring', m.states['focus-ring']);
    if (m.states.selection) set('--color-selection', m.states.selection);
    if (m.states['hover-surface']) set('--color-hover-surface', m.states['hover-surface']);
  }
}

export function BrandLoader() {
  const { user, isAuthenticated, loading } = useAuth();
  const [tenantId, setTenantId] = React.useState<string | undefined>(undefined);
  const { palette } = useTenantBrand(tenantId);
  
  React.useEffect(() => {
    // Only try to load tenant branding if user is authenticated and has a profile
    if (!loading && isAuthenticated && user) {
      // Get tenant ID from user context or make API call to get tenant details
      (async () => {
        try {
          const res = await fetch('/api/tenant/me');
          if (!res.ok) return;
          const json = await res.json();
          setTenantId(json.tenant?.id);
        } catch {}
      })();
    }
  }, [user, isAuthenticated, loading]);
  
  React.useEffect(() => {
    if (palette) applyPaletteToCSS(palette as Palette);
  }, [palette]);
  
  return null;
}


