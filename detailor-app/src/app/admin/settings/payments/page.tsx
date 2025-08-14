"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

type TenantPay = { stripe_public_key?: string; is_demo?: boolean; business_prefs?: { deposit_percent?: number; deposit_min_gbp?: number } } | null;

export default function PaymentSettings() {
  const [tenant, setTenant] = React.useState<TenantPay>(null);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const res = await fetch('/api/settings/tenant');
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to load tenant settings');
      setTenant(json.data?.tenant || json.tenant || null);
    })();
  }, []);
  async function onSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stripe_public_key: tenant?.stripe_public_key || '', business_prefs: tenant?.business_prefs || {} }) });
    } finally { setSaving(false); }
  }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Payments</h1>
        {!tenant ? <div>Loading…</div> : (
          <div className="grid gap-4">
            {tenant?.is_demo ? <div className="text-[var(--color-warning)]">Demo tenant: Stripe live keys are blocked.</div> : null}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
              <div className="font-medium">Stripe</div>
              <Input placeholder="Publishable key" value={tenant.stripe_public_key || ''} onChange={(e) => setTenant({ ...tenant, stripe_public_key: e.target.value })} />
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
              <div className="font-medium">Deposit Defaults</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-1">Deposit Percentage (%)</div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={String(tenant.business_prefs?.deposit_percent ?? 20)}
                    onChange={(e) => setTenant({ ...tenant, business_prefs: { ...tenant.business_prefs, deposit_percent: Number(e.target.value || 0) } })}
                  />
                </div>
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-1">Minimum Deposit (£)</div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={String(tenant.business_prefs?.deposit_min_gbp ?? 5)}
                    onChange={(e) => setTenant({ ...tenant, business_prefs: { ...tenant.business_prefs, deposit_min_gbp: Number(e.target.value || 0) } })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


