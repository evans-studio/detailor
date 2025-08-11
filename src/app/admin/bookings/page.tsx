"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import Link from 'next/link';

type Booking = { id: string; start_at: string; status: string; payment_status: string; price_breakdown?: { total?: number } };

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState<'all'|'pending'|'confirmed'|'in_progress'|'completed'|'cancelled'>('all');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [q, setQ] = React.useState('');
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['bookings', { status, from, to, q, scope: 'admin' }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      if (q) qs.set('q', q);
      const res = await fetch(`/api/bookings${qs.toString() ? `?${qs.toString()}` : ''}`);
      const json = await res.json();
      return json.bookings || [];
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Booking> }) => {
      await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['bookings'] });
      await qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">Bookings</h1>
          <div className="flex items-end gap-2">
            <div>
              <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">Status</div>
              <Select options={[{label:'All',value:'all'},{label:'Pending',value:'pending'},{label:'Confirmed',value:'confirmed'},{label:'In Progress',value:'in_progress'},{label:'Completed',value:'completed'},{label:'Cancelled',value:'cancelled'}]} value={status} onValueChange={(v) => setStatus(v as typeof status)} />
            </div>
            <div>
              <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">From</div>
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 200 }} />
            </div>
            <div>
              <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">To</div>
              <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 200 }} />
            </div>
            <div>
              <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">Search</div>
              <Input placeholder="Reference…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          {bookings.length === 0 ? (
            <div className="text-[var(--color-text-muted)]">No bookings found.</div>
          ) : bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{new Date(b.start_at).toLocaleString()}</div>
                  <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">Total £{b.price_breakdown?.total ?? 0}</div>
                </div>
                <span className="rounded-[var(--radius-full)] bg-[var(--color-hover-surface)] px-2 py-0.5 text-[var(--font-size-xs)]">{b.status}</span>
                <span className="rounded-[var(--radius-full)] bg-[var(--color-hover-surface)] px-2 py-0.5 text-[var(--font-size-xs)]">{b.payment_status}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/bookings/${b.id}`}><Button intent="ghost">Details</Button></Link>
                <Select
                  options={[{label:'Pending',value:'pending'},{label:'Confirmed',value:'confirmed'},{label:'In Progress',value:'in_progress'},{label:'Completed',value:'completed'},{label:'Cancelled',value:'cancelled'}]}
                  value={b.status}
                  onValueChange={(v) => update.mutate({ id: b.id, patch: { status: v as Booking['status'] } })}
                />
              </div>
            </div>
          ))}
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


