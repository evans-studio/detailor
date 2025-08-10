"use client";
import { createClient } from '@supabase/supabase-js';

export type SupaBooking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  payment_status: string;
};

export function subscribeBookings(tenantId: string, onChange: (event: { type: 'INSERT' | 'UPDATE' | 'DELETE'; record: SupaBooking }) => void) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  const channel = client
    .channel('bookings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
      onChange({ type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE', record: payload.new as unknown as SupaBooking });
    })
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

export type SupaPayment = {
  id: string;
  tenant_id: string;
  booking_id: string | null;
  amount: number;
  status: 'requires_action' | 'pending' | 'succeeded' | 'refunded' | 'failed';
};

export function subscribePayments(
  tenantId: string,
  onChange: (event: { type: 'INSERT' | 'UPDATE' | 'DELETE'; record: SupaPayment }) => void
) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  const channel = client
    .channel('payments-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
      onChange({ type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE', record: payload.new as unknown as SupaPayment });
    })
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}


