"use client";
import { createClient } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';

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

export type SupaInvoice = {
  id: string;
  tenant_id: string;
  number: string;
  total: number;
  paid_amount: number;
  created_at: string;
};

export function subscribeInvoices(
  tenantId: string,
  onChange: (event: { type: 'INSERT' | 'UPDATE' | 'DELETE'; record: SupaInvoice }) => void
) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  const channel = client
    .channel('invoices-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
      onChange({ type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE', record: payload.new as unknown as SupaInvoice });
    })
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

export function wireRealtimeInvalidations(tenantId: string, queryClient: QueryClient) {
  const unsubBookings = subscribeBookings(tenantId, () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  });
  const unsubPayments = subscribePayments(tenantId, () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  });
  const unsubInvoices = subscribeInvoices(tenantId, () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  });
  return () => {
    unsubBookings();
    unsubPayments();
    unsubInvoices();
  };
}


