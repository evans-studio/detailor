"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

type Blackout = { id: string; starts_at: string; ends_at: string; reason?: string | null };

export default function BlackoutsSettingsPage() {
  const qc = useQueryClient();
  const { data: blackouts = [], isLoading, isError, error, refetch } = useQuery<Blackout[]>({
    queryKey: ['blackouts'],
    queryFn: async () => {
      const r = await fetch('/api/admin/availability/blackouts', { cache: 'no-store' });
      const j = await r.json();
      if (!j.success) throw new Error(j?.error?.message || 'Failed to load blackouts');
      return j.data?.blackouts || j.blackouts || [];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { starts_at: string; ends_at: string; reason?: string }) => {
      const r = await fetch('/api/admin/availability/blackouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!j.success) throw new Error(j?.error?.message || 'Failed to create blackout');
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['blackouts'] });
    }
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/availability/blackouts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const j = await r.json();
      if (!j.success) throw new Error(j?.error?.message || 'Failed to delete blackout');
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['blackouts'] });
    }
  });

  const [starts, setStarts] = React.useState('');
  const [ends, setEnds] = React.useState('');
  const [reason, setReason] = React.useState('');

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <div className="space-y-6">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">Blackouts</h1>

          <Card>
            <CardHeader><CardTitle>Add Blackout</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
              <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
              <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="md:col-span-3 flex justify-end">
                <Button onClick={() => create.mutate({ starts_at: starts, ends_at: ends, reason: reason || undefined })} disabled={create.isPending || !starts || !ends}>
                  {create.isPending ? 'Saving…' : 'Add'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Existing Blackouts</CardTitle></CardHeader>
            {isLoading ? (
              <CardContent className="p-6 text-[var(--color-text-muted)]">Loading…</CardContent>
            ) : isError ? (
              <CardContent className="p-6 text-[var(--color-danger)]">
                {(error as Error)?.message || 'Failed to load blackouts'}
                <div className="mt-3"><Button size="sm" intent="ghost" onClick={() => refetch()}>Retry</Button></div>
              </CardContent>
            ) : (
              <CardContent className="grid gap-2">
                {blackouts.length === 0 ? (
                  <div className="text-[var(--color-text-muted)]">No blackouts configured.</div>
                ) : (
                  blackouts.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div>
                        {new Date(b.starts_at).toLocaleString()} → {new Date(b.ends_at).toLocaleString()}
                        {b.reason ? ` • ${b.reason}` : ''}
                      </div>
                      <div>
                        <Button intent="destructive" size="sm" onClick={() => remove.mutate(b.id)} disabled={remove.isPending}>Delete</Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


