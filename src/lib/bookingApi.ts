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
  return api<{ ok: boolean; quote: { price_breakdown: PriceBreakdown } }>(`/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
}

export async function getSlots(days = 30) {
  return api<{ ok: boolean; slots: Array<{ start: string; end: string; capacity: number }> }>(`/api/availability/slots?days=${days}`);
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
  return api<{ ok: boolean; booking: unknown }>(`/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
}


