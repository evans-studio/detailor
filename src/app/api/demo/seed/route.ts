import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const admin = getSupabaseAdmin();

    // 1) Tenant (idempotent)
    const legalName = 'DetailFlow Demo Ltd';
    const tradingName = 'DetailFlow Demo';
    const { data: existingTenant } = await admin
      .from('tenants')
      .select('*')
      .eq('trading_name', tradingName)
      .maybeSingle();

    const brand_theme = {
      brand: { primary: '#2563eb', 'primary-foreground': '#ffffff', secondary: '#7c3aed', 'secondary-foreground': '#ffffff' },
      neutrals: { bg: '#0b0c0f', surface: '#0f1115', border: '#1f2430', muted: '#94a3b8', 'muted-foreground': '#94a3b8' },
      text: { text: '#e2e8f0', 'text-muted': '#94a3b8', 'inverse-text': '#0b0c0f' },
      status: { success: '#16a34a', 'success-foreground': '#052e16', warning: '#f59e0b', 'warning-foreground': '#3b1d00', error: '#dc2626', 'error-foreground': '#3f0d0f', info: '#0ea5e9', 'info-foreground': '#082f49' },
      states: { 'focus-ring': '#93c5fd', selection: '#1d4ed8', 'hover-surface': '#111827' },
    };

    let tenantId = existingTenant?.id as string | undefined;
    if (!tenantId) {
      const { data: created, error } = await admin
        .from('tenants')
        .insert({ legal_name: legalName, trading_name: tradingName, contact_email: 'demo@tenant.com', brand_theme })
        .select('*')
        .single();
      if (error) throw error;
      tenantId = created.id;
    } else {
      // ensure theme present
      if (!existingTenant.brand_theme || Object.keys(existingTenant.brand_theme || {}).length === 0) {
        await admin.from('tenants').update({ brand_theme }).eq('id', tenantId);
      }
    }

    // 2) Pricing config (singleton per tenant)
    const { data: pricingExists } = await admin
      .from('pricing_configs')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (!pricingExists) {
      await admin.from('pricing_configs').insert({
        tenant_id: tenantId,
        vehicle_tiers: { S: 0.9, M: 1, L: 1.2, XL: 1.4 },
        distance_policy: { free_radius: 5, surcharge_per_mile: 1 },
        temporal_multipliers: { weekend: 1.1 },
        minimum_callout: { enabled: false },
        discounts: [],
        tax: { rate: 0.2 },
      });
    }

    // 3) Services & Add-ons
    const servicesSeed = [
      { name: 'Exterior Wash', category: 'Wash', base_price: 30, base_duration_min: 60 },
      { name: 'Full Valet', category: 'Valet', base_price: 80, base_duration_min: 150 },
      { name: 'Paint Correction', category: 'Detail', base_price: 200, base_duration_min: 240 },
    ];
    for (const svc of servicesSeed) {
      const { data: exists } = await admin
        .from('services')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', svc.name)
        .maybeSingle();
      if (!exists) {
        await admin.from('services').insert({ tenant_id: tenantId, visible: true, description: '', media_refs: [], ...svc });
      }
    }

    const addonsSeed = [
      { name: 'Pet Hair Removal', price_delta: 20, duration_delta_min: 30 },
      { name: 'Odour Treatment', price_delta: 25, duration_delta_min: 30 },
    ];
    for (const a of addonsSeed) {
      const { data: exists } = await admin
        .from('add_ons')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', a.name)
        .maybeSingle();
      if (!exists) {
        await admin.from('add_ons').insert({ tenant_id: tenantId, description: '', compatibility: {}, ...a });
      }
    }

    // 4) Work patterns (Mon-Fri 9-17, capacity 2)
    const weekdays = [1, 2, 3, 4, 5];
    for (const d of weekdays) {
      const { data: exists } = await admin
        .from('work_patterns')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('weekday', d)
        .maybeSingle();
      if (!exists) {
        await admin.from('work_patterns').insert({ tenant_id: tenantId, weekday: d, start_time: '09:00', end_time: '17:00', capacity: 2 });
      }
    }

    // 5) Demo users: admin & customer
    const adminEmail = 'demo_admin@tenant.com';
    const customerEmail = 'demo_customer@tenant.com';
    const defaultPassword = 'DemoPass123!';

    // Create auth users if absent
    const ensureUser = async (email: string, password: string) => {
      const { data: list } = await admin.auth.admin.listUsers();
      const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) return found.id;
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      return created.data.user?.id as string;
    };

    const adminUserId = await ensureUser(adminEmail, defaultPassword);
    const customerUserId = await ensureUser(customerEmail, defaultPassword);

    // Profiles (admin)
    const { data: adminProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', adminUserId)
      .maybeSingle();
    if (!adminProfile) {
      await admin.from('profiles').insert({ id: adminUserId, tenant_id: tenantId, role: 'admin', email: adminEmail, full_name: 'Demo Admin' });
    }

    // Customer + profile
    const { data: customerProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', customerUserId)
      .maybeSingle();
    if (!customerProfile) {
      await admin.from('profiles').insert({ id: customerUserId, tenant_id: tenantId, role: 'customer', email: customerEmail, full_name: 'Demo Customer' });
    }

    // Customer entity row
    const { data: customerRow } = await admin
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('auth_user_id', customerUserId)
      .maybeSingle();
    let customerId = customerRow?.id as string | undefined;
    if (!customerId) {
      const { data: created } = await admin
        .from('customers')
        .insert({ tenant_id: tenantId, auth_user_id: customerUserId, name: 'Demo Customer', email: customerEmail })
        .select('*')
        .single();
      customerId = created.id;
    }

    // One vehicle and one address for the demo customer
    const { data: veh } = await admin
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (!veh) {
      await admin.from('vehicles').insert({ tenant_id: tenantId, customer_id: customerId, make: 'Tesla', model: 'Model 3', year: 2021, colour: 'Blue', size_tier: 'M' });
    }

    const { data: addr } = await admin
      .from('addresses')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (!addr) {
      await admin.from('addresses').insert({ tenant_id: tenantId, customer_id: customerId, label: 'Home', address_line1: '1 Demo Street', city: 'Demo City', postcode: 'DM0 1AA', is_default: true });
    }

    // 6) Seed a few demo bookings
    const { data: svcPick } = await admin.from('services').select('*').eq('tenant_id', tenantId).order('base_price').limit(1).single();
    const { data: vRow } = await admin.from('vehicles').select('id').eq('tenant_id', tenantId).eq('customer_id', customerId).single();
    const { data: aRow } = await admin.from('addresses').select('id').eq('tenant_id', tenantId).eq('customer_id', customerId).single();
    const { data: pricing } = await admin.from('pricing_configs').select('*').eq('tenant_id', tenantId).single();
    if (svcPick && vRow && aRow && pricing) {
      const taxRate = Number(pricing.tax?.rate ?? 0);
      const base = Number(svcPick.base_price);
      const tax = Math.round(base * taxRate * 100) / 100;
      const total = Math.round((base + tax) * 100) / 100;
      const price_breakdown = { base, addons: 0, taxRate, tax, total };
      const now = new Date();
      const inserts = [] as Array<Record<string, unknown>>;
      for (let i = 1; i <= 4; i++) {
        const start = new Date(now);
        start.setDate(start.getDate() + i);
        start.setHours(10, 0, 0, 0);
        const end = new Date(start);
        const dur = Number(svcPick.base_duration_min || 60);
        end.setMinutes(end.getMinutes() + dur);
        const statuses = ['pending', 'confirmed', 'completed'] as const;
        const status = statuses[i % statuses.length];
        inserts.push({
          tenant_id: tenantId,
          customer_id: customerId,
          vehicle_id: vRow.id,
          address_id: aRow.id,
          service_id: svcPick.id,
          addon_ids: [],
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          reference: `DEMO-${Date.now()}-${i}`,
          price_breakdown,
          status,
          payment_status: 'unpaid',
        });
      }
      if (inserts.length) {
        await admin.from('bookings').insert(inserts);
      }
    }

    return NextResponse.json({ ok: true, tenantId, adminEmail, customerEmail, defaultPassword });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


