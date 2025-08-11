"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', { scope: 'me' }],
    queryFn: async (): Promise<Booking[]> => (await api<{ ok: boolean; bookings: Booking[] }>(`/api/bookings`)).bookings || [],
  });
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
                {b.payment_status !== 'paid' ? (
                  <Button
                    intent="primary"
                    onClick={async () => {
                      // Find invoice for this booking and open checkout
                      try {
                        const res = await fetch(`/api/invoices?booking_id=${b.id}`);
                        const json = await res.json();
                        const inv = (json?.invoices || [])[0];
                        if (inv?.id) {
                          const pay = await fetch('/api/payments/checkout-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: inv.id }) });
                          const pj = await pay.json();
                          if (pj?.url) window.location.href = pj.url as string;
                        }
                      } catch {}
                    }}
                  >
                    Pay now
                  </Button>
                ) : null}
                <Button intent="destructive" onClick={() => cancelMutation.mutate(b.id)} disabled={cancelMutation.isPending}>Cancel</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}


