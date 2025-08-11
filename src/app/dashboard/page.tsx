"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery } from '@tanstack/react-query';

export default function DashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/kpis');
      const json = await res.json();
      return json.kpis as { bookings_today: number; revenue_7d: number; repeat_rate: number };
    },
  });
  const day = new Date().toISOString().slice(0, 10);
  const { data: jobsToday = [] } = useQuery({
    queryKey: ['jobs', { day }],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?day=${day}`);
      const json = await res.json();
      return (json.jobs || []) as Array<{ id: string; status: string; bookings?: { reference?: string; start_at?: string } }>;
    },
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', { scope: 'dashboard' }],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      const json = await res.json();
      return (json.invoices || []) as Array<{ id: string; total: number; paid_amount: number; created_at: string }>;
    },
  });
  const pendingInvoices = React.useMemo(() => invoices.filter((iv) => Number(iv.total) > Number(iv.paid_amount)).length, [invoices]);
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Bookings Today" value={typeof kpis?.bookings_today === 'number' ? String(kpis?.bookings_today) : '—'} />
          <KpiCard label="Revenue (7d)" value={typeof kpis?.revenue_7d === 'number' ? `£${kpis?.revenue_7d.toFixed(2)}` : '—'} />
          <KpiCard label="Repeat Rate" value={typeof kpis?.repeat_rate === 'number' ? `${(kpis?.repeat_rate * 100).toFixed(0)}%` : '—'} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="font-medium mb-2">Today&apos;s Jobs ({jobsToday.length})</div>
            <div className="grid gap-2">
              {jobsToday.slice(0, 6).map((j) => (
                <div key={j.id} className="flex items-center justify-between">
                  <div>{j.bookings?.reference || 'Booking'} — {j.bookings?.start_at ? new Date(j.bookings.start_at).toLocaleTimeString() : ''}</div>
                  <div className="text-[var(--color-text-muted)]">{j.status}</div>
                </div>
              ))}
              {jobsToday.length === 0 ? <div className="text-[var(--color-text-muted)]">No jobs today</div> : null}
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="font-medium mb-2">Pending Invoices ({pendingInvoices})</div>
            <div className="text-[var(--color-text-muted)] text-sm">Unpaid invoices needing attention.</div>
          </div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">{label}</div>
      <div className="text-[var(--font-size-2xl)] font-semibold">{value}</div>
    </div>
  );
}


