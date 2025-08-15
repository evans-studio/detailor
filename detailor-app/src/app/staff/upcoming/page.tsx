"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, fetchJobs } from '@/lib/data';
import { useRealtimeAdminUpdates } from '@/lib/realtime';

type JobRow = { 
  id: string; 
  status: string; 
  bookings?: { 
    reference?: string; 
    start_at?: string;
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
export default function StaffUpcoming() {
  const [tenantId, setTenantId] = React.useState('');
  React.useEffect(() => {
    try {
      const cookie = document.cookie.split('; ').find(c => c.startsWith('df-tenant='));
      if (cookie) setTenantId(decodeURIComponent(cookie.split('=')[1]));
    } catch {}
  }, []);
  useRealtimeAdminUpdates(tenantId || '', true);
  const { data, loading, error, reload } = useQuery('jobs-upcoming', () => fetchJobs('?status=not_started'));
  const jobs = (data || []) as JobRow[];
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Upcoming</h1>
        {loading ? (
          <div className="text-[var(--color-text-muted)]">Loading…</div>
        ) : error ? (
          <div className="text-[var(--color-danger)]">{error} <button className="underline" onClick={reload}>Retry</button></div>
        ) : jobs.length === 0 ? <div className="text-[var(--color-text-muted)]">No upcoming jobs.</div> : (
          <div className="grid gap-3">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                {/* Job Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-[var(--color-text)]">
                      {j.bookings?.reference || 'Booking'}
                    </div>
                    <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">
                      {j.bookings?.start_at ? new Date(j.bookings.start_at).toLocaleDateString([], { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Time TBD'}
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-[var(--color-warning-100)] text-[var(--color-warning-600)] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-medium">
                    UPCOMING
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-3 p-3 bg-[var(--color-muted)] rounded-[var(--radius-sm)]">
                  <div className="font-medium text-[var(--color-text)] mb-2">Customer</div>
                  <div className="grid gap-1">
                    <div className="text-[var(--color-text)]">👤 {j.customers?.name || 'Unknown'}</div>
                    {j.customers?.phone && (
                      <div className="text-[var(--color-text)]">
                        📞 <a href={`tel:${j.customers.phone}`} className="text-[var(--color-primary)] hover:underline">
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
                  <div className="p-3 bg-[var(--color-muted)] rounded-[var(--radius-sm)]">
                    <div className="font-medium text-[var(--color-text)] mb-2">Vehicle</div>
                    <div className="text-[var(--color-text)]">
                      🚗 {j.vehicles.make} {j.vehicles.model} 
                      {j.vehicles.colour && ` (${j.vehicles.colour})`}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


