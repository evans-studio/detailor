"use client";
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/ui/button';
import { createBooking } from '@/lib/bookingApi';
import { useNotifications } from '@/lib/notifications';
import Link from 'next/link';

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [bookingRef, setBookingRef] = React.useState<string>('');
  const { notify } = useNotifications();

  React.useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        // Verify payment session
        const paymentRes = await fetch(`/api/payments/verify-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        
        const paymentData = await paymentRes.json();
        
        if (!paymentData.ok) {
          throw new Error('Payment verification failed');
        }

        // Get pending booking data from localStorage
        const pendingBookingData = localStorage.getItem('pendingBooking');
        if (!pendingBookingData) {
          throw new Error('Booking data not found');
        }

        const bookingData = JSON.parse(pendingBookingData);

        // Create the booking now that payment is confirmed
        let booking;
        if (bookingData.customer_info) {
          // Guest booking - use guest API
          const res = await fetch('/api/guest/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: bookingData.customer_id,
              vehicle_id: bookingData.vehicle_id,
              address_id: bookingData.address_id,
              service_id: bookingData.service_id,
              addon_ids: bookingData.addon_ids,
              start_at: bookingData.start_at,
              end_at: bookingData.end_at,
              reference: bookingData.reference,
              payment_status: 'paid'
            })
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error);
          booking = data;
        } else {
          // Authenticated booking
          booking = await createBooking({
            customer_id: bookingData.customer_id,
            vehicle_id: bookingData.vehicle_id,
            address_id: bookingData.address_id,
            service_id: bookingData.service_id,
            addon_ids: bookingData.addon_ids,
            start_at: bookingData.start_at,
            end_at: bookingData.end_at,
            reference: bookingData.reference
          });
        }

        setBookingRef(bookingData.reference);
        setStatus('success');

        // Clean up localStorage
        localStorage.removeItem('pendingBooking');
        localStorage.removeItem('bookingFormState');

      } catch (error) {
        console.error('Booking creation failed:', error);
        setStatus('error');
        notify({ title: 'Failed to create booking. Please contact support.' });
      }
    })();
  }, [sessionId, notify]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text)] mb-4">
            Processing your booking...
          </div>
          <div className="text-[var(--color-text-muted)]">
            Please wait while we confirm your payment and create your booking.
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-[var(--font-size-lg)] font-semibold text-[var(--color-error)] mb-4">
            Booking Failed
          </div>
          <div className="text-[var(--color-text-muted)] mb-6">
            There was an issue processing your booking. Please try again or contact support.
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/book/new">
              <Button intent="primary">Try Again</Button>
            </Link>
            <Link href="/">
              <Button intent="ghost">Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-success)] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="text-[var(--font-size-xl)] font-semibold text-[var(--color-text)] mb-2">
            Booking Confirmed!
          </div>
          
          <div className="text-[var(--color-text-muted)] mb-4">
            Your booking has been successfully created and payment confirmed.
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 mb-6">
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-1">Booking Reference</div>
            <div className="text-[var(--font-size-lg)] font-mono font-semibold text-[var(--color-text)]">
              {bookingRef}
            </div>
          </div>

          <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mb-6">
            You will receive a confirmation email shortly with all the details.
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/customer/dashboard">
            <Button intent="primary">View My Bookings</Button>
          </Link>
          <Link href="/">
            <Button intent="ghost">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Disable SSR for this page due to useSearchParams
export const dynamic = 'force-dynamic';