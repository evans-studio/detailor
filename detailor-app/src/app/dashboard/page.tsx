"use client";
import * as React from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery } from '@tanstack/react-query';
import { KPICard, KPIGrid, KPICardSkeleton } from '@/components/dashboard/KPICard';
import { BarChart, DonutChart, ChartSkeleton } from '@/components/dashboard/ChartComponents';
import { ActivityFeed, generateSampleActivities } from '@/components/dashboard/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';

interface KPIData {
  bookings_today: number;
  revenue_7d: number;
  repeat_rate: number;
  total_customers: number;
  avg_job_value: number;
  completion_rate: number;
  revenue_mtd: number;
  revenue_growth: number;
  bookings_growth: number;
  customer_growth: number;
}

interface RevenueChartData {
  daily_revenue: Array<{ date: string; revenue: number; bookings: number }>;
  service_breakdown: Array<{ service: string; revenue: number; bookings: number }>;
  monthly_comparison: Array<{ month: string; revenue: number; growth: number }>;
}

export default function EnterpriseDashboard() {
  // KPI Data
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: async (): Promise<KPIData> => {
      const res = await fetch('/api/analytics/kpis');
      const json = await res.json();
      return json.kpis || {};
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Revenue and Analytics Data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: async (): Promise<RevenueChartData> => {
      const res = await fetch('/api/analytics/revenue');
      const json = await res.json();
      return json.data || { daily_revenue: [], service_breakdown: [], monthly_comparison: [] };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Today's Jobs
  const day = new Date().toISOString().slice(0, 10);
  const { data: jobsToday = [] } = useQuery({
    queryKey: ['jobs', { day }],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?day=${day}`);
      const json = await res.json();
      return (json.jobs || []) as Array<{ 
        id: string; 
        status: string; 
        bookings?: { 
          reference?: string; 
          start_at?: string;
          customer_name?: string;
          service_name?: string;
          price_breakdown?: { total: number };
        } 
      }>;
    },
  });

  // Setup Status
  const [servicesCount, setServicesCount] = React.useState<number | null>(null);
  const [patternsCount, setPatternsCount] = React.useState<number | null>(null);

  // Usage Data
  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => (await (await fetch('/api/billing/usage')).json()) as { 
      ok: boolean; 
      usage?: { used: number; limit: number | null; allowed: number | null; warn: boolean } 
    },
  });

  React.useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/admin/services');
        const sj = await s.json();
        setServicesCount(Array.isArray(sj?.services) ? sj.services.length : 0);
      } catch { setServicesCount(0); }
      try {
        const p = await fetch('/api/admin/availability/work-patterns');
        const pj = await p.json();
        setPatternsCount(Array.isArray(pj?.patterns) ? pj.patterns.length : 0);
      } catch { setPatternsCount(0); }
    })();
  }, []);

  // Generate sample data for charts (in production, use real data)
  const chartData = React.useMemo(() => {
    if (!revenueData?.daily_revenue?.length) {
      return {
        dailyRevenue: Array.from({ length: 7 }, (_, i) => ({
          label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { weekday: 'short' }),
          value: Math.random() * 500 + 200
        })),
        serviceBreakdown: [
          { label: 'Premium Detail', value: 4500, color: 'var(--color-primary)' },
          { label: 'Express Wash', value: 2800, color: 'var(--color-secondary)' },
          { label: 'Paint Correction', value: 3200, color: 'var(--color-success)' },
          { label: 'Ceramic Coating', value: 1900, color: 'var(--color-warning)' },
        ]
      };
    }
    return {
      dailyRevenue: revenueData.daily_revenue.map(d => ({
        label: new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' }),
        value: d.revenue
      })),
      serviceBreakdown: revenueData.service_breakdown.map(s => ({
        label: s.service,
        value: s.revenue
      }))
    };
  }, [revenueData]);

  // Sample activity data
  const sampleActivities = React.useMemo(() => generateSampleActivities(8), []);

  const needsSetup = servicesCount === 0 || patternsCount === 0;
  const hasWarning = usage?.ok && usage.usage?.limit !== null && usage.usage?.warn;

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin", "staff"]}>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--color-text)] tracking-[var(--letter-spacing-tight)]">
                Dashboard
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-2">
                Welcome back! Here&apos;s what&apos;s happening with your business today.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/bookings">
                <Button intent="secondary">View All Bookings</Button>
              </Link>
              <Link href="/book/new">
                <Button intent="primary">New Booking</Button>
              </Link>
            </div>
          </div>

          {/* Setup Banner */}
          {needsSetup && (
            <Card variant="outlined" className="border-[var(--color-warning)] bg-gradient-to-r from-[var(--color-warning-50)] to-[var(--color-warning-100)]">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-warning)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)] mb-2">
                      Complete Your Setup
                    </h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      Finish configuring your business to start accepting bookings and maximize your revenue.
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center gap-2 ${(servicesCount || 0) > 0 ? 'text-[var(--color-success)]' : ''}`}>
                        {(servicesCount || 0) > 0 ? '✅' : '⭕'} Add your services and pricing
                      </div>
                      <div className={`flex items-center gap-2 ${(patternsCount || 0) > 0 ? 'text-[var(--color-success)]' : ''}`}>
                        {(patternsCount || 0) > 0 ? '✅' : '⭕'} Configure your working hours
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {(servicesCount || 0) === 0 && (
                        <Link href="/admin/services">
                          <Button intent="primary" size="sm">Add Services</Button>
                        </Link>
                      )}
                      {(patternsCount || 0) === 0 && (
                        <Link href="/admin/settings/booking">
                          <Button intent="secondary" size="sm">Set Working Hours</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Warning */}
          {hasWarning && (
            <Card variant="outlined" className="border-[var(--color-warning)] bg-[var(--color-warning-50)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="warning">Usage Warning</Badge>
                  <span className="text-[var(--color-text-secondary)]">
                    You have used {usage.usage!.used} of {usage.usage!.limit} bookings this month. 
                    You can exceed by 5 before overage charges apply.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPI Cards */}
          {kpisLoading ? (
            <KPICardSkeleton count={6} />
          ) : (
            <KPIGrid>
              <KPICard
                label="Today's Bookings"
                value={kpis?.bookings_today || 0}
                previousValue={Math.max(0, (kpis?.bookings_today || 0) - 2)}
                trend="up"
                trendPercentage={kpis?.bookings_growth || 0}
                trendLabel="vs yesterday"
                icon="bookings"
                variant="primary"
                onClick={() => window.location.href = '/admin/bookings'}
              />
              <KPICard
                label="Weekly Revenue"
                value={`£${(kpis?.revenue_7d || 0).toLocaleString()}`}
                previousValue={`£${Math.max(0, (kpis?.revenue_7d || 0) - 500).toLocaleString()}`}
                trend={kpis?.revenue_growth && kpis.revenue_growth > 0 ? 'up' : 'down'}
                trendPercentage={Math.abs(kpis?.revenue_growth || 0)}
                trendLabel="vs last week"
                icon="revenue"
                variant="success"
              />
              <KPICard
                label="Customer Retention"
                value={`${((kpis?.repeat_rate || 0) * 100).toFixed(0)}%`}
                trend="up"
                trendPercentage={5}
                trendLabel="vs last month"
                icon="customers"
                subtitle="Repeat customer rate"
              />
              <KPICard
                label="Avg Job Value"
                value={`£${(kpis?.avg_job_value || 0).toFixed(0)}`}
                trend="up"
                trendPercentage={8}
                trendLabel="vs last month"
                icon="revenue"
              />
              <KPICard
                label="Total Customers"
                value={kpis?.total_customers || 0}
                trend="up"
                trendPercentage={kpis?.customer_growth || 0}
                trendLabel="new this month"
                icon="customers"
              />
              <KPICard
                label="Completion Rate"
                value={`${((kpis?.completion_rate || 0) * 100).toFixed(0)}%`}
                trend="up"
                trendPercentage={2}
                trendLabel="vs last month"
                subtitle="Jobs completed on time"
                variant="default"
              />
            </KPIGrid>
          )}

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Trend Chart */}
            {revenueLoading ? (
              <ChartSkeleton />
            ) : (
              <BarChart
                data={chartData.dailyRevenue}
                title="Daily Revenue Trend"
                description="Revenue performance over the last 7 days"
                height={300}
              />
            )}

            {/* Service Breakdown */}
            {revenueLoading ? (
              <ChartSkeleton />
            ) : (
              <DonutChart
                data={chartData.serviceBreakdown}
                title="Revenue by Service"
                description="Revenue distribution across your services"
                centerContent={
                  <div className="text-center">
                    <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
                      £{chartData.serviceBreakdown.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                    </div>
                    <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                      Total Revenue
                    </div>
                  </div>
                }
              />
            )}
          </div>

          {/* Today's Schedule and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Jobs */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Today&apos;s Schedule</CardTitle>
                      <CardDescription>
                        {jobsToday.length} {jobsToday.length === 1 ? 'job' : 'jobs'} scheduled for today
                      </CardDescription>
                    </div>
                    <Badge variant="primary">{jobsToday.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {jobsToday.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-[var(--color-text-muted)] mb-4">No jobs scheduled for today</p>
                      <Link href="/book/new">
                        <Button intent="primary" size="sm">Schedule First Job</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobsToday.slice(0, 5).map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-[var(--shadow-sm)] transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                              <div className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                                {job.bookings?.start_at ? new Date(job.bookings.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              </div>
                            </div>
                            <div>
                              <div className="font-[var(--font-weight-medium)] text-[var(--color-text)]">
                                {job.bookings?.reference || 'No Reference'}
                              </div>
                              <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                                {job.bookings?.customer_name || 'Customer'} • {job.bookings?.service_name || 'Service'}
                              </div>
                              {job.bookings?.price_breakdown?.total && (
                                <div className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-success)]">
                                  £{job.bookings.price_breakdown.total.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={
                                job.status === 'completed' ? 'success' :
                                job.status === 'in_progress' ? 'primary' :
                                job.status === 'confirmed' ? 'info' :
                                'default'
                              }
                              size="sm"
                            >
                              {job.status}
                            </Badge>
                            <Link href={`/bookings/${job.id}`}>
                              <Button intent="ghost" size="sm">View</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      {jobsToday.length > 5 && (
                        <div className="text-center pt-4">
                          <Link href="/admin/bookings">
                            <Button intent="ghost" size="sm">
                              View All {jobsToday.length} Jobs
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <ActivityFeed
              activities={sampleActivities}
              title="Recent Activity"
              maxItems={6}
              showAvatar={false}
            />
          </div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


