"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type TenantSettings = { id: string; trading_name?: string; legal_name?: string; contact_email?: string; plan_id?: string } | null;
export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant'],
    queryFn: async (): Promise<TenantSettings> => {
      const res = await fetch('/api/settings/tenant');
      const json = await res.json();
      return json.tenant || null;
    },
  });
  const [draft, setDraft] = React.useState<TenantSettings>(null);
  React.useEffect(() => { setDraft(tenant ?? null); }, [tenant]);
  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        trading_name: draft?.trading_name,
        legal_name: draft?.legal_name,
        contact_email: draft?.contact_email,
        plan_id: draft?.plan_id,
      }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });
  async function onSave() { await saveMutation.mutateAsync(); }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Settings</h1>
        {isLoading || !draft ? (
          <div>Loading…</div>
        ) : (
          <div className="grid gap-4">
            <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="font-medium mb-2">Business Info</div>
              <div className="grid gap-2">
                <Input placeholder="Trading name" value={draft.trading_name || ''} onChange={(e) => setDraft({ ...draft, trading_name: e.target.value })} />
                <Input placeholder="Legal name" value={draft.legal_name || ''} onChange={(e) => setDraft({ ...draft, legal_name: e.target.value })} />
                <Input type="email" placeholder="Contact email" value={draft.contact_email || ''} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} />
              </div>
            </section>
            <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="font-medium mb-2">Plan</div>
              <Select
                options={[{ label: 'Starter', value: 'starter' }, { label: 'Pro', value: 'pro' }]}
                value={draft.plan_id || 'starter'}
                onValueChange={(v) => setDraft({ ...draft, plan_id: v })}
              />
            </section>
            <div className="flex justify-end"><Button onClick={onSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


