"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';

export default function DashboardPage() {
  // TODO: derive role from session; for now assume admin
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Bookings Today" value="—" />
          <KpiCard label="Revenue (Demo)" value="—" />
          <KpiCard label="Open Quotes" value="—" />
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


