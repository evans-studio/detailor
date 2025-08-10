"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  type Booking = { id: string; start_at: string; status: string; payment_status: string; price_breakdown?: { total?: number } };
  const [data, setData] = React.useState<Booking | null>(null);
  React.useEffect(() => {
    (async () => {
      const list = await api<{ ok: boolean; bookings: Booking[] }>(`/api/bookings`);
      setData(list.bookings.find((b) => b.id === id) || null);
    })();
  }, [id]);
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
          <div className="grid gap-1">
            <div>Date: {new Date(data.start_at).toLocaleString()}</div>
            <div>Price: £{data.price_breakdown?.total ?? 0}</div>
          </div>
          <div className="flex gap-2">
            <Button intent="primary">Confirm</Button>
            <Button intent="destructive">Cancel</Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}


