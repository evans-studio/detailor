"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeAdminUpdates } from '@/lib/realtime';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import Link from 'next/link';

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  payment_status: string;
  price_breakdown: { total: number };
  service_name?: string;
  vehicle_name?: string;
  customer_name?: string;
  address?: string;
};

// System Bible Status Workflow: pending → confirmed → in_progress → completed
const getStatusIntent = (status: string) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'confirmed': return 'info';
    case 'in_progress': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'default';
    default: return 'default';
  }
};

const formatTimeSlot = (start: string, end: string) => {
  const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startTime} - ${endTime}`;
};

export default function AdminTodayView() {
  const today = new Date().toISOString().split('T')[0];
  
  // System Bible Pattern: Real-time admin updates
  useRealtimeAdminUpdates('detailor', true);
  
  const { data: todayBookings = [] } = useQuery({
    queryKey: ['bookings', { scope: 'admin-today', date: today }],
		queryFn: async (): Promise<Booking[]> => {
			const response = await api<{ bookings: Booking[] }>(`/api/bookings?from=${today}T00:00:00&to=${today}T23:59:59`);
			return response.bookings || [];
		},
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

	const { data: upcomingBookings = [] } = useQuery({
    queryKey: ['bookings', { scope: 'admin-upcoming' }],
		queryFn: async (): Promise<Booking[]> => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
			const response = await api<{ bookings: Booking[] }>(`/api/bookings?from=${tomorrow.toISOString().split('T')[0]}T00:00:00&status=confirmed`);
			return (response.bookings || []).slice(0, 5); // Next 5 upcoming
    },
    refetchInterval: 60000,
  });

  // System Bible Compliant: Group today's bookings by status for workflow management
  const todayStats = React.useMemo(() => {
    const stats = {
      total: todayBookings.length,
      pending: todayBookings.filter(b => b.status === 'pending').length,
      confirmed: todayBookings.filter(b => b.status === 'confirmed').length,
      inProgress: todayBookings.filter(b => b.status === 'in_progress').length,
      completed: todayBookings.filter(b => b.status === 'completed').length,
      revenue: todayBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + (b.price_breakdown?.total || 0), 0),
    };
    return stats;
  }, [todayBookings]);

  // Timeline schedule sorted by start time
  const timelineBookings = React.useMemo(() => 
    [...todayBookings].sort((a, b) => 
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    ), [todayBookings]
  );

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin", "staff"]}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)]">
                Today&apos;s Schedule
              </h1>
              <p className="text-[var(--color-text-muted)] mt-1">
                {new Date().toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/bookings">
                <Button intent="secondary">All Bookings</Button>
              </Link>
              <Link href="/book/new">
                <Button intent="primary">New Booking</Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards - System Bible Compliant */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-muted)]">
                  Today&apos;s Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)]">
                  {todayStats.total}
                </div>
                <div className="flex gap-2 mt-2">
                  {todayStats.pending > 0 && (
                    <Badge intent="warning">{todayStats.pending} pending</Badge>
                  )}
                  {todayStats.inProgress > 0 && (
                    <Badge intent="info">{todayStats.inProgress} active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-muted)]">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-success)]">
                  {todayStats.completed}
                </div>
                <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mt-1">
                  of {todayStats.total} jobs
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-muted)]">
                  Revenue Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)]">
                  £{todayStats.revenue}
                </div>
                <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mt-1">
                  from paid bookings
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-muted)]">
                  Tomorrow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)]">
                  {upcomingBookings.length}
                </div>
                <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mt-1">
                  confirmed bookings
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Timeline Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today&apos;s Timeline</span>
                <Badge intent="info">Live Updates</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timelineBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[var(--color-text-muted)] mb-4">No jobs scheduled for today</div>
                  <Link href="/book/new">
                    <Button intent="primary">Schedule First Job</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineBookings.map((booking, index) => {
                    const isNext = booking.status === 'confirmed' && 
                      timelineBookings.filter(b => b.status === 'in_progress').length === 0 && 
                      index === timelineBookings.findIndex(b => b.status === 'confirmed');
                    
                    return (
                      <div 
                        key={booking.id}
                        className={`flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border transition-colors ${
                          isNext 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' 
                            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
                      >
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                          <div 
                            className={`w-3 h-3 rounded-full ${
                              booking.status === 'completed' ? 'bg-[var(--color-success)]' :
                              booking.status === 'in_progress' ? 'bg-[var(--color-primary)]' :
                              isNext ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-border)]'
                            }`}
                          />
                          {index < timelineBookings.length - 1 && (
                            <div className="w-0.5 h-6 bg-[var(--color-border)] mt-2" />
                          )}
                        </div>

                        {/* Booking details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-[var(--color-text)]">
                                {formatTimeSlot(booking.start_at, booking.end_at)}
                                {isNext && (
                                  <Badge intent="warning" className="ml-2">Next</Badge>
                                )}
                              </div>
                              <div className="text-[var(--color-text)] mt-1">
                                {booking.service_name || 'Service'} • {booking.customer_name || 'Customer'}
                              </div>
                              <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mt-1">
                                {booking.vehicle_name || 'Vehicle'} • {booking.address || 'Address'}
                              </div>
                              <div className="text-[var(--color-text)] font-medium mt-2">
                                £{booking.price_breakdown?.total ?? 0}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge intent={getStatusIntent(booking.status)}>
                                {booking.status}
                              </Badge>
                              <Badge 
                                intent={booking.payment_status === 'paid' ? 'success' : 'warning'}
                              >
                                {booking.payment_status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <Link href={`/bookings/${booking.id}`}>
                            <Button intent="ghost" size="sm">Details</Button>
                          </Link>
                          {booking.status === 'confirmed' && (
                            <Button intent="primary" size="sm">Start Job</Button>
                          )}
                          {booking.status === 'in_progress' && (
                            <Button intent="primary" size="sm">Complete</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tomorrow's Upcoming - System Bible Preview */}
          {upcomingBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tomorrow&apos;s Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <div>
                        <div className="font-medium text-[var(--color-text)]">
                          {formatTimeSlot(booking.start_at, booking.end_at)}
                        </div>
                        <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">
                          {booking.service_name || 'Service'} • £{booking.price_breakdown?.total ?? 0}
                        </div>
                      </div>
                      <Badge intent="info">{booking.status}</Badge>
                    </div>
                  ))}
                </div>
                <Link href="/admin/bookings" className="block mt-4">
                  <Button intent="secondary" size="sm" className="w-full">
                    View All Upcoming
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}