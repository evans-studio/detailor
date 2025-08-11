"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/ui/button';
import { JobDetailDrawer } from '@/components/JobDetailDrawer';

type JobRow = { id: string; status: 'not_started'|'in_progress'|'completed'|'paid'; bookings?: { reference?: string; start_at?: string } };

export default function StaffTodayPage() {
  const [jobs, setJobs] = React.useState<JobRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const day = new Date().toISOString().slice(0,10);
  async function load() {
    setLoading(true);
    const res = await fetch(`/api/jobs?day=${day}`);
    const json = await res.json();
    setJobs(json.jobs || []);
    setLoading(false);
  }
  React.useEffect(() => { load(); }, [day]);
  async function start(id: string) { await fetch(`/api/jobs/${id}/start`, { method: 'POST' }); await load(); }
  async function complete(id: string) { await fetch(`/api/jobs/${id}/complete`, { method: 'POST' }); await load(); }
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="grid gap-3">
          <div className="text-[var(--font-size-2xl)] font-semibold">Today</div>
          {loading ? <div>Loading…</div> : jobs.length === 0 ? (
            <div className="text-[var(--color-text-muted)]">No jobs today.</div>
          ) : (
            <div className="grid gap-2">
              {jobs.map((j) => (
                <div key={j.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3" onClick={() => setOpenId(j.id)}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{j.bookings?.reference || 'Booking'} — {j.bookings?.start_at ? new Date(j.bookings.start_at).toLocaleTimeString() : ''}</div>
                    <div className="text-[var(--color-text-muted)]">{j.status}</div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {j.status === 'not_started' ? <Button onClick={() => start(j.id)}>Start</Button> : null}
                    {j.status === 'in_progress' ? <Button onClick={() => complete(j.id)}>Complete</Button> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <JobDetailDrawer open={Boolean(openId)} onOpenChange={(v) => !v && setOpenId(null)} jobId={openId} onUpdated={load} />
      </RoleGuard>
    </DashboardShell>
  );
}


