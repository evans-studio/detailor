"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { Button } from '@/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/ui/badge';
import { StripeTestBadge } from '@/components/StripeTestBadge';

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  type Booking = { id: string; start_at: string; status: string; payment_status: string; price_breakdown?: { total?: number } };
  const [data, setData] = React.useState<Booking | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [action, setAction] = React.useState<'confirm'|'cancel'|null>(null);
  React.useEffect(() => {
    (async () => {
      const list = await api<{ ok: boolean; bookings: Booking[] }>(`/api/bookings`);
      setData(list.bookings.find((b) => b.id === id) || null);
    })();
  }, [id]);
  async function onConfirmAction() {
    if (!data || !action) return;
    if (action === 'confirm') {
      const res = await fetch(`/api/bookings/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) });
      if (res.ok) {
        const json = await res.json(); setData(json.booking);
      }
    }
    if (action === 'cancel') {
      const res = await fetch(`/api/bookings/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
      if (res.ok) {
        const json = await res.json(); setData(json.booking);
      }
    }
    setConfirmOpen(false); setAction(null);
  }
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      {!data ? (
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


