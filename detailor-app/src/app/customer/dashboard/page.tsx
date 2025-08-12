"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useRealtimeCustomerUpdates } from '@/lib/realtime';
import { Button } from '@/ui/button';
import Link from 'next/link';
import { Badge } from '@/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Booking = { id: string; start_at: string; status: string; payment_status: string; price_breakdown?: { total?: number } };

export default function CustomerHome() {
  const queryClient = useQueryClient();
  
  // System Bible Pattern: Real-time customer updates
  useRealtimeCustomerUpdates('detail-flow', undefined, true);
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', { scope: 'customer-home' }],
    queryFn: async (): Promise<Booking[]> => {
      const list = await api<{ ok: boolean; bookings: Booking[] }>(`/api/bookings`);
      return list.bookings || [];
    },
  });
  const nextBooking = React.useMemo(() => (
    bookings
      .filter((b) => new Date(b.start_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0] || null
  ), [bookings]);

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return (
    <DashboardShell role="customer" tenantName="DetailFlow">
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">Welcome</h1>
          <Link href="/book/new"><Button intent="primary">Book again</Button></Link>
        </div>
        {nextBooking ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Next booking</div>
                <div>{new Date(nextBooking.start_at).toLocaleString()}</div>
                <div className="text-[var(--color-text-muted)]">Total £{nextBooking.price_breakdown?.total ?? 0}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge intent="info">{nextBooking.status}</Badge>
                <Badge intent={nextBooking.payment_status === 'paid' ? 'success' : 'warning'}>{nextBooking.payment_status}</Badge>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/bookings/${nextBooking.id}`}><Button>View</Button></Link>
              <Button intent="secondary" disabled>Reschedule</Button>
              <Button intent="destructive" onClick={() => cancelMutation.mutate(nextBooking.id)} disabled={cancelMutation.isPending}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="font-medium mb-1">No upcoming bookings</div>
            <div className="text-[var(--color-text-muted)] mb-2">You can book a new service in minutes.</div>
            <Link href="/book/new"><Button intent="primary">Book a service</Button></Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/book/new" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">Quick: Book again</Link>
          <Link href="/customer/vehicles" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">Add vehicle</Link>
          <Link href="/customer/addresses" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">Add address</Link>
        </div>
      </div>
    </DashboardShell>
  );
}


