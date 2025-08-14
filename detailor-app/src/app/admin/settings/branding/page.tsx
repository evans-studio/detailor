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
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (e) {
      setSaveError((e as Error)?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Branding</h1>
        {!tenant ? <div>Loading…</div> : (
          <div className="grid gap-4">
            {saveError ? <div className="text-[var(--color-danger)]">{saveError}</div> : null}
            {saveSuccess ? <div className="text-[var(--color-success)]">{saveSuccess}</div> : null}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
              <div className="font-medium">Colors</div>
              <Input placeholder="Primary" value={tenant.brand_theme?.brand?.primary || ''} onChange={(e) => setTenant({ ...tenant, brand_theme: { ...(tenant.brand_theme||{}), brand: { ...(tenant.brand_theme?.brand||{}), primary: e.target.value } } })} />
              <Input placeholder="Secondary" value={tenant.brand_theme?.brand?.secondary || ''} onChange={(e) => setTenant({ ...tenant, brand_theme: { ...(tenant.brand_theme||{}), brand: { ...(tenant.brand_theme?.brand||{}), secondary: e.target.value } } })} />
            </div>
            <ThemeProvider>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="font-medium mb-2">Live Preview</div>
                <button className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-1 text-[var(--color-primary-foreground)]">Primary Button</button>
              </div>
            </ThemeProvider>
            <div className="flex justify-end"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


