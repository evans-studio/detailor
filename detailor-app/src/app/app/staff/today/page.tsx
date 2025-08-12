"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/ui/button';
import { JobDetailDrawer } from '@/components/JobDetailDrawer';

type JobRow = { 
  id: string; 
  status: 'not_started'|'in_progress'|'completed'|'paid'; 
  bookings?: { 
    reference?: string; 
    start_at?: string;
    service_id?: string;
  };
  customers?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  vehicles?: {
    id: string;
    make: string;
    model: string;
    colour?: string;
  };
};

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
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="grid gap-3">
          <div className="text-[var(--font-size-2xl)] font-semibold">Today</div>
          {loading ? <div>Loading…</div> : jobs.length === 0 ? (
            <div className="text-[var(--color-text-muted)]">No jobs today.</div>
          ) : (
            <div className="grid gap-3">
              {jobs.map((j) => (
                <div key={j.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4" onClick={() => setOpenId(j.id)}>
                  {/* Job Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-[var(--color-text)]">
                        {j.bookings?.reference || 'Booking'}
                      </div>
                      <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">
                        {j.bookings?.start_at ? new Date(j.bookings.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-medium ${
                        j.status === 'not_started' ? 'bg-yellow-100 text-yellow-800' :
                        j.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        j.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {j.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3 p-3 bg-[var(--color-muted)] rounded-[var(--radius-sm)]">
                    <div className="font-medium text-[var(--color-text)] mb-2">Customer</div>
                    <div className="grid gap-1">
                      <div className="text-[var(--color-text)]">👤 {j.customers?.name || 'Unknown'}</div>
                      {j.customers?.phone && (
                        <div className="text-[var(--color-text)]">
                          📞 <a href={`tel:${j.customers.phone}`} className="text-[var(--color-primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
                            {j.customers.phone}
                          </a>
                        </div>
                      )}
                      {j.customers?.email && (
                        <div className="text-[var(--color-text)] text-[var(--font-size-sm)]">
                          ✉️ {j.customers.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  {j.vehicles && (
                    <div className="mb-3 p-3 bg-[var(--color-muted)] rounded-[var(--radius-sm)]">
                      <div className="font-medium text-[var(--color-text)] mb-2">Vehicle</div>
                      <div className="text-[var(--color-text)]">
                        🚗 {j.vehicles.make} {j.vehicles.model} 
                        {j.vehicles.colour && ` (${j.vehicles.colour})`}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {j.status === 'not_started' && (
                      <Button 
                        onClick={(e) => { e.stopPropagation(); start(j.id); }} 
                        className="flex-1"
                      >
                        ▶️ Start Job
                      </Button>
                    )}
                    {j.status === 'in_progress' && (
                      <Button 
                        onClick={(e) => { e.stopPropagation(); complete(j.id); }} 
                        className="flex-1"
                        intent="primary"
                      >
                        ✅ Complete Job
                      </Button>
                    )}
                    <Button 
                      intent="ghost" 
                      onClick={(e) => { e.stopPropagation(); setOpenId(j.id); }}
                      className="px-4"
                    >
                      📋 Details
                    </Button>
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


