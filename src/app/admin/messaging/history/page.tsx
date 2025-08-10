"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { DataTable } from '@/components/DataTable';

type Message = { id: string; created_at: string; event: string; recipient: string; template_key?: string | null; channel: string; status: string; provider_id?: string | null };

export default function MessagingHistoryPage() {
  const [rows, setRows] = React.useState<Message[]>([]);
  const [q, setQ] = React.useState('');
  React.useEffect(() => {
    (async () => {
      const res = await fetch('/api/messages');
      const json = await res.json();
      setRows(json.messages || []);
    })();
  }, []);
  const filtered = React.useMemo(() => {
    if (!q) return rows;
    const ql = q.toLowerCase();
    return rows.filter((m) => (m.recipient || '').toLowerCase().includes(ql) || (m.event || '').toLowerCase().includes(ql));
  }, [rows, q]);
  return (
    <DashboardShell tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Messaging History</h1>
        <DataTable
          data={filtered}
          columns={[
            { key: 'created_at', header: 'Date', sortable: true },
            { key: 'recipient', header: 'Recipient', sortable: true },
            { key: 'event', header: 'Event', sortable: true },
            { key: 'template_key', header: 'Template' },
            { key: 'channel', header: 'Channel', sortable: true },
            { key: 'status', header: 'Status', sortable: true },
            { key: 'provider_id', header: 'Provider ID' },
          ]}
          searchPlaceholder="Search recipient/event"
          onSearch={setQ}
          enableExport
          exportFilename="messages.csv"
        />
      </RoleGuard>
    </DashboardShell>
  );
}


