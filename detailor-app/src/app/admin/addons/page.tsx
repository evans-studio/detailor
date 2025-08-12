"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

type Addon = { id: string; name: string; description?: string; visible: boolean; sort_order?: number };

export default function AdminAddonsPage() {
  const qc = useQueryClient();
  const { data: addons = [] } = useQuery<Addon[]>({
    queryKey: ['addOns'],
    queryFn: async () => (await (await fetch('/api/admin/addons')).json()).addons || [],
  });
  const create = useMutation({
    mutationFn: async (body: { name: string }) => {
      await fetch('/api/admin/addons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addOns'] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Addon> }) => {
      await fetch(`/api/admin/addons/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addOns'] }),
  });
  const [name, setName] = React.useState('');
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">Add-ons</h1>
          <div className="flex gap-2"><Input placeholder="Add-on name" value={name} onChange={(e) => setName(e.target.value)} /><Button onClick={() => name && create.mutate({ name })} disabled={!name || create.isPending}>Add</Button></div>
        </div>
        <div className="grid gap-2">
          {addons.length === 0 ? <div className="text-[var(--color-text-muted)]">No add-ons yet.</div> : addons
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((a, idx) => (
            <div key={a.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center gap-3">
                <input className="w-48 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1" defaultValue={a.name} onBlur={(e) => update.mutate({ id: a.id, patch: { name: e.target.value } })} />
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={a.visible} onChange={(e) => update.mutate({ id: a.id, patch: { visible: e.target.checked } })} /> Visible</label>
              </div>
              <div className="flex items-center gap-2">
                <Button intent="ghost" onClick={() => update.mutate({ id: a.id, patch: { sort_order: (a.sort_order ?? idx) - 1 } })}>↑</Button>
                <Button intent="ghost" onClick={() => update.mutate({ id: a.id, patch: { sort_order: (a.sort_order ?? idx) + 1 } })}>↓</Button>
              </div>
            </div>
          ))}
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


