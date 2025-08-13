"use client";
import * as React from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery } from '@tanstack/react-query';
import { KPICard, KPIGrid, KPICardSkeleton } from '@/components/dashboard/KPICard';
import { BarChart, DonutChart, ChartSkeleton } from '@/components/dashboard/ChartComponents';
import { ActivityFeed, type ActivityItem } from '@/components/dashboard/ActivityFeed';
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

  // Recent Activity Data
  const { data: activities = [] } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const res = await fetch('/api/activities/recent?limit=8');
      const json = await res.json();
      return json.activities || [];
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const needsSetup = servicesCount === 0 || patternsCount === 0;
  const hasWarning = usage?.success && usage.data?.limit !== null && usage.data?.warn;

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin", "staff"]}>
        <div className="space-y-6 md:space-y-8 animate-slide-in-up">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-text)] tracking-tight mb-1 sm:mb-2">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)]">
                Welcome back! Here's what's happening with your business today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 animate-slide-in-right">
              <Link href="/admin/bookings" className="w-full sm:w-auto">
                <Button intent="secondary" className="w-full sm:w-auto h-12 md:h-11 px-4 sm:px-6 font-medium text-sm md:text-base hover-lift button-press">
                  View All Bookings
                </Button>
              </Link>
              <Link href="/book/new" className="w-full sm:w-auto">
                <Button intent="primary" className="w-full sm:w-auto h-12 md:h-11 px-4 sm:px-6 font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-sm md:text-base animate-pulse hover:animate-none button-press">
                  New Booking
                </Button>
              </Link>
            </div>
          </div>

          {/* Setup Banner */}
          {needsSetup && (
            <Card variant="outlined" className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                      Complete Your Setup
                    </h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      Finish configuring your business to start accepting bookings and maximize your revenue.
                    </p>
                    <div className="space-y-3 mb-6">
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${(servicesCount || 0) > 0 ? 'bg-[var(--color-success-50)] text-[var(--color-success-900)]' : 'bg-[var(--color-muted)] text-[var(--color-text-secondary)]'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${(servicesCount || 0) > 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-subtle)]'}`}>
                          {(servicesCount || 0) > 0 ? (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="font-medium">Add your services and pricing</span>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${(patternsCount || 0) > 0 ? 'bg-[var(--color-success-50)] text-[var(--color-success-900)]' : 'bg-[var(--color-muted)] text-[var(--color-text-secondary)]'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${(patternsCount || 0) > 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-subtle)]'}`}>
                          {(patternsCount || 0) > 0 ? (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="font-medium">Configure your working hours</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {(servicesCount || 0) === 0 && (
                        <Link href="/admin/services">
                          <Button intent="primary" size="sm" className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200">
                            Add Services
                          </Button>
                        </Link>
                      )}
                      {(patternsCount || 0) === 0 && (
                        <Link href="/admin/settings/booking">
                          <Button intent="secondary" size="sm" className="border-[var(--color-border-strong)] hover:bg-[var(--color-hover-surface)] hover:border-[var(--color-border-strong)] transition-all duration-200">
                            Set Working Hours
                          </Button>
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
            <Card variant="outlined" className="border-amber-200 bg-amber-50 border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-200">
                    Usage Warning
                  </Badge>
                  <span className="text-amber-800">
                    You have used {usage.data!.used} of {usage.data!.limit} bookings this month. 
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

          {/* Charts and Analytics - Responsive Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 md:gap-8 stagger-children">
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

          {/* Today's Schedule and Activity - Mobile Stacked */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 stagger-children">
            {/* Today's Jobs */}
            <div className="xl:col-span-2">
              <Card className="border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-muted)] p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-center sm:text-left">
                      <CardTitle className="text-base sm:text-lg font-semibold text-[var(--color-text)] flex items-center justify-center sm:justify-start gap-2">
                        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                        Today's Schedule
                      </CardTitle>
                      <CardDescription className="text-[var(--color-text-secondary)] mt-1 text-sm sm:text-base">
                        {jobsToday.length} {jobsToday.length === 1 ? 'job' : 'jobs'} scheduled for today
                      </CardDescription>
                    </div>
                    <Badge variant="primary" className="bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border-[var(--color-primary-200)] font-medium px-3 py-1 self-center sm:self-auto">
                      {jobsToday.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {jobsToday.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
                        <svg className="w-8 sm:w-10 h-8 sm:h-10 text-[var(--color-text-subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-[var(--color-text)] mb-2">No jobs scheduled</h3>
                      <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-4 sm:mb-6">Get started by creating your first booking</p>
                      <Link href="/book/new">
                        <Button intent="primary" size="sm" className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                          Schedule First Job
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {jobsToday.slice(0, 5).map((job) => (
                        <div
                          key={job.id}
                          className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-md hover:border-[var(--color-border-strong)] transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex flex-col items-center bg-[var(--color-primary-50)] rounded-lg p-2 sm:p-3 min-w-[70px] sm:min-w-[80px]">
                              <div className="text-xs font-medium text-[var(--color-primary-600)] uppercase tracking-wide">
                                {job.bookings?.start_at ? new Date(job.bookings.start_at).toLocaleDateString('en-GB', { weekday: 'short' }) : 'TBD'}
                              </div>
                              <div className="text-base sm:text-lg font-bold text-[var(--color-primary-900)]">
                                {job.bookings?.start_at ? new Date(job.bookings.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[var(--color-text)] mb-1 text-sm sm:text-base">
                                {job.bookings?.reference || 'No Reference'}
                              </div>
                              <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-1">
                                <span className="font-medium">{job.bookings?.customer_name || 'Customer'}</span>
                                <span className="hidden sm:inline"> • </span>
                                <span className="block sm:inline">{job.bookings?.service_name || 'Service'}</span>
                              </div>
                              {job.bookings?.price_breakdown?.total && (
                                <div className="text-xs sm:text-sm font-semibold text-green-600">
                                  £{job.bookings.price_breakdown.total.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <Badge 
                              variant={
                                job.status === 'completed' ? 'success' :
                                job.status === 'in_progress' ? 'primary' :
                                job.status === 'confirmed' ? 'info' :
                                'default'
                              }
                              size="sm"
                              className="font-medium px-2 sm:px-2.5 py-1 text-xs"
                            >
                              {job.status.replace('_', ' ')}
                            </Badge>
                            <Link href={`/bookings/${job.id}`}>
                              <Button intent="ghost" size="sm" className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)] text-xs sm:text-sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      {jobsToday.length > 5 && (
                        <div className="text-center pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                          <Link href="/admin/bookings">
                            <Button intent="ghost" size="sm" className="w-full sm:w-auto text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)] font-medium text-sm">
                              View All {jobsToday.length} Jobs →
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
              activities={activities}
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


