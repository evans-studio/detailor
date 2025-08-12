"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Badge } from '@/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';
import { StripeTestBadge } from '@/components/StripeTestBadge';

type Invoice = { id: string; number: string; total: number; paid_amount: number; balance: number; created_at: string; booking_id?: string | null };

export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async (): Promise<Invoice | null> => {
      const res = await fetch(`/api/invoices/${id}`);
      const json = await res.json();
      return json.invoice || null;
    },
  });
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', { invoiceId: id }],
    queryFn: async (): Promise<Array<{ id: string; amount: number; status: string; provider: string; created_at: string }>> => {
      const res = await fetch(`/api/payments?invoice_id=${id}`);
      const json = await res.json();
      return json.payments || [];
    },
    enabled: Boolean(id),
  });
  const refund = useMutation({
    mutationFn: async (paymentId: string) => {
      await fetch('/api/payments/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_id: paymentId }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      await queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });
  const { data: isDemo = false } = useQuery({
    queryKey: ['tenant-demo-flag'],
    queryFn: async (): Promise<boolean> => {
      try {
        const t = await fetch('/api/tenant/me');
        const tj = await t.json();
        return Boolean(tj?.tenant?.is_demo);
      } catch { return false; }
    },
  });
  const markPaid = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      await fetch('/api/payments/mark-paid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: invoice.id }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
  async function onMarkPaid() { await markPaid.mutateAsync(); }

  function exportCsv() {
    if (!invoice) return;
    const headers = ['Number','Date','Total','Paid','Balance'];
    const row = [
      invoice.number,
      new Date(invoice.created_at).toISOString(),
      String(invoice.total ?? 0),
      String(invoice.paid_amount ?? 0),
      String(invoice.balance ?? 0),
    ];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        {isLoading || !invoice ? (
          <div>Loading…</div>
        ) : (
          <div className="grid gap-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center justify-between">
                <div className="text-[var(--font-size-xl)] font-semibold">Invoice {invoice.number}</div>
                <div className="flex items-center gap-2">
                  <a className="underline" href={`/api/invoices/${invoice.id}?format=pdf`} target="_blank" rel="noreferrer">Download PDF</a>
                  <button className="underline" onClick={exportCsv}>Export CSV</button>
                  <Badge intent={invoice.balance === 0 ? 'success' : 'warning'}>{invoice.balance === 0 ? 'Paid' : 'Unpaid'}</Badge>
                </div>
              </div>
              <div className="text-[var(--color-text-muted)]">Created {new Date(invoice.created_at).toLocaleString()}</div>
              <div className="mt-3 grid gap-1">
                <div>Total: £{Number(invoice.total).toFixed(2)}</div>
                <div>Paid: £{Number(invoice.paid_amount).toFixed(2)}</div>
                <div>Balance: £{Number(invoice.balance).toFixed(2)}</div>
              </div>
            </div>
            {invoice.booking_id ? (
              <a className="underline" href={`/bookings/${invoice.booking_id}`}>View Booking</a>
            ) : null}
            {isDemo && Number(invoice.balance) > 0 ? (
              <button className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-hover-surface)] w-full md:w-auto" onClick={onMarkPaid} disabled={markPaid.isPending}>
                {markPaid.isPending ? 'Marking…' : 'Mark as Paid (Demo)'}
              </button>
            ) : null}
            {Number(invoice.balance) > 0 ? (
              <a
                className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-hover-surface)] w-full md:w-auto text-center"
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  const res = await fetch('/api/payments/checkout-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: invoice.id }) });
                  const json = await res.json();
                  if (json?.url) window.open(json.url as string, '_blank');
                }}
              >
                Create Checkout Link
              </a>
            ) : null}
            {payments.length ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="font-medium mb-2">Payments</div>
                <Table>
                  <THead><TR><TH>Date</TH><TH>Provider</TH><TH>Amount</TH><TH>Status</TH><TH></TH></TR></THead>
                  <TBody>
                    {payments.map((p) => (
                      <TR key={p.id}>
                        <TD>{new Date(p.created_at).toLocaleString()}</TD>
                        <TD>{p.provider}</TD>
                        <TD>£{Number(p.amount).toFixed(2)}</TD>
                        <TD>{p.status}</TD>
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
            ) : null}
          </div>
        )}
      </RoleGuard>
      <div className="mt-2"><StripeTestBadge /></div>
    </DashboardShell>
  );
}


