import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/guest/availability/slots/route';

function createMockAdminClient() {
  return {
    from(table: string) {
      const builder: any = {
        select() { return builder; },
        eq() { return builder; },
        lte() { return builder; },
        gte() { return builder; },
        lt() { return builder; },
        gt() { return builder; },
      };
      if (table === 'tenants') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 't1', status: 'active' } }) }) }) } as any;
      }
      if (table === 'work_patterns') {
        return { select: () => ({ eq: () => Promise.resolve({ data: [
          { weekday: new Date().getUTCDay(), start_time: '09:00', end_time: '10:00', slot_duration_min: 30, capacity: 2 },
        ] }) }) } as any;
      }
      if (table === 'blackouts') {
        return { select: () => ({ eq: () => ({ lte: () => ({ gte: () => Promise.resolve({ data: [] }) }) }) }) } as any;
      }
      if (table === 'bookings') {
        return { select: () => ({ eq: () => ({ lt: () => ({ gt: () => Promise.resolve({ data: [
          // One overlapping booking consumes 1 capacity
          { start_at: new Date().toISOString(), end_at: new Date(Date.now() + 30*60*1000).toISOString(), status: 'confirmed' }
        ] }) }) }) }) } as any;
      }
      return builder;
    }
  } as any;
}

vi.mock('@/lib/supabaseAdmin', () => ({ getSupabaseAdmin: () => createMockAdminClient() }));

describe('GET /api/guest/availability/slots', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns slots with capacity reduced by overlapping bookings', async () => {
    const url = new URL('http://localhost/api/guest/availability/slots');
    url.searchParams.set('tenant_id', 't1');
    url.searchParams.set('days', '1');
    const req = new Request(url, { method: 'GET' });

    const res = await GET(req);
    const json = await (res as Response).json();

    expect(json.success ?? true).toBe(true);
    const slots = json.data?.slots || json.slots;
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
    // capacity should be 1 (2 original - 1 overlapping)
    expect(slots[0].capacity).toBe(1);
  });
});


