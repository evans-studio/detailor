"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeAdminUpdates } from '@/lib/realtime';
import { Card, CardContent } from '@/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Button } from '@/ui/button';

type Payment = {
  id: string;
  tenant_id: string;
  booking_id: string | null;
  invoice_id: string | null;
  provider: 'stripe' | 'paypal' | 'cash';
  amount: number;
  currency: string;
  status: 'requires_action'|'pending'|'succeeded'|'refunded'|'failed';
  created_at: string;
};

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = React.useState('');
  React.useEffect(() => {
    try {
      const cookie = document.cookie.split('; ').find(c => c.startsWith('df-tenant='));
      if (cookie) setTenantId(decodeURIComponent(cookie.split('=')[1]));
    } catch {}
  }, []);
  useRealtimeAdminUpdates(tenantId || '', true);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<'all'|Payment['status']>('all');
  const [provider, setProvider] = React.useState<'all'|'stripe'|'paypal'|'cash'>('all');
  const { data: payments = [], isLoading, isError, error, refetch } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await fetch('/api/payments');
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message || 'Failed to load payments');
      return json.data?.payments || json.payments || [];
    },
  });

  const filtered = React.useMemo(() => {
    return payments
      .filter((p) => (status === 'all' ? true : p.status === status))
      .filter((p) => (provider === 'all' ? true : p.provider === provider))
      .filter((p) => (q ? (p.invoice_id?.toLowerCase().includes(q.toLowerCase()) || p.booking_id?.toLowerCase().includes(q.toLowerCase()) || String(p.amount).includes(q)) : true));
  }, [payments, status, provider, q]);

  function exportCsv(list: Payment[]) {
    const headers = ['Date','Provider','Amount','Currency','Status','Invoice','Booking'];
    const lines = list.map((p) => [
      new Date(p.created_at).toISOString(),
      p.provider,
      String(p.amount ?? 0),
      p.currency,
      p.status,
      p.invoice_id || '',
      p.booking_id || '',
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const refund = useMutation({
    mutationFn: async (paymentId: string) => {
      await fetch('/api/payments/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_id: paymentId }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">Payments</h1>
          <div className="flex gap-2">
            <Input placeholder="Search invoice/booking/amount" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select options={[{ label: 'All statuses', value: 'all' }, { label: 'Succeeded', value: 'succeeded' }, { label: 'Pending', value: 'pending' }, { label: 'Refunded', value: 'refunded' }, { label: 'Failed', value: 'failed' }, { label: 'Requires action', value: 'requires_action' }]} value={status} onValueChange={(v) => setStatus(v as typeof status)} />
            <Select options={[{ label: 'All providers', value: 'all' }, { label: 'Stripe', value: 'stripe' }, { label: 'PayPal', value: 'paypal' }, { label: 'Cash', value: 'cash' }]} value={provider} onValueChange={(v) => setProvider(v as typeof provider)} />
            <Button onClick={() => exportCsv(filtered)}>Export CSV</Button>
          </div>
        </div>
        {/* Loading / Error */}
        {isLoading && (
          <Card><CardContent className="p-6 text-[var(--color-text-muted)]">Loading payments…</CardContent></Card>
        )}
        {isError && (
          <Card>
            <CardContent className="p-6 text-[var(--color-danger)]">
              {(error as Error)?.message || 'Failed to load payments'}
              <div className="mt-3"><Button size="sm" intent="ghost" onClick={() => refetch()}>Retry</Button></div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Provider</TH>
                <TH>Amount</TH>
                <TH>Status</TH>
                <TH>Invoice</TH>
                <TH>Booking</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((p) => (
                <TR key={p.id}>
                  <TD>{new Date(p.created_at).toLocaleString()}</TD>
                  <TD>{p.provider}</TD>
                  <TD>£{Number(p.amount).toFixed(2)} {p.currency?.toUpperCase()}</TD>
                  <TD>{p.status}</TD>
                  <TD>{p.invoice_id ? <a className="underline" href={`/admin/invoices/${p.invoice_id}`}>View</a> : '—'}</TD>
                  <TD>{p.booking_id ? <a className="underline" href={`/bookings/${p.booking_id}`}>View</a> : '—'}</TD>
                  <TD>
                    {p.status !== 'refunded' ? (
                      <button className="underline" onClick={() => refund.mutate(p.id)} disabled={refund.isPending}>Refund</button>
                    ) : null}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


