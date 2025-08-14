"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeAdminUpdates } from '@/lib/realtime';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Badge } from '@/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
import Link from 'next/link';
import { EnterpriseCalendar, type CalendarEvent } from '@/components/calendar/EnterpriseCalendar';

// Calendar helpers
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Booking = { 
  id: string; 
  start_at: string; 
  end_at: string;
  status: string; 
  payment_status: string; 
  price_breakdown?: { total?: number };
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

const getPaymentStatusIntent = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'paid': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'error';
    case 'refunded': return 'default';
    default: return 'warning';
  }
};

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  
  // System Bible Pattern: Real-time admin updates (tenant-aware)
  const [tenantId, setTenantId] = React.useState<string>('');
  React.useEffect(() => {
    try {
      const cookie = document.cookie.split('; ').find(c => c.startsWith('df-tenant='));
      if (cookie) setTenantId(decodeURIComponent(cookie.split('=')[1]));
    } catch {}
  }, []);
  useRealtimeAdminUpdates(tenantId || '', true);
  const [activeTab, setActiveTab] = React.useState('all'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [status, setStatus] = React.useState<'all'|'pending'|'confirmed'|'in_progress'|'completed'|'cancelled'>('all');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [q, setQ] = React.useState('');
  
  // Calendar state
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [calendarView, setCalendarView] = React.useState<'month' | 'week' | 'day'>('month');
  const [draggedBooking, setDraggedBooking] = React.useState<Booking | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  const { data: bookings = [], isLoading, isError, error, refetch } = useQuery<Booking[]>({
    queryKey: ['bookings', { status, from, to, q, scope: 'admin' }],
    queryFn: async (): Promise<Booking[]> => {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      if (q) qs.set('q', q);
      const res = await fetch(`/api/bookings${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message || 'Failed to load bookings');
      return json.data?.bookings || [];
    },
    refetchInterval: 30000, // Real-time updates
  });
  
  // Calendar utilities (legacy - kept for backward compatibility)
  const getDaysInMonth = (date: Date) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days from previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getBookingsForDate = (date: Date) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const dateString = date.toDateString();
    return bookings.filter(booking => 
      new Date(booking.start_at).toDateString() === dateString
    );
  };

  // Transform bookings to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    return bookings.map(booking => ({
      id: booking.id,
      title: booking.customer_name || 'Customer',
      description: `${booking.service_name || 'Service'} - ${booking.vehicle_name || 'Vehicle'}`,
      start: new Date(booking.start_at),
      end: new Date(booking.end_at),
      variant: booking.status === 'pending' ? 'warning' :
               booking.status === 'confirmed' ? 'primary' :
               booking.status === 'in_progress' ? 'info' :
               booking.status === 'completed' ? 'success' : 'error',
      status: booking.status,
      metadata: {
        bookingReference: booking.id,
        customerName: booking.customer_name,
        serviceName: booking.service_name,
        vehicleName: booking.vehicle_name,
        address: booking.address,
        total: booking.price_breakdown?.total,
        paymentStatus: booking.payment_status,
      },
      draggable: ['pending', 'confirmed'].includes(booking.status),
      onClick: () => window.location.href = `/bookings/${booking.id}`,
    }));
  }, [bookings]);

  // Legacy drag handlers (kept for list view compatibility)
  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    e.preventDefault();
    
    if (!draggedBooking) return;
    
    const originalStart = new Date(draggedBooking.start_at);
    const originalEnd = new Date(draggedBooking.end_at);
    const duration = originalEnd.getTime() - originalStart.getTime();
    
    // Set new start time to same time but on target date
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);
    
    try {
      await update.mutateAsync({
        id: draggedBooking.id,
        patch: {
          start_at: newStart.toISOString(),
          end_at: newEnd.toISOString(),
        }
      });
    } catch (error) {
      console.error('Failed to reschedule booking:', error);
    }
    
    setDraggedBooking(null);
  };

  // Handle calendar event drop from EnterpriseCalendar
  const handleCalendarEventDrop = async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    try {
      await update.mutateAsync({
        id: event.id,
        patch: {
          start_at: newStart.toISOString(),
          end_at: newEnd.toISOString(),
        }
      });
    } catch (error) {
      console.error('Failed to reschedule booking:', error);
    }
  };

  // Handle calendar date click
  const handleCalendarDateClick = (date: Date) => {
    // Navigate to create new booking for this date
    const dateParam = date.toISOString().split('T')[0];
    window.location.href = `/book/new?date=${dateParam}`;
  };

  // Handle calendar event click
  const handleCalendarEventClick = (event: CalendarEvent) => {
    window.location.href = `/bookings/${event.id}`;
  };

  // System Bible Compliant: Group bookings by workflow status
  const groupedBookings = React.useMemo(() => {
    const now = new Date();
    return {
      all: bookings,
      today: bookings.filter(b => {
        const bookingDate = new Date(b.start_at).toDateString();
        return bookingDate === now.toDateString();
      }),
      upcoming: bookings.filter(b => 
        new Date(b.start_at) > now && 
        ['confirmed'].includes(b.status)
      ),
      pending: bookings.filter(b => b.status === 'pending'),
      inProgress: bookings.filter(b => b.status === 'in_progress'),
      completed: bookings.filter(b => b.status === 'completed'),
    };
  }, [bookings]);
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Booking> }) => {
      await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['bookings'] });
      await qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
  const BookingCard = ({ booking, draggable = false }: { booking: Booking; draggable?: boolean }) => (
    <Card 
      className={`transition-colors hover:border-[var(--color-primary)]/30 ${draggable ? 'cursor-move' : ''}`}
      draggable={draggable}
      onDragStart={draggable ? (e) => handleDragStart(e, booking) : undefined}
      data-testid={`booking-card-${booking.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-semibold text-[var(--color-text)]">
              {new Date(booking.start_at).toLocaleDateString()}
            </div>
            <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">
              {new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {booking.end_at && ' - ' + new Date(booking.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="text-[var(--color-text)] mb-1">
            <span data-testid="booking-service">{booking.service_name || 'Service'}</span> • <span data-testid="booking-customer">{booking.customer_name || 'Customer'}</span>
          </div>
          <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mb-2">
            <span data-testid="booking-vehicle">{booking.vehicle_name || 'Vehicle'}</span> • <span data-testid="booking-address">{booking.address || 'Address'}</span>
          </div>
          <div className="text-[var(--color-text)] font-medium">
            <span data-testid="booking-total">Total £{booking.price_breakdown?.total ?? 0}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge intent={getStatusIntent(booking.status)}>{booking.status}</Badge>
          <Badge intent={getPaymentStatusIntent(booking.payment_status)}>{booking.payment_status}</Badge>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Link href={`/bookings/${booking.id}`}>
          <Button intent="ghost" size="sm">View Details</Button>
        </Link>
        {['pending','confirmed'].includes(booking.status) && booking.payment_status !== 'paid' ? (
          <Button
            size="sm"
            onClick={async () => {
              try {
                const total = Math.round(Number(booking.price_breakdown?.total || 0) * 100);
                // Fetch tenant preferences for deposit percent/min
                let depositPercent = 20; let minGbp = 5;
                try {
                  const t = await fetch('/api/settings/tenant');
                  const tj = await t.json();
                  const prefs = tj?.data?.tenant?.business_prefs || tj?.tenant?.business_prefs || {};
                  depositPercent = Number(prefs.deposit_percent ?? 20);
                  minGbp = Number(prefs.deposit_min_gbp ?? 5);
                } catch {}
                const deposit = Math.max(minGbp * 100, Math.round(total * (depositPercent / 100)));
                const res = await fetch('/api/payments/checkout-booking', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount: total,
                    deposit_amount: deposit,
                    currency: 'gbp',
                    booking_reference: booking.id,
                  })
                });
                const json = await res.json();
                if (json?.data?.url || json?.url) window.open((json.data?.url || json.url) as string, '_blank');
              } catch (e) {
                console.error('Failed to create deposit checkout:', e);
              }
            }}
          >
            Collect Deposit
          </Button>
        ) : null}
        
        <Select
          options={[
            {label:'Pending',value:'pending'},
            {label:'Confirmed',value:'confirmed'},
            {label:'In Progress',value:'in_progress'},
            {label:'Completed',value:'completed'},
            {label:'Cancelled',value:'cancelled'}
          ]}
          value={booking.status}
          onValueChange={(v) => update.mutate({ id: booking.id, patch: { status: v as Booking['status'] } })}
        />
      </div>
    </Card>
  );

  const CalendarBookingItem = ({ booking }: { booking: Booking }) => ( // eslint-disable-line @typescript-eslint/no-unused-vars
    <div
      className={`text-[var(--font-size-xs)] p-1 mb-1 rounded cursor-move border-l-2 ${
        booking.status === 'pending' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
        booking.status === 'confirmed' ? 'bg-blue-50 border-blue-400 text-blue-800' :
        booking.status === 'in_progress' ? 'bg-indigo-50 border-indigo-400 text-indigo-800' :
        booking.status === 'completed' ? 'bg-green-50 border-green-400 text-green-800' :
        'bg-gray-50 border-gray-400 text-gray-800'
      }`}
      draggable
      onDragStart={(e) => handleDragStart(e, booking)}
      title={`${booking.service_name || 'Service'} - ${booking.customer_name || 'Customer'}`}
    >
      <div className="font-medium truncate">
        {new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="truncate">
        {booking.customer_name || 'Customer'}
      </div>
    </div>
  );

  const EnterpriseCalendarView = () => {
    return (
      <div className="space-y-6">
        {/* Calendar View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              intent={calendarView === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCalendarView('month')}
            >
              Month
            </Button>
            <Button 
              intent={calendarView === 'week' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCalendarView('week')}
            >
              Week
            </Button>
          </div>
          <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
            {calendarEvents.length} {calendarEvents.length === 1 ? 'booking' : 'bookings'} visible
          </div>
        </div>

        {/* Enterprise Calendar Component */}
        <EnterpriseCalendar
          events={calendarEvents}
          onDateClick={handleCalendarDateClick}
          onEventClick={handleCalendarEventClick}
          onEventDrop={handleCalendarEventDrop}
          view={calendarView}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          workingHours={{ start: 8, end: 18 }}
          weekStartsOn={1}
          className="shadow-[var(--shadow-sm)]"
        />

        {/* Professional Tips */}
        <Card className="bg-gradient-to-r from-[var(--color-primary-50)] to-[var(--color-secondary-50)] border-[var(--color-primary-200)]">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                <p className="font-[var(--font-weight-medium)] text-[var(--color-text)] mb-1">Enterprise Calendar Tips</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Drag and drop bookings to reschedule them instantly</li>
                  <li>Click on empty dates to create new bookings</li>
                  <li>Switch between month and week views for better planning</li>
                  <li>Color-coded events show booking status at a glance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="space-y-6">
          {/* Header with filters */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)] mb-2">Booking Management</h1>
              <div className="text-[var(--color-text-muted)]">System Bible compliant workflow management</div>
            </div>
            <Link href="/book/new">
              <Button intent="primary">New Booking</Button>
            </Link>
          </div>

          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[var(--font-size-lg)]">Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-2">Status</div>
                  <Select 
                    options={[
                      {label:'All',value:'all'},
                      {label:'Pending',value:'pending'},
                      {label:'Confirmed',value:'confirmed'},
                      {label:'In Progress',value:'in_progress'},
                      {label:'Completed',value:'completed'},
                      {label:'Cancelled',value:'cancelled'}
                    ]} 
                    value={status} 
                    onValueChange={(v) => setStatus(v as typeof status)} 
                  />
                </div>
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-2">From Date</div>
                  <Input 
                    type="datetime-local" 
                    value={from} 
                    onChange={(e) => setFrom(e.target.value)} 
                  />
                </div>
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-2">To Date</div>
                  <Input 
                    type="datetime-local" 
                    value={to} 
                    onChange={(e) => setTo(e.target.value)} 
                  />
                </div>
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-2">Search</div>
                  <Input 
                    placeholder="Customer, vehicle, service..." 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading / Error States */}
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-[var(--color-text-muted)]">Loading bookings…</CardContent>
            </Card>
          )}
          {isError && (
            <Card>
              <CardContent className="p-6 text-[var(--color-danger)]">
                {(error as Error)?.message || 'Failed to load bookings'}
                <div className="mt-3">
                  <Button size="sm" intent="ghost" onClick={() => refetch()}>Retry</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Bible Workflow Tabs */}
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All ({groupedBookings.all.length})
              </TabsTrigger>
              <TabsTrigger value="calendar">
                📅 Calendar View
              </TabsTrigger>
              <TabsTrigger value="today">
                Today ({groupedBookings.today.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({groupedBookings.upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({groupedBookings.pending.length})
              </TabsTrigger>
              <TabsTrigger value="inProgress">
                In Progress ({groupedBookings.inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({groupedBookings.completed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-4">
                {groupedBookings.all.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    No bookings found with current filters
                  </div>
                ) : (
                  groupedBookings.all.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} draggable />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <EnterpriseCalendarView />
            </TabsContent>

            <TabsContent value="today">
              <div className="grid gap-4">
                {groupedBookings.today.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    No bookings scheduled for today
                  </div>
                ) : (
                  groupedBookings.today.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="upcoming">
              <div className="grid gap-4">
                {groupedBookings.upcoming.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    No upcoming confirmed bookings
                  </div>
                ) : (
                  groupedBookings.upcoming.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="pending">
              <div className="grid gap-4">
                {groupedBookings.pending.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    No pending bookings requiring attention
                  </div>
                ) : (
                  groupedBookings.pending.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="inProgress">
              <div className="grid gap-4">
                {groupedBookings.inProgress.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    No jobs currently in progress
                  </div>
                ) : (
                  groupedBookings.inProgress.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid gap-4">
                {groupedBookings.completed.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    No completed bookings
                  </div>
                ) : (
                  groupedBookings.completed.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


