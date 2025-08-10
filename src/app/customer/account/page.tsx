"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';
import Link from 'next/link';

type Invoice = { id: string; number: string; total: number; paid_amount: number; created_at: string };

export default function AccountBillingPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [profile, setProfile] = React.useState<{ full_name?: string; email?: string } | null>(null);
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
                    <TD>£{iv.total ?? 0}</TD>
                    <TD>£{iv.paid_amount ?? 0}</TD>
                    <TD><Link href={`/api/invoices/${iv.id}`}>Download</Link></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}


