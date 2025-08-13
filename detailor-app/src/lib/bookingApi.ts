import { api } from '@/lib/api';

export type QuoteRequest = {
  customer_id: string;
  service_id: string;
  addon_ids?: string[];
  vehicle_size_tier: string;
  scheduled_at?: string;
  distance_miles?: number;
  discount_code?: string;
};

type PriceBreakdown = { base: number; addons: number; taxRate: number; tax: number; total: number };
export async function getQuote(req: QuoteRequest) {
  const res = await fetch(`/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Failed to get quote');
  return json.data || json;
}

export async function getSlots(days = 30) {
  const res = await fetch(`/api/availability/slots?days=${days}`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Failed to load slots');
  return json.data || json;
}

export type CreateBookingRequest = {
  customer_id: string;
  vehicle_id: string;
  address_id: string;
  service_id: string;
  addon_ids?: string[];
  start_at: string;
  end_at: string;
  reference: string;
};

export async function createBooking(req: CreateBookingRequest) {
  const res = await fetch(`/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create booking');
  return json.data || json;
}


