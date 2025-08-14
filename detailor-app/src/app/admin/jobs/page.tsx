"use client";
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { JobDetailDrawer } from '@/components/JobDetailDrawer';
import { useRealtimeAdminUpdates } from '@/lib/realtime';

type Job = {
  id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  staff_profile_id?: string | null;
  checklist?: Array<{ label: string; done: boolean }>;
  bookings?: { reference?: string; start_at?: string } | null;
  customers?: { name?: string } | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export default function AdminJobsPage() {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Realtime invalidation (tenant-aware handled internally)
  useRealtimeAdminUpdates();

  const { data: jobs = [], isLoading, error, refetch } = useQuery<Job[]>({
    queryKey: ['jobs', { scope: 'admin-list' }],
    queryFn: async () => {
      const res = await fetch('/api/jobs', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error?.message || 'Failed to load jobs');
      return json.data?.jobs || json.jobs || [];
    },
  });

  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}/start`, { method: 'POST' });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error?.message || 'Failed to start job');
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}/complete`, { method: 'POST' });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error?.message || 'Failed to complete job');
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const openDrawer = (id: string) => {
    setSelectedJobId(id);
    setDrawerOpen(true);
  };

  return (
    <RoleGuard allowed={["admin", "staff"]}>
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Jobs</h1>
            <Button intent="ghost" onClick={() => void refetch()} disabled={isLoading}>Refresh</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-[var(--color-error)]">
                  {(error as Error)?.message || 'Failed to load jobs'}
                  <div className="mt-3"><Button onClick={() => void refetch()}>Retry</Button></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-[var(--color-text-muted)]">No jobs found.</div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {jobs.map((j) => (
                    <div key={j.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <div className="text-[var(--color-text)] font-medium truncate">
                          {j.customers?.name || 'Customer'} • {j.bookings?.reference || 'Booking'}
                        </div>
                        <div className="text-[var(--color-text-muted)] text-sm">
                          Status: {j.status.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button intent="outline" size="sm" onClick={() => openDrawer(j.id)}>Open</Button>
                        {j.status === 'not_started' && (
                          <Button size="sm" onClick={() => startMutation.mutate(j.id)} disabled={startMutation.isPending}>Start</Button>
                        )}
                        {j.status === 'in_progress' && (
                          <Button size="sm" onClick={() => completeMutation.mutate(j.id)} disabled={completeMutation.isPending}>Complete</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <JobDetailDrawer
            open={drawerOpen}
            onOpenChange={(v) => setDrawerOpen(v)}
            jobId={selectedJobId}
            onUpdated={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
          />
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}


