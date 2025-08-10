"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, fetchJobs } from '@/lib/data';

type JobRow = { id: string; status: string; bookings?: { reference?: string } };
export default function StaffUpcoming() {
  const { data } = useQuery('jobs-upcoming', () => fetchJobs('?status=not_started'));
  const jobs = (data || []) as JobRow[];
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin","staff"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Upcoming</h1>
        {jobs.length === 0 ? <div className="text-[var(--color-text-muted)]">No upcoming jobs.</div> : (
          <div className="grid gap-2">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div>{j.bookings?.reference || 'Booking'}</div>
                <div className="text-[var(--color-text-muted)]">Status: {j.status}</div>
              </div>
            ))}
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


