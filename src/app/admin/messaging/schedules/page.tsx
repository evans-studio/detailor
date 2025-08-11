"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';

export default function MessagingSchedulesPage() {
  return (
    <DashboardShell tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Messaging Schedules</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="font-medium">Reminders</div>
          <div className="text-[var(--color-text-muted)]">Stub UI — configure relative times like T-24h for bookings, due-3d for invoices.</div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


