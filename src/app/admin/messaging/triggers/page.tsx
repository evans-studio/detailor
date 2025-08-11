"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';

const EVENTS = [
  { key: 'user.created', label: 'Account: User Created' },
  { key: 'booking.created', label: 'Booking: Created' },
  { key: 'booking.completed', label: 'Booking: Completed' },
  { key: 'invoice.created', label: 'Payments: Invoice Issued' },
];

export default function MessagingTriggersPage() {
  return (
    <DashboardShell tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Messaging Triggers</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-hover-surface)]"><tr><th className="px-3 py-2">Event</th><th>Template</th><th>Status</th></tr></thead>
            <tbody>
              {EVENTS.map((e) => (
                <tr key={e.key} className="border-t border-[var(--color-border)]"><td className="px-3 py-2">{e.label}</td><td>Not configured</td><td>Disabled</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[var(--color-text-muted)] mt-2">Stub UI — wiring to backend will be added in FE-9 follow-up.</div>
      </RoleGuard>
    </DashboardShell>
  );
}


