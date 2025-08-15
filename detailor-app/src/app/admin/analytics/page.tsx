"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useQuery } from '@tanstack/react-query';

export default function AnalyticsPage() {
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  const { data: revenue } = useQuery({
    queryKey: ['analytics','revenue',{from,to}],
    queryFn: async () => { const r = await fetch('/api/analytics/revenue'); return (await r.json()).data; }
  });
  const { data: services } = useQuery({
    queryKey: ['analytics','services',{from,to}],
    queryFn: async () => { const r = await fetch(`/api/analytics/service-popularity${from||to?`?${new URLSearchParams({from, to})}`:''}`); return (await r.json()).data; }
  });
  const { data: clv } = useQuery({
    queryKey: ['analytics','clv'],
    queryFn: async () => { const r = await fetch('/api/analytics/clv'); return (await r.json()).data; }
  });
  const { data: staff } = useQuery({
    queryKey: ['analytics','staff',{from,to}],
    queryFn: async () => { const r = await fetch(`/api/analytics/staff-productivity${from||to?`?${new URLSearchParams({from, to})}`:''}`); return (await r.json()).data; }
  });
  const { data: funnel } = useQuery({
    queryKey: ['analytics','funnel',{from,to}],
    queryFn: async () => { const r = await fetch(`/api/analytics/conversion-funnel${from||to?`?${new URLSearchParams({from, to})}`:''}`); return (await r.json()).data; }
  });

  async function exportCsv(report: string) {
    const res = await fetch('/api/analytics/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report, from, to }) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${report}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)]">Analytics & Reports</h1>
              <div className="text-[var(--color-text-muted)]">Understand performance without external tools</div>
            </div>
            <div className="flex gap-2 items-center">
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" data-testid="analytics-panels">
            <div data-testid="analytics-revenue">
              <RevenueChart
                data={(revenue?.daily_revenue || []).map((d: any) => ({ date: d.date, revenue: d.revenue }))}
                loading={!revenue}
              />
              <div className="pt-3 flex gap-2">
                <Button onClick={() => exportCsv('revenue')}>Export CSV</Button>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle data-testid="analytics-services">Service Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                {services?.services?.length ? (
                  <ChartCard
                    title="Top Services"
                    type="bar"
                    categories={services.services.map((s: any) => s.service)}
                    series={[{ name: 'Revenue', data: services.services.map((s: any) => Math.round(s.revenue)) }]}
                    height={260}
                  />
                ) : <div className="text-[var(--color-text-muted)]">No data</div>}
                <div className="pt-3 flex gap-2">
                  <Button onClick={() => exportCsv('services')}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle data-testid="analytics-clv">Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                {clv?.customers?.length ? (
                  <ChartCard
                    title="Top Customers by LTV"
                    type="bar"
                    categories={clv.customers.slice(0,10).map((c: any) => c.name)}
                    series={[{ name: 'LTV', data: clv.customers.slice(0,10).map((c: any) => Math.round(c.ltv)) }]}
                    height={260}
                  />
                ) : <div className="text-[var(--color-text-muted)]">No data</div>}
                <div className="pt-3 flex gap-2">
                  <Button onClick={() => exportCsv('clv')}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle data-testid="analytics-staff">Staff Productivity</CardTitle>
              </CardHeader>
              <CardContent>
                {staff?.staff?.length ? (
                  <div className="space-y-1">
                    {staff.staff.map((s: any) => (
                      <div key={s.staff_profile_id} className="flex items-center justify-between border-b border-[var(--color-border)] py-1">
                        <div>{s.name}</div>
                        <div>{s.jobs_completed} jobs • {s.avg_duration_min} min avg</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-[var(--color-text-muted)]">No data</div>}
                <div className="pt-3 flex gap-2">
                  <Button onClick={() => exportCsv('staff')}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle data-testid="analytics-funnel">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                {funnel?.funnel ? (
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {Object.entries(funnel.funnel).map(([k,v]) => (
                      <div key={k} className="p-2 rounded border border-[var(--color-border)]">
                        <div className="text-[var(--color-text-muted)] text-xs">{k}</div>
                        <div className="text-lg font-semibold">{v as any}</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-[var(--color-text-muted)]">No data</div>}
                <div className="pt-3 flex gap-2">
                  <Button onClick={() => exportCsv('funnel')}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


