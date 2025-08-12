"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';
import { Button } from '@/ui/button';
type PaymentMethod = { id: string; brand?: string; last4?: string; exp_month?: number; exp_year?: number; default?: boolean };
import { Sheet } from '@/components/Sheet';
import { Badge } from '@/ui/badge';

type Invoice = { id: string; number: string; total: number; paid_amount: number; balance?: number; created_at: string };

export default function AccountBillingPage() {
  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: async () => (await api<{ ok: boolean; profile: { full_name?: string; email?: string } }>(`/api/profiles/me`)).profile,
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await api<{ ok: boolean; invoices: Invoice[] }>(`/api/invoices`)).invoices || [],
  });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const current = React.useMemo(() => invoices.find((i) => i.id === openId) || null, [invoices, openId]);
  const [isDemo, setIsDemo] = React.useState(false);
  const { data: billingSummary } = useQuery({
    queryKey: ['billing-summary'],
    queryFn: async () => (await api<{ ok: boolean; current?: string; next?: string; nextDate?: string }>(`/api/billing/summary`)),
  });
  const { data: methods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => (await (await fetch('/api/payments/methods')).json()).methods || [],
  });
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tenant/me');
        const json = await res.json();
        setIsDemo(Boolean(json?.tenant?.is_demo));
      } catch { setIsDemo(false); }
    })();
  }, []);
  return (
    <DashboardShell role="customer" tenantName="Detailor">
      <div className="grid gap-4">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">Account & Billing</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="font-medium mb-2">Profile</div>
          <div>Name: {profile?.full_name || '—'}</div>
          <div>Email: {profile?.email || '—'}</div>
          <div className="mt-2"><a className="underline" href="/api/payments/portal">Manage billing</a></div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="font-medium mb-2">Payment methods</div>
          {methods.length === 0 ? (
            <div className="text-[var(--color-text-muted)]">No cards saved.</div>
          ) : (
            <div className="grid gap-2">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center justify-between border rounded-[var(--radius-sm)] px-3 py-2">
                  <div>{m.brand} •••• {m.last4} — {m.exp_month}/{m.exp_year}</div>
                  <div className="text-[var(--color-text-muted)] text-sm">{m.default ? 'Default' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="font-medium mb-2">Subscription</div>
          {!billingSummary?.ok ? (
            <div className="text-[var(--color-text-muted)]">Loading...</div>
          ) : (
            <div className="text-sm text-[var(--color-text)] space-y-1">
              {billingSummary.current && <div>Current: {billingSummary.current}</div>}
              {billingSummary.next && <div>Next: {billingSummary.next}{billingSummary.nextDate ? ` on ${new Date(billingSummary.nextDate).toLocaleDateString()}` : ''}</div>}
            </div>
          )}
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="font-medium mb-2">Invoices</div>
          {invoices.length === 0 ? (
            <div className="text-[var(--color-text-muted)]">No invoices yet.</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Number</TH>
                  <TH>Date</TH>
                  <TH>Total</TH>
                  <TH>Paid</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {invoices.map((iv) => (
                  <TR key={iv.id}>
                    <TD>{iv.number}</TD>
                    <TD>{new Date(iv.created_at).toLocaleDateString()}</TD>
                    <TD>£{(iv.total ?? 0).toFixed(2)}</TD>
                    <TD>£{(iv.paid_amount ?? 0).toFixed(2)}</TD>
                    <TD className="flex gap-2">
                      <button className="underline" onClick={() => setOpenId(iv.id)}>View</button>
                      {Number(iv.total ?? 0) > Number(iv.paid_amount ?? 0) ? (
                        <Button
                          intent="primary"
                          onClick={async () => {
                            const res = await fetch('/api/payments/checkout-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: iv.id }) });
                            const json = await res.json();
                            if (json?.url) window.location.href = json.url as string;
                          }}
                        >
                          Pay now
                        </Button>
                      ) : null}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </div>
      <Sheet open={Boolean(openId)} onOpenChange={(v) => !v && setOpenId(null)}>
        {!current ? null : (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="text-[var(--font-size-lg)] font-semibold">Invoice {current.number}</div>
              <Badge intent={Number(current.paid_amount) >= Number(current.total) ? 'success' : 'warning'}>
                {Number(current.paid_amount) >= Number(current.total) ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>
            <div>Date: {new Date(current.created_at).toLocaleString()}</div>
            <div>Total: £{(Number(current.total) || 0).toFixed(2)}</div>
            <div>Paid: £{(Number(current.paid_amount) || 0).toFixed(2)}</div>
            <div className="flex gap-2">
              <a className="underline" href={`/api/invoices/${current.id}`} target="_blank" rel="noreferrer">Download</a>
              {Number(current.total) > Number(current.paid_amount) ? (
                <Button
                  intent="primary"
                  onClick={async () => {
                    const res = await fetch('/api/payments/checkout-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: current.id }) });
                    const json = await res.json();
                    if (json?.url) window.location.href = json.url as string;
                  }}
                >
                  Pay now
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </Sheet>
    </DashboardShell>
  );
}


