"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';

type KPIs = {
  bookings_today: number;
  revenue_mtd: number;
  total_customers: number;
  active_jobs: number;
};

type Booking = { id: string; start_at: string; service_name?: string; customer_name?: string; };
type Activity = { id: string; message: string; created_at: string };
type JobRow = { id: string; status: string; started_at?: string | null; completed_at?: string | null; bookings?: { reference?: string; start_at?: string }; customers?: { name?: string } };

export default function AdminDashboard() {
  const { data: kpis } = useQuery({
    queryKey: ['kpis'],
    queryFn: async (): Promise<KPIs> => {
      const res = await fetch('/api/analytics/kpis');
      const json = await res.json();
      return json.data || { bookings_today: 0, revenue_mtd: 0, total_customers: 0, active_jobs: 0 };
    },
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ['bookings', { scope: 'upcoming-simple' }],
    queryFn: async (): Promise<Booking[]> => {
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const res = await fetch(`/api/bookings?from=${from}`);
      const json = await res.json();
      return (json.data || json.bookings || []).slice(0, 5);
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['recent-activities-simple'],
    queryFn: async (): Promise<Activity[]> => {
      const res = await fetch('/api/activities/recent?limit=8');
      const json = await res.json();
      return json.activities || [];
    },
  });
  const { data: activeJobs = [] } = useQuery<JobRow[]>({
    queryKey: ['jobs', { scope: 'active' }],
    queryFn: async () => {
      // Provide tenant header fallback for environments where auth cookie hasn't attached yet
      let headers: HeadersInit | undefined = undefined;
      try {
        const cookie = document.cookie.split('; ').find(c => c.startsWith('df-tenant='));
        const tid = cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
        if (tid) headers = { 'x-tenant-id': tid };
      } catch {}
      const res = await fetch('/api/jobs?status=in_progress', { headers });
      const json = await res.json();
      return json.data?.jobs || json.jobs || [];
    },
    refetchInterval: 10000,
  });

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={['admin','staff']}>
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="kpi-row">
            <MetricCard label="Today's Bookings" value={kpis?.bookings_today ?? 0} testId="kpi-bookings-today" />
            <MetricCard label="Monthly Revenue" value={`£${(kpis?.revenue_mtd ?? 0).toLocaleString()}`} testId="kpi-revenue-mtd" />
            <MetricCard label="Total Customers" value={kpis?.total_customers ?? 0} testId="kpi-total-customers" />
            <MetricCard label="Active Jobs" value={kpis?.active_jobs ?? 0} testId="kpi-active-jobs" />
          </div>

          {/* Main Content: Upcoming and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-testid="upcoming-bookings">
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <div className="text-[var(--color-text-muted)]">No bookings yet</div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((b) => (
                      <div key={b.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2">
                        <div className="text-[var(--color-text)]">
                          {new Date(b.start_at).toLocaleString()} • {b.service_name || 'Service'} • {b.customer_name || 'Customer'}
                        </div>
                        <Link href={`/bookings/${b.id}`}>
                          <Button intent="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="recent-activity">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <div className="text-[var(--color-text-muted)]">No activity yet</div>
                ) : (
                  <div className="space-y-2">
                    {activity.map((a) => (
                      <div key={a.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2">
                        <div className="text-[var(--color-text)]">{a.message}</div>
                        <div className="text-[var(--color-text-muted)] text-sm">{new Date(a.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card data-testid="live-jobs">
              <CardHeader>
                <CardTitle>Live Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {activeJobs.length === 0 ? (
                  <div className="text-[var(--color-text-muted)]">No active jobs</div>
                ) : (
                  <div className="space-y-2">
                    {activeJobs.map((j) => {
                      const started = j.started_at ? new Date(j.started_at) : null;
                      const elapsedMin = started ? Math.max(0, Math.round((Date.now() - started.getTime())/60000)) : 0;
                      return (
                        <div key={j.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2">
                          <div className="text-[var(--color-text)]">
                            {j.customers?.name || 'Customer'} • {j.bookings?.reference || 'Booking'}
                          </div>
                          <div className="text-[var(--color-text-muted)] text-sm">{elapsedMin} min</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}

function MetricCard({ label, value, testId }: { label: string; value: string | number; testId?: string }) {
  return (
    <Card data-testid={testId}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-[var(--color-text-muted)] text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[var(--color-text)]" data-testid={`${testId}-value`}>{value}</div>
      </CardContent>
    </Card>
  );
}



