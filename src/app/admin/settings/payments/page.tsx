"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

type TenantPay = { stripe_public_key?: string; is_demo?: boolean } | null;

export default function PaymentSettings() {
  const [tenant, setTenant] = React.useState<TenantPay>(null);
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
      await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stripe_public_key: tenant?.stripe_public_key || '' }) });
    } finally { setSaving(false); }
  }
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Payments</h1>
        {!tenant ? <div>Loading…</div> : (
          <div className="grid gap-4">
            {tenant?.is_demo ? <div className="text-[var(--color-warning)]">Demo tenant: Stripe live keys are blocked.</div> : null}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
              <div className="font-medium">Stripe</div>
              <Input placeholder="Publishable key" value={tenant.stripe_public_key || ''} onChange={(e) => setTenant({ ...tenant, stripe_public_key: e.target.value })} />
            </div>
            <div className="flex justify-end"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


