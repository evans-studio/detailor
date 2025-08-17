import { describe, it, expect, vi } from 'vitest';

type TableName = 'customers' | 'services' | 'add_ons' | 'pricing_configs';

function createMockAdminClient() {
  const state: { last: any } = { last: {} };
  return {
    from(table: TableName) {
      state.last.table = table;
      const builder: any = {
        select() { return builder; },
        eq(col: string, val: any) { state.last.eq = { col, val }; return builder; },
        in(_col: string, _vals: any[]) { state.last.in = { _col, _vals }; return builder; },
        single() {
          if (table === 'customers') return Promise.resolve({ data: { tenant_id: 't1' } });
          if (table === 'services') return Promise.resolve({ data: { id: state.last.eq?.val, tenant_id: 't1', base_price: 100 } });
          if (table === 'pricing_configs') {
            return Promise.resolve({ data: {
              vehicle_tiers: { L: 1.5, M: 1.2, S: 1 },
              tax: { rate: 0.2 },
              distance_policy: { free_radius: 5, surcharge_per_mile: 1 },
            }});
          }
          return Promise.resolve({ data: null });
        },
        then: undefined,
      };
      if (table === 'add_ons') {
        (builder as any).then = undefined;
        (builder as any).returns = [
          { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', price_delta: 20 },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', price_delta: 5 }
        ];
        (builder as any).then = undefined;
        (builder as any).eq = () => builder;
        (builder as any).in = () => builder;
        (builder as any).select = () => ({
          in: () => ({ eq: () => Promise.resolve({ data: (builder as any).returns }) })
        });
        return builder;
      }
      return builder;
    },
  } as any;
}

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => createMockAdminClient(),
}));
vi.mock('@/lib/rate-limit', () => ({ shouldRateLimit: () => ({ limited: false, remaining: 1, resetAt: Date.now() + 1000 }) }));

describe('POST /api/guest/quotes', () => {
  it('computes total with vehicle multiplier, add-ons, distance surcharge and tax', async () => {
    const { POST } = await import('@/app/api/guest/quotes/route');
    const body = {
      customer_id: '00000000-0000-0000-0000-000000000000',
      service_id: '00000000-0000-0000-0000-000000000000',
      vehicle_size_tier: 'L',
      distance_miles: 10,
    };

    const req = new Request('http://localhost/api/guest/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const json = await (res as Response).json();

    if (!(json.success ?? true)) {
      // eslint-disable-next-line no-console
      console.log('guest/quotes error', json.error);
    }
    expect(json.success ?? true).toBe(true);
    const pb = json.data?.quote?.price_breakdown || json.quote?.price_breakdown;
    // base_price 100 * 1.5 + distance surcharge (5) = 155 base; tax 20% => 31; total 186
    expect(pb.base).toBeCloseTo(150, 3);
    expect(pb.addons).toBeCloseTo(0, 3);
    expect(pb.distance).toBeCloseTo(5, 3);
    expect(pb.tax).toBeCloseTo(31, 3);
    expect(pb.total).toBeCloseTo(186, 3);
  });
});


