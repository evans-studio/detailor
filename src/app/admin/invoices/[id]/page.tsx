"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Badge } from '@/ui/badge';
import { StripeTestBadge } from '@/components/StripeTestBadge';

type Invoice = { id: string; number: string; total: number; paid_amount: number; balance: number; created_at: string; booking_id?: string | null };

export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [isDemo, setIsDemo] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const res = await fetch(`/api/invoices/${id}`);
      const json = await res.json();
      setInvoice(json.invoice || null);
    })();
  }, [id]);
  React.useEffect(() => {
    (async () => {
      try {
        const t = await fetch('/api/tenant/me');
        const tj = await t.json();
        setIsDemo(Boolean(tj?.tenant?.is_demo));
      } catch { setIsDemo(false); }
    })();
  }, []);
  async function onMarkPaid() {
    if (!invoice) return;
    setSaving(true);
    try {
      await fetch('/api/payments/mark-paid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: invoice.id }) });
      const res = await fetch(`/api/invoices/${id}`);
      const json = await res.json();
      setInvoice(json.invoice || null);
    } finally {
      setSaving(false);
    }
  }
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin","staff"]}>
        {!invoice ? (
          <div>Loading…</div>
        ) : (
          <div className="grid gap-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center justify-between">
                <div className="text-[var(--font-size-xl)] font-semibold">Invoice {invoice.number}</div>
                <div className="flex items-center gap-2">
                  <a className="underline" href={`/api/invoices/${invoice.id}`} target="_blank" rel="noreferrer">Download PDF</a>
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
              <button className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-hover-surface)] w-full md:w-auto" onClick={onMarkPaid} disabled={saving}>
                {saving ? 'Marking…' : 'Mark as Paid (Demo)'}
              </button>
            ) : null}
          </div>
        )}
      </RoleGuard>
      <div className="mt-2"><StripeTestBadge /></div>
    </DashboardShell>
  );
}


