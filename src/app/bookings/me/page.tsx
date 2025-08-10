"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import Link from 'next/link';

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  payment_status: string;
  price_breakdown: { total: number };
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  React.useEffect(() => {
    (async () => {
      const data = await api<{ ok: boolean; bookings: Booking[] }>(`/api/bookings`);
      setBookings(data.bookings || []);
    })();
  }, []);
  return (
    <DashboardShell role="customer" tenantName="DetailFlow">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">My Bookings</h1>
        <Link href="/book/new"><Button intent="primary">New Booking</Button></Link>
      </div>
      {bookings.length === 0 ? (
        <div className="text-[var(--color-text-muted)]">No bookings yet.</div>
      ) : (
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
              <div className="flex gap-2">
                <Link href={`/bookings/${b.id}`}><Button intent="ghost">Details</Button></Link>
                <Button intent="secondary" disabled>Reschedule</Button>
                <Button intent="destructive" disabled>Cancel</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}


