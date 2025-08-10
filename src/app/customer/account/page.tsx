"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';
import Link from 'next/link';
import { Sheet } from '@/components/Sheet';
import { Badge } from '@/ui/badge';

type Invoice = { id: string; number: string; total: number; paid_amount: number; created_at: string };

export default function AccountBillingPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [profile, setProfile] = React.useState<{ full_name?: string; email?: string } | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const current = React.useMemo(() => invoices.find((i) => i.id === openId) || null, [invoices, openId]);
  const [isDemo, setIsDemo] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tenant/me');
        const json = await res.json();
        setIsDemo(Boolean(json?.tenant?.is_demo));
      } catch { setIsDemo(false); }
    })();
  }, []);
  React.useEffect(() => {
    (async () => {
      try {
        const me = await api<{ ok: boolean; profile: { full_name?: string; email?: string } }>(`/api/profiles/me`);
        setProfile(me.profile);
      } catch {}
      const iv = await api<{ ok: boolean; invoices: Invoice[] }>(`/api/invoices`);
      setInvoices(iv.invoices || []);
    })();
  }, []);
  return (
    <DashboardShell role="customer" tenantName="DetailFlow">
      <div className="grid gap-4">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">Account & Billing</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="font-medium mb-2">Profile</div>
          <div>Name: {profile?.full_name || '—'}</div>
          <div>Email: {profile?.email || '—'}</div>
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
                    <TD><button className="underline" onClick={() => setOpenId(iv.id)}>View</button></TD>
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
              {isDemo && Number(current.total) > Number(current.paid_amount) ? (
                <form action={`/api/payments/mark-paid`} method="post" onSubmit={(e) => { e.preventDefault(); fetch('/api/payments/mark-paid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: current.id }) }).then(() => setOpenId(null)); }}>
                  <button className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1">Pay (Test)</button>
                </form>
              ) : null}
            </div>
          </div>
        )}
      </Sheet>
    </DashboardShell>
  );
}


