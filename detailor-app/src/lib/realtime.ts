"use client";
import * as React from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type TableName = 'bookings' | 'customers' | 'services' | 'messages';

export function useRealtimeTable<T = unknown>(
  table: TableName,
  onEvent: (payload: { type: 'INSERT' | 'UPDATE' | 'DELETE'; new?: T; old?: T }) => void,
  filter?: string
) {
  React.useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`rt:${table}:${filter || 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload: any) => {
          const type = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          onEvent({ type, new: payload.new as T, old: payload.old as T });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, filter, onEvent]);
}

import { createClient } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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

export type SupaJob = {
  id: string;
  tenant_id: string;
  booking_id: string;
  staff_profile_id: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'paid';
  started_at?: string | null;
  completed_at?: string | null;
};

export function subscribeJobs(
  tenantId: string,
  onChange: (event: { type: 'INSERT' | 'UPDATE' | 'DELETE'; record: SupaJob }) => void
) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  const channel = client
    .channel('jobs-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `tenant_id=eq.${tenantId}` }, (payload) => {
      onChange({ type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE', record: payload.new as unknown as SupaJob });
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
  const unsubJobs = subscribeJobs(tenantId, () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
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
    unsubJobs();
    unsubPayments();
    unsubInvoices();
  };
}

// System Bible Compliant: Real-time React Hook for Admin Operations
export function useRealtimeAdminUpdates(tenantId: string, enabled = true) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!enabled || !tenantId) return;
    
    // System Bible Pattern: Multi-entity real-time invalidation
    const unsubscribe = wireRealtimeInvalidations(tenantId, queryClient);
    
    return unsubscribe;
  }, [tenantId, enabled, queryClient]);
}

// System Bible Compliant: Enhanced real-time subscription for customer operations
export function useRealtimeCustomerUpdates(tenantId: string, customerId?: string, enabled = true) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!enabled || !tenantId) return;
    
    const unsubBookings = subscribeBookings(tenantId, (event) => {
      // System Bible Pattern: Granular invalidation for customer-specific updates
      if (customerId && event.record.id) {
        queryClient.invalidateQueries({ queryKey: ['bookings', { scope: 'customer-home' }] });
        queryClient.invalidateQueries({ queryKey: ['bookings', { scope: 'me' }] });
      }
    });
    
    const unsubPayments = subscribePayments(tenantId, () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', { customerId }] });
        queryClient.invalidateQueries({ queryKey: ['bookings', { scope: 'customer-home' }] });
      }
    });
    
    return () => {
      unsubBookings();
      unsubPayments();
    };
  }, [tenantId, customerId, enabled, queryClient]);
}

// System Bible Pattern: Status-aware real-time updates for workflow management
export function subscribeBookingStatusChanges(
  tenantId: string, 
  statusFilter: string[] = [], 
  onChange: (event: { type: 'INSERT' | 'UPDATE' | 'DELETE'; record: SupaBooking; previousStatus?: string }) => void
) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  
  const channel = client
    .channel('booking-status-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'bookings', 
      filter: `tenant_id=eq.${tenantId}` 
    }, (payload) => {
      const record = payload.new as unknown as SupaBooking;
      const oldRecord = payload.old as unknown as SupaBooking;
      
      // System Bible Pattern: Status workflow validation
      if (statusFilter.length === 0 || statusFilter.includes(record?.status)) {
        onChange({ 
          type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE', 
          record,
          previousStatus: oldRecord?.status 
        });
      }
    })
    .subscribe();
    
  return () => {
    client.removeChannel(channel);
  };
}


