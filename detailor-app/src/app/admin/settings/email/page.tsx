"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

type TenantEmail = { reply_to?: string; sender_domain?: string } | null;

export default function EmailSettings() {
  const [tenant, setTenant] = React.useState<TenantEmail>(null);
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
      await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply_to: tenant?.reply_to || '', sender_domain: tenant?.sender_domain || '' }) });
    } finally { setSaving(false); }
  }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Email Settings</h1>
        {!tenant ? <div>Loading…</div> : (
          <div className="grid gap-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
              <div className="font-medium">Sender & Reply-To</div>
              <Input placeholder="Reply-To email" value={tenant.reply_to || ''} onChange={(e) => setTenant({ ...tenant, reply_to: e.target.value })} />
              <Input placeholder="Sender domain" value={tenant.sender_domain || ''} onChange={(e) => setTenant({ ...tenant, sender_domain: e.target.value })} />
            </div>
            <div className="flex justify-end"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


