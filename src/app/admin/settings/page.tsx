"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';

type TenantSettings = { id: string; trading_name?: string; legal_name?: string; contact_email?: string; plan_id?: string } | null;
export default function AdminSettingsPage() {
  const [tenant, setTenant] = React.useState<TenantSettings>(null);
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
      await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        trading_name: tenant?.trading_name,
        legal_name: tenant?.legal_name,
        contact_email: tenant?.contact_email,
        plan_id: tenant?.plan_id,
      }) });
    } finally {
      setSaving(false);
    }
  }
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Settings</h1>
        {!tenant ? (
          <div>Loading…</div>
        ) : (
          <div className="grid gap-4">
            <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="font-medium mb-2">Business Info</div>
              <div className="grid gap-2">
                <Input placeholder="Trading name" value={tenant.trading_name || ''} onChange={(e) => setTenant({ ...tenant, trading_name: e.target.value })} />
                <Input placeholder="Legal name" value={tenant.legal_name || ''} onChange={(e) => setTenant({ ...tenant, legal_name: e.target.value })} />
                <Input type="email" placeholder="Contact email" value={tenant.contact_email || ''} onChange={(e) => setTenant({ ...tenant, contact_email: e.target.value })} />
              </div>
            </section>
            <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="font-medium mb-2">Plan</div>
              <Select
                options={[{ label: 'Starter', value: 'starter' }, { label: 'Pro', value: 'pro' }]}
                value={tenant.plan_id || 'starter'}
                onValueChange={(v) => setTenant({ ...tenant, plan_id: v })}
              />
            </section>
            <div className="flex justify-end"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


