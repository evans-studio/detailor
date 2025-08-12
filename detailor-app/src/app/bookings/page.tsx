"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import Link from 'next/link';
import { subscribeBookings, subscribePayments } from '@/lib/realtime';
import { useNotifications } from '@/lib/notifications';
import { Select } from '@/ui/select';
import { Input } from '@/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  payment_status: string;
  price_breakdown: { total: number };
};

export default function BookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [role, setRole] = React.useState<'admin' | 'customer'>('admin');
  const [tenantId, setTenantId] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [q, setQ] = React.useState<string>('');
  const [view, setView] = React.useState<'list' | 'table'>('list');
  const { notify } = useNotifications();
  // load user profile for role/tenant
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api<{ ok: boolean; profile: { role: 'admin'|'staff'|'customer'; tenant_id?: string } }>(`/api/profiles/me`)).profile,
  });
  React.useEffect(() => {
    if (!me) return;
    setRole(me.role === 'customer' ? 'customer' : 'admin');
    setTenantId(me.tenant_id || '');
  }, [me]);
  useQuery({
    queryKey: ['bookings', { status, from, to, q }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      if (q) qs.set('q', q);
      const url = `/api/bookings${qs.toString() ? `?${qs.toString()}` : ''}`;
      const data = await api<{ ok: boolean; bookings: Booking[] }>(url);
      setBookings(data.bookings || []);
      return data.bookings || [];
    },
  });

  // Realtime subscriptions
  React.useEffect(() => {
    if (!tenantId) return;
    const unsubBookings = subscribeBookings(tenantId, ({ type, record }) => {
      if (type === 'INSERT') {
        setBookings((b) => [record as unknown as Booking, ...b]);
        notify({ title: 'New booking received' });
      }
      if (type === 'UPDATE') {
        setBookings((b) => b.map((x) => (x.id === record.id ? (record as unknown as Booking) : x)));
        notify({ title: 'Booking updated', description: `Status: ${record.status}` });
      }
    });
    const unsubPayments = subscribePayments(tenantId, ({ type, record }) => {
      if (type === 'INSERT' || type === 'UPDATE') {
        notify({ title: 'Payment update', description: `${record.status}${record.amount ? ` £${record.amount}` : ''}` });
      }
    });
    return () => {
      unsubBookings();
      unsubPayments();
    };
  }, [notify, tenantId]);
  return (
    <DashboardShell role={role} tenantName="Detailor">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">Bookings</h1>
        <div className="flex items-center gap-2">
          <Button intent={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')}>List</Button>
          <Button intent={view === 'table' ? 'primary' : 'ghost'} onClick={() => setView('table')}>Table</Button>
          <Link href="/quotes"><Button intent="primary">New Booking</Button></Link>
        </div>
      </div>
        <div className="flex items-end gap-2 mb-3">
        <div>
          <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">Status</div>
          <Select
            options={[{ label: 'All', value: 'all' }, { label: 'Pending', value: 'pending' }, { label: 'Confirmed', value: 'confirmed' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }]}
            value={status || 'all'}
            onValueChange={(v) => setStatus(v === 'all' ? '' : v)}
          />
        </div>
          <div>
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">Search</div>
            <Input placeholder="Reference…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
          </div>
        <div>
          <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">From</div>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 220 }} />
        </div>
        <div>
          <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">To</div>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 220 }} />
        </div>
      </div>
      {bookings.length === 0 ? (
        <div className="text-[var(--color-text-muted)]">No bookings yet. Create one to get started.</div>
      ) : view === 'list' ? (
        <div className="grid gap-2">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{new Date(b.start_at).toLocaleString()}</div>
                  <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">Total £{b.price_breakdown?.total ?? 0}</div>
                </div>
                <Badge intent="info">{b.status}</Badge>
                <Badge intent={b.payment_status === 'paid' ? 'success' : 'warning'}>{b.payment_status}</Badge>
              </div>
              <Link href={`/bookings/${b.id}`}><Button intent="ghost">Details</Button></Link>
            </div>
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>Status</TH>
              <TH>Payment</TH>
              <TH>Total</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {bookings.map((b) => (
              <TR key={b.id}>
                <TD>{new Date(b.start_at).toLocaleString()}</TD>
                <TD>{b.status}</TD>
                <TD>{b.payment_status}</TD>
                <TD>£{b.price_breakdown?.total ?? 0}</TD>
                <TD><Link href={`/bookings/${b.id}`}><Button intent="ghost">Details</Button></Link></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </DashboardShell>
  );
}


