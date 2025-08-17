import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      if (table === 'customers') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { tenant_id: 't1' } }) }) }) } as any;
      }
      if (table === 'bookings') {
        // First call (overlap check) returns one overlapping booking
        let first = true;
        return {
          select: () => ({
            eq: () => ({ lt: () => ({ gt: () => ({ in: () => Promise.resolve({ data: first ? [{ id: 'b1' }] : [] }) }) }) })
          })
        } as any;
      }
      if (table === 'tenants') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { feature_flags: {}, plan: 'Starter' } }) }) }) } as any;
      }
      if (table === 'services') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 's1', base_price: 100 } }) }) }) } as any;
      }
      if (table === 'add_ons') {
        return { select: () => ({ in: () => Promise.resolve({ data: [] }) }) } as any;
      }
      if (table === 'pricing_configs') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { tax: { rate: 0.2 } } }) }) }) } as any;
      }
      return {
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'bk-new' } }) }) })
      } as any;
    }
  })
}));

vi.mock('@/lib/rate-limit', () => ({ shouldRateLimit: () => ({ limited: false, remaining: 1, resetAt: Date.now() + 1000 }) }));

describe('POST /api/guest/bookings', () => {
  it('returns 409 on overlapping booking', async () => {
    const { POST } = await import('@/app/api/guest/bookings/route');
    const payload = {
      customer_id: '00000000-0000-0000-0000-000000000000',
      vehicle_id: '00000000-0000-0000-0000-000000000000',
      address_id: '00000000-0000-0000-0000-000000000000',
      service_id: '00000000-0000-0000-0000-000000000000',
      addon_ids: [],
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 60*60*1000).toISOString(),
      reference: 'BK-TEST-1',
    };
    const req = new Request('http://localhost/api/guest/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const res = await POST(req);
    expect((res as Response).status).toBe(409);
  });
});
