"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { ThemeProvider } from '@/lib/theme-provider';

type TenantBrand = { brand_theme?: { brand?: { primary?: string; secondary?: string } } } | null;
export default function BrandingSettings() {
  const [tenant, setTenant] = React.useState<TenantBrand>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [previewTab, setPreviewTab] = React.useState<'admin'|'customer'|'documents'>('admin');
  React.useEffect(() => {
    (async () => {
      const res = await fetch('/api/settings/tenant');
      const json = await res.json();
      if (json?.success === false) return;
      setTenant(json.data?.tenant || json.tenant || null);
    })();
  }, []);
  async function onSave() {
    setSaving(true);
    try {
      setSaveError(null);
      setSaveSuccess(null);
      const res = await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand_theme: tenant?.brand_theme || {} }) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error?.message || 'Failed to save');
      setSaveSuccess('Branding saved');
      // Notify BrandProvider to re-apply palette immediately
      try { window.dispatchEvent(new Event('brand-updated')); } catch {}
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (e) {
      setSaveError((e as Error)?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  // Preset palettes (Professional, Growth, Slate, Bold, Bronze)
  const presets: Array<{ name: string; value: string }> = [
    { name: 'Professional Blue', value: '#2563EB' },
    { name: 'Growth Green', value: '#10B981' },
    { name: 'Premium Slate', value: '#475569' },
    { name: 'Bold Purple', value: '#7C3AED' },
    { name: 'Warm Bronze', value: '#92400E' },
  ];

  // Contrast helpers (WCAG)
  function hexToRgb(hex: string) {
    const s = hex.replace('#','');
    const n = s.length === 3 ? s.split('').map(c=>c+c).join('') : s;
    const num = parseInt(n,16);
    return { r: (num>>16)&255, g: (num>>8)&255, b: num&255 };
  }
  function relativeLuminance(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    const srgb = [r,g,b].map(v => v/255).map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
    return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
  }
  function contrastRatio(hex1: string, hex2: string) {
    const L1 = relativeLuminance(hex1);
    const L2 = relativeLuminance(hex2);
    const [a,b] = L1 > L2 ? [L1,L2] : [L2,L1];
    return (a + 0.05) / (b + 0.05);
  }
  function deriveForeground(hex: string) {
    // Simple foreground derivation: choose white or near-black based on luminance
    const L = relativeLuminance(hex);
    return L > 0.5 ? '#111827' : '#FFFFFF';
  }
  function findAccessible(hex: string, minRatio = 4.5) {
    // Adjust lightness until ratio with derived foreground passes
    let candidate = hex;
    let fg = deriveForeground(candidate);
    let ratio = contrastRatio(candidate, fg);
    if (ratio >= minRatio) return { color: candidate, fg, ratio };
    // Try stepping towards darker or lighter depending on current fg
    const darken = (h: string, step: number) => {
      const { r,g,b } = hexToRgb(h);
      const f = Math.max(0, 1 - step);
      const nr = Math.round(r*f), ng = Math.round(g*f), nb = Math.round(b*f);
      const v = (nr<<16) | (ng<<8) | nb;
      return '#'+v.toString(16).padStart(6,'0');
    };
    const lighten = (h: string, step: number) => {
      const { r,g,b } = hexToRgb(h);
      const nr = Math.round(r + (255-r)*step);
      const ng = Math.round(g + (255-g)*step);
      const nb = Math.round(b + (255-b)*step);
      const v = (nr<<16) | (ng<<8) | nb;
      return '#'+v.toString(16).padStart(6,'0');
    };
    for (let s = 0.02; s <= 0.5; s += 0.02) {
      const tryColors = [darken(hex, s), lighten(hex, s)];
      for (const c of tryColors) {
        const f = deriveForeground(c);
        const r = contrastRatio(c, f);
        if (r >= minRatio) return { color: c, fg: f, ratio: r };
      }
    }
    return { color: hex, fg, ratio };
  }

  const primary = tenant?.brand_theme?.brand?.primary || '#2563EB';
  const fg = deriveForeground(primary);
  const ratio = contrastRatio(primary, fg);
  const passes = ratio >= 4.5;

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Your Brand Settings</h1>
        {!tenant ? <div>Loading…</div> : (
          <div className="grid gap-4" data-testid="branding-form">
            {saveError ? <div className="text-[var(--color-danger)]">{saveError}</div> : null}
            {saveSuccess ? <div className="text-[var(--color-success)]">{saveSuccess}</div> : null}
            {/* Identity */}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
              <div className="font-medium">Identity</div>
              <div className="text-[var(--color-text-secondary)] text-sm">Upload your logo and set brand colors.</div>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="w-24 h-24 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-text-muted)]">Logo</div>
                <div className="flex-1 grid gap-2">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Brand Color</div>
                    {/* Preset palette */}
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p) => (
                        <button key={p.value} type="button" onClick={() => setTenant({ ...tenant!, brand_theme: { ...(tenant!.brand_theme||{}), brand: { ...(tenant!.brand_theme?.brand||{}), primary: p.value } } })} className="w-8 h-8 rounded-md border border-[var(--color-border)]" style={{ background: p.value }} title={p.name} aria-label={p.name} />
                      ))}
                    </div>
                    {/* Custom picker */}
                    <div className="flex items-center gap-2">
                      <input type="color" aria-label="Pick brand color" value={primary} onChange={(e) => setTenant({ ...tenant!, brand_theme: { ...(tenant!.brand_theme||{}), brand: { ...(tenant!.brand_theme?.brand||{}), primary: e.target.value } } })} />
                      <Input placeholder="#2563EB" value={primary} onChange={(e) => setTenant({ ...tenant!, brand_theme: { ...(tenant!.brand_theme||{}), brand: { ...(tenant!.brand_theme?.brand||{}), primary: e.target.value } } })} data-testid="branding-primary" />
                      <Button type="button" intent="secondary" size="sm" onClick={() => {
                        const fixed = findAccessible(primary);
                        setTenant({ ...tenant!, brand_theme: { ...(tenant!.brand_theme||{}), brand: { ...(tenant!.brand_theme?.brand||{}), primary: fixed.color } } });
                      }}>Fix automatically</Button>
                    </div>
                    {/* Contrast badge */}
                    <div className="text-sm">
                      <span className={`inline-flex items-center gap-2 px-2 py-1 rounded border ${passes ? 'border-[var(--color-success)] text-[var(--color-success)]' : 'border-[var(--color-error)] text-[var(--color-error)]'}`}>
                        Contrast {ratio.toFixed(2)}:1 {passes ? 'AA Pass' : 'Fail'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <ThemeProvider>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)]">
                  <button onClick={() => setPreviewTab('admin')} className={`text-sm px-2 py-1 rounded ${previewTab==='admin' ? 'bg-[var(--color-active-surface)]' : ''}`}>Admin</button>
                  <button onClick={() => setPreviewTab('customer')} className={`text-sm px-2 py-1 rounded ${previewTab==='customer' ? 'bg-[var(--color-active-surface)]' : ''}`}>Customer</button>
                  <button onClick={() => setPreviewTab('documents')} className={`text-sm px-2 py-1 rounded ${previewTab==='documents' ? 'bg-[var(--color-active-surface)]' : ''}`}>Documents</button>
                  <div className="ml-auto text-[var(--color-text-muted)] text-xs">Where it appears: navigation, buttons, status, charts</div>
                </div>
                <div className="p-3">
                  <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                    {/* Header using selected color (preview only) */}
                    <div className="h-10 flex items-center px-3" style={{ background: primary, color: fg }}>Brand Header</div>
                    <div className="p-3 grid gap-3">
                      <div className="flex gap-2">
                        <button className="rounded-[var(--radius-sm)] px-3 py-1" style={{ background: primary, color: fg }}>Primary Button</button>
                        <button className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1">Secondary</button>
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">Sample cards and KPI tiles reflect brand accents.</div>
                    </div>
                  </div>
                </div>
              </div>
            </ThemeProvider>
            <div className="flex justify-between items-center">
              <Button intent="ghost" type="button" onClick={() => setTenant({ ...tenant!, brand_theme: { brand: { primary: '#2563EB' } } })}>Reset to defaults</Button>
              <Button onClick={onSave} disabled={saving || !passes} data-testid="branding-save">{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


