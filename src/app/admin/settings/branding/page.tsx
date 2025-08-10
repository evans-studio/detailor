"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

type TenantBrand = { brand_theme?: { brand?: { primary?: string; secondary?: string } } } | null;
export default function BrandingSettings() {
  const [tenant, setTenant] = React.useState<TenantBrand>(null);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const res = await fetch('/api/settings/tenant');
      const json = await res.json();
      setTenant(json.tenant || null);
    })();
  }, []);
  async function onSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand_theme: tenant?.brand_theme || {} }) });
    } finally {
      setSaving(false);
    }
  }
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Branding</h1>
        {!tenant ? <div>Loading…</div> : (
          <div className="grid gap-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
              <div className="font-medium">Colors</div>
              <Input placeholder="Primary" value={tenant.brand_theme?.brand?.primary || ''} onChange={(e) => setTenant({ ...tenant, brand_theme: { ...(tenant.brand_theme||{}), brand: { ...(tenant.brand_theme?.brand||{}), primary: e.target.value } } })} />
              <Input placeholder="Secondary" value={tenant.brand_theme?.brand?.secondary || ''} onChange={(e) => setTenant({ ...tenant, brand_theme: { ...(tenant.brand_theme||{}), brand: { ...(tenant.brand_theme?.brand||{}), secondary: e.target.value } } })} />
            </div>
            <div className="flex justify-end"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


