"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/ui/badge';
import { StripeTestBadge } from '@/components/StripeTestBadge';

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  type Booking = { id: string; start_at: string; status: string; payment_status: string; price_breakdown?: { total?: number } };
  type Invoice = { id: string; number: string; total: number; paid_amount: number; balance: number };
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async (): Promise<Booking | null> => {
      const res = await fetch(`/api/bookings/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to load booking');
      return json.data?.booking || json.booking || null;
    },
  });
  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ['invoices', { bookingId: id }],
    queryFn: async (): Promise<Invoice[]> => {
      const res = await fetch(`/api/invoices?booking_id=${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to load invoices');
      return json.data?.invoices || json.invoices || [];
    },
    enabled: Boolean(id),
  });
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [action, setAction] = React.useState<'confirm'|'cancel'|null>(null);
  const updateStatus = useMutation({
    mutationFn: async (newStatus: 'confirmed' | 'cancelled') => {
      if (!data) return;
      await fetch(`/api/bookings/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['booking', id] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
  async function collectDeposit() {
    if (!data) return;
    try {
      const total = Math.round(Number(data.price_breakdown?.total || 0) * 100);
      // Resolve tenant deposit preferences
      let depositPercent = 20; let minGbp = 5;
      try {
        const t = await fetch('/api/settings/tenant');
        const tj = await t.json();
        const prefs = tj?.data?.tenant?.business_prefs || tj?.tenant?.business_prefs || {};
        depositPercent = Number(prefs.deposit_percent ?? 20);
        minGbp = Number(prefs.deposit_min_gbp ?? 5);
      } catch {}
      const deposit = Math.max(minGbp * 100, Math.round(total * (depositPercent / 100)));
      const res = await fetch('/api/payments/checkout-booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, deposit_amount: deposit, currency: 'gbp', booking_reference: data.id })
      });
      const json = await res.json();
      const url = json?.data?.url || json?.url;
      if (url) window.open(url as string, '_blank');
    } catch {}
  }
  async function collectBalance(inv: Invoice) {
    try {
      const res = await fetch('/api/payments/checkout-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: inv.id }) });
      const json = await res.json();
      const url = json?.data?.url || json?.url;
      if (url) window.open(url as string, '_blank');
    } catch {}
  }
  async function onConfirmAction() {
    if (!data || !action) return;
    await updateStatus.mutateAsync(action === 'confirm' ? 'confirmed' : 'cancelled');
    setConfirmOpen(false); setAction(null);
  }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      {isLoading || !data ? (
        <div>Loading…</div>
      ) : (
        <div className="grid gap-3">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">Booking Detail</h1>
          <div className="flex items-center gap-2">
            <Badge intent="info">{data.status}</Badge>
            <Badge intent={data.payment_status === 'paid' ? 'success' : 'warning'}>{data.payment_status}</Badge>
          </div>
          <StripeTestBadge />
          <div className="grid gap-1">
            <div>Date: {new Date(data.start_at).toLocaleString()}</div>
            <div>Price: £{data.price_breakdown?.total ?? 0}</div>
          </div>
          {/* Payments panel */}
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="font-medium mb-2">Payments</div>
            {invLoading ? <div>Loading…</div> : (
              <div className="grid gap-2">
                {invoices.length === 0 ? (
                  <div className="text-[var(--color-text-muted)]">No invoice yet.</div>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between">
                      <div className="text-[var(--color-text)]">
                        Invoice {inv.number} • Balance £{Number(inv.balance ?? Math.max(0, (inv.total||0) - (inv.paid_amount||0))).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        <a className="underline" href={`/api/invoices/${inv.id}?format=pdf`} target="_blank" rel="noreferrer">Download</a>
                        {Number(inv.balance) > 0 ? (
                          <Button size="sm" onClick={() => collectBalance(inv)}>Collect Balance</Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
                {data.payment_status !== 'paid' ? (
                  <Button intent="secondary" onClick={collectDeposit}>Collect Deposit</Button>
                ) : null}
              </div>
            )}
          </div>
          <div className="fixed inset-x-0 bottom-2 z-40 mx-auto flex max-w-xl justify-center gap-2 md:static md:justify-start">
            <Button intent="primary" onClick={() => { setAction('confirm'); setConfirmOpen(true); }}>Confirm</Button>
            <Button intent="destructive" onClick={() => { setAction('cancel'); setConfirmOpen(true); }}>Cancel</Button>
          </div>
          <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title={action === 'cancel' ? 'Cancel booking?' : 'Confirm booking?'} description={action === 'cancel' ? 'This will cancel the booking (demo policy applies).' : 'This will confirm the booking.'} confirmText={action === 'cancel' ? 'Cancel Booking' : 'Confirm Booking'} onConfirm={onConfirmAction} />
        </div>
      )}
    </DashboardShell>
  );
}


