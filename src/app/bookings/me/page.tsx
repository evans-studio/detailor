"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useRealtimeCustomerUpdates } from '@/lib/realtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
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

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  
  // System Bible Pattern: Real-time customer updates
  useRealtimeCustomerUpdates('detail-flow', undefined, true);
  const [activeTab, setActiveTab] = React.useState('upcoming');
  
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', { scope: 'me' }],
    queryFn: async (): Promise<Booking[]> => (await api<{ ok: boolean; bookings: Booking[] }>(`/api/bookings`)).bookings || [],
  });

  // System Bible Compliant: Group bookings by status workflow
  const groupedBookings = React.useMemo(() => {
    const now = new Date();
    const upcoming = bookings.filter(b => 
      new Date(b.start_at) > now && 
      !['cancelled', 'completed'].includes(b.status)
    );
    const inProgress = bookings.filter(b => b.status === 'in_progress');
    const completed = bookings.filter(b => 
      b.status === 'completed' || 
      (new Date(b.start_at) <= now && b.status !== 'cancelled')
    );
    
    return { upcoming, inProgress, completed };
  }, [bookings]);

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await fetch(`/api/bookings/${bookingId}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ status: 'cancelled' }) 
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-semibold text-[var(--color-text)]">
            {booking.service_name || 'Service'}
          </div>
          <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mt-1">
            {new Date(booking.start_at).toLocaleString()} • {booking.vehicle_name || 'Vehicle'}
          </div>
          <div className="text-[var(--color-text)] font-medium mt-2">
            Total £{booking.price_breakdown?.total ?? 0}
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
        
        {booking.status === 'pending' && booking.payment_status !== 'paid' && (
          <Button
            intent="primary"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch(`/api/invoices?booking_id=${booking.id}`);
                const json = await res.json();
                const inv = (json?.invoices || [])[0];
                if (inv?.id) {
                  const pay = await fetch('/api/payments/checkout-invoice', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ invoice_id: inv.id }) 
                  });
                  const pj = await pay.json();
                  if (pj?.url) window.location.href = pj.url as string;
                }
              } catch (error) {
                console.error('Payment error:', error);
              }
            }}
          >
            Pay Now
          </Button>
        )}
        
        {['pending', 'confirmed'].includes(booking.status) && (
          <>
            <Button intent="secondary" size="sm" disabled>Reschedule</Button>
            <Button 
              intent="destructive" 
              size="sm"
              onClick={() => cancelMutation.mutate(booking.id)} 
              disabled={cancelMutation.isPending}
            >
              Cancel
            </Button>
          </>
        )}
        
        {booking.status === 'completed' && (
          <Button intent="secondary" size="sm">
            <Link href="/book/new">Book Again</Link>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardShell role="customer" tenantName="DetailFlow">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)]">
          My Bookings
        </h1>
        <Link href="/book/new">
          <Button intent="primary">New Booking</Button>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-[var(--color-text-muted)] mb-4">No bookings yet</div>
          <Link href="/book/new">
            <Button intent="primary">Book Your First Service</Button>
          </Link>
        </div>
      ) : (
        <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({groupedBookings.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({groupedBookings.inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({groupedBookings.completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {groupedBookings.upcoming.length === 0 ? (
              <div className="text-[var(--color-text-muted)]">No upcoming bookings</div>
            ) : (
              <div className="grid gap-4">
                {groupedBookings.upcoming.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="in-progress">
            {groupedBookings.inProgress.length === 0 ? (
              <div className="text-[var(--color-text-muted)]">No services in progress</div>
            ) : (
              <div className="grid gap-4">
                {groupedBookings.inProgress.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {groupedBookings.completed.length === 0 ? (
              <div className="text-[var(--color-text-muted)]">No completed bookings</div>
            ) : (
              <div className="grid gap-4">
                {groupedBookings.completed.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </DashboardShell>
  );
}


