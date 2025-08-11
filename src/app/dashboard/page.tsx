"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery } from '@/lib/data';

export default function DashboardPage() {
  // TODO: derive role from session; for now assume admin
  const { data } = useQuery('kpis', async () => {
    const res = await fetch('/api/analytics/kpis');
    const json = await res.json();
    return json.kpis as { bookings_today: number; revenue_7d: number; repeat_rate: number };
  });
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Bookings Today" value={typeof data?.bookings_today === 'number' ? String(data?.bookings_today) : '—'} />
          <KpiCard label="Revenue (7d)" value={typeof data?.revenue_7d === 'number' ? `£${data?.revenue_7d.toFixed(2)}` : '—'} />
          <KpiCard label="Repeat Rate" value={typeof data?.repeat_rate === 'number' ? `${(data?.repeat_rate * 100).toFixed(0)}%` : '—'} />
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


