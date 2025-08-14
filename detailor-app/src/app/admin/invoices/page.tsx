"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { DataTable } from '@/components/DataTable';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { api } from '@/lib/api';
import { useRealtimeAdminUpdates } from '@/lib/realtime';

type Invoice = { id: string; number: string; total: number; paid_amount: number; balance: number; created_at: string; booking_id?: string | null };

export default function AdminInvoicesPage() {
  // Let hook resolve tenant via cookie/API fallback
  useRealtimeAdminUpdates('');
  const [q, setQ] = React.useState('');
  const { data: invoices = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async (): Promise<Invoice[]> => {
      const res = await fetch('/api/invoices', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message || 'Failed to load invoices');
      return json.data?.invoices || json.invoices || [];
    },
  });
  function exportCsv(list: Invoice[]) {
    const headers = ['Number','Date','Total','Paid','Balance'];
    const lines = list.map((i) => [i.number, new Date(i.created_at).toISOString(), String(i.total ?? 0), String(i.paid_amount ?? 0), String(i.balance ?? 0)].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  function StatusBadge({ row }: { row: Invoice }) {
    const paid = Number(row.paid_amount) >= Number(row.total);
    return <span className={`rounded-[var(--radius-full)] px-2 py-0.5 text-[var(--font-size-xs)] ${paid ? 'bg-[var(--color-success)] text-[var(--color-success-foreground)]' : 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]'}`}>{paid ? 'Paid' : 'Unpaid'}</span>;
  }
  const filtered = React.useMemo(() => {
    if (!q) return invoices;
    return invoices.filter((i) => i.number.toLowerCase().includes(q.toLowerCase()));
  }, [invoices, q]);
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">Invoices</h1>
          <button className="underline" onClick={() => exportCsv(filtered)}>Export CSV</button>
        </div>
        {/* Loading / Error */}
        {isLoading && (
          <Card><CardContent className="p-6 text-[var(--color-text-muted)]">Loading invoices…</CardContent></Card>
        )}
        {isError && (
          <Card>
            <CardContent className="p-6 text-[var(--color-danger)]">
              {(error as Error)?.message || 'Failed to load invoices'}
              <div className="mt-3"><Button size="sm" intent="ghost" onClick={() => refetch()}>Retry</Button></div>
            </CardContent>
          </Card>
        )}

        <DataTable
          data={filtered}
          columns={[
            { key: 'number', header: 'Number', sortable: true, render: (row) => <Link href={`/admin/invoices/${(row as Invoice).id}`}>{(row as Invoice).number}</Link> },
            { key: 'created_at', header: 'Date', sortable: true, render: (row) => new Date((row as Invoice).created_at).toLocaleDateString() },
            { key: 'total', header: 'Total', sortable: true, render: (row) => `£${((row as Invoice).total ?? 0).toFixed(2)}` },
            { key: 'paid_amount', header: 'Paid', sortable: true, render: (row) => `£${((row as Invoice).paid_amount ?? 0).toFixed(2)}` },
            { key: 'balance', header: 'Balance', sortable: true, render: (row) => `£${((row as Invoice).balance ?? 0).toFixed(2)}` },
            { key: 'id', header: 'Status', render: (row) => <StatusBadge row={row as Invoice} /> },
          ]}
          searchPlaceholder="Search invoice number"
          onSearch={setQ}
          enableExport
          exportFilename="invoices.csv"
        />
      </RoleGuard>
    </DashboardShell>
  );
}


