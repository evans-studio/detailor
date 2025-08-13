import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const admin = getSupabaseAdmin();

    // 1) Create Demo Auto Detailing tenant
    const legalName = 'Demo Auto Detailing Ltd';
    const tradingName = 'Demo Auto Detailing';
    const { data: existingTenant } = await admin
      .from('tenants')
      .select('*')
      .eq('trading_name', tradingName)
      .maybeSingle();

    const brand_theme = {
      brand: { primary: '#16a34a', 'primary-foreground': '#ffffff', secondary: '#0ea5e9', 'secondary-foreground': '#ffffff' },
      neutrals: { bg: '#ffffff', surface: '#f8fafc', border: '#e2e8f0', muted: '#f1f5f9', 'muted-foreground': '#64748b' },
      text: { text: '#0f172a', 'text-muted': '#64748b', 'inverse-text': '#ffffff' },
      status: { success: '#16a34a', 'success-foreground': '#ffffff', warning: '#f59e0b', 'warning-foreground': '#ffffff', error: '#dc2626', 'error-foreground': '#ffffff', info: '#0ea5e9', 'info-foreground': '#ffffff' },
      states: { 'focus-ring': '#93c5fd', selection: '#1d4ed8', 'hover-surface': '#f1f5f9' },
    };

    let tenantId = existingTenant?.id as string | undefined;
    if (!tenantId) {
      const { data: created, error } = await admin
        .from('tenants')
        .insert({ 
          legal_name: legalName, 
          trading_name: tradingName, 
          contact_email: 'demo@autodetailing.com', 
          brand_theme,
          is_demo: true
        })
        .select('*')
        .single();
      if (error) throw error;
      tenantId = created.id;
    }

    // 2) Enhanced Pricing config
    const { data: pricingExists } = await admin
      .from('pricing_configs')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (!pricingExists) {
      await admin.from('pricing_configs').insert({
        tenant_id: tenantId,
        vehicle_tiers: { S: 0.8, M: 1.0, L: 1.3, XL: 1.6 },
        distance_policy: { free_radius: 10, surcharge_per_mile: 2 },
        temporal_multipliers: { weekend: 1.2, evening: 1.1 },
        minimum_callout: { enabled: true, amount: 40 },
        discounts: [
          { name: 'First Time Customer', type: 'percentage', value: 15 },
          { name: 'Loyalty (5+ bookings)', type: 'percentage', value: 10 }
        ],
        tax: { rate: 0.2 },
      });
    }

    // 3) Enhanced Services (5 services as requested)
    const servicesSeed = [
      { name: 'Basic Wash & Dry', category: 'Wash', base_price: 25, base_duration_min: 45, description: 'Exterior wash with hand dry' },
      { name: 'Premium Valet', category: 'Valet', base_price: 65, base_duration_min: 120, description: 'Complete interior and exterior clean' },
      { name: 'Full Detail Service', category: 'Detail', base_price: 150, base_duration_min: 300, description: 'Comprehensive detailing with paint protection' },
      { name: 'Paint Correction', category: 'Detail', base_price: 280, base_duration_min: 480, description: 'Multi-stage paint correction and protection' },
      { name: 'Ceramic Coating', category: 'Protection', base_price: 450, base_duration_min: 360, description: 'Professional ceramic coating application' },
    ];

    for (const svc of servicesSeed) {
      const { data: exists } = await admin
        .from('services')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', svc.name)
        .maybeSingle();
      if (!exists) {
        await admin.from('services').insert({ 
          tenant_id: tenantId, 
          visible: true, 
          media_refs: [], 
          ...svc 
        });
      }
    }

    // Enhanced Add-ons
    const addonsSeed = [
      { name: 'Pet Hair Removal', price_delta: 25, duration_delta_min: 30, description: 'Specialized pet hair removal treatment' },
      { name: 'Odour Elimination', price_delta: 35, duration_delta_min: 45, description: 'Deep odour treatment and sanitization' },
      { name: 'Headlight Restoration', price_delta: 40, duration_delta_min: 60, description: 'Professional headlight restoration' },
      { name: 'Engine Bay Clean', price_delta: 50, duration_delta_min: 90, description: 'Complete engine bay detailing' },
    ];

    for (const addon of addonsSeed) {
      const { data: exists } = await admin
        .from('add_ons')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', addon.name)
        .maybeSingle();
      if (!exists) {
        await admin.from('add_ons').insert({ 
          tenant_id: tenantId, 
          compatibility: {}, 
          ...addon 
        });
      }
    }

    // 4) Work patterns (Mon-Sat 8-18, higher capacity)
    const weekdays = [1, 2, 3, 4, 5, 6]; // Mon-Sat
    for (const d of weekdays) {
      const { data: exists } = await admin
        .from('work_patterns')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('weekday', d)
        .maybeSingle();
      if (!exists) {
        await admin.from('work_patterns').insert({ 
          tenant_id: tenantId, 
          weekday: d, 
          start_time: '08:00', 
          end_time: '18:00', 
          capacity: d === 6 ? 2 : 4 // Less capacity on Saturday
        });
      }
    }

    // 5) Create 20 sample customers
    const customersSeed = [
      { name: 'John Smith', email: 'john.smith@example.com', phone: '555-0101' },
      { name: 'Sarah Johnson', email: 'sarah.j@example.com', phone: '555-0102' },
      { name: 'Michael Brown', email: 'mike.brown@example.com', phone: '555-0103' },
      { name: 'Emily Davis', email: 'emily.davis@example.com', phone: '555-0104' },
      { name: 'David Wilson', email: 'david.wilson@example.com', phone: '555-0105' },
      { name: 'Lisa Anderson', email: 'lisa.anderson@example.com', phone: '555-0106' },
      { name: 'Robert Taylor', email: 'robert.taylor@example.com', phone: '555-0107' },
      { name: 'Jennifer Martinez', email: 'jen.martinez@example.com', phone: '555-0108' },
      { name: 'Christopher Lee', email: 'chris.lee@example.com', phone: '555-0109' },
      { name: 'Amanda White', email: 'amanda.white@example.com', phone: '555-0110' },
      { name: 'James Garcia', email: 'james.garcia@example.com', phone: '555-0111' },
      { name: 'Jessica Rodriguez', email: 'jessica.rod@example.com', phone: '555-0112' },
      { name: 'Daniel Thompson', email: 'daniel.thompson@example.com', phone: '555-0113' },
      { name: 'Michelle Jackson', email: 'michelle.jackson@example.com', phone: '555-0114' },
      { name: 'Kevin Harris', email: 'kevin.harris@example.com', phone: '555-0115' },
      { name: 'Rachel Clark', email: 'rachel.clark@example.com', phone: '555-0116' },
      { name: 'Andrew Lewis', email: 'andrew.lewis@example.com', phone: '555-0117' },
      { name: 'Nicole Walker', email: 'nicole.walker@example.com', phone: '555-0118' },
      { name: 'Brian Hall', email: 'brian.hall@example.com', phone: '555-0119' },
      { name: 'Stephanie Allen', email: 'stephanie.allen@example.com', phone: '555-0120' },
    ];

    const customerIds = [];
    for (const customer of customersSeed) {
      const { data: exists } = await admin
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', customer.email)
        .maybeSingle();
      
      if (!exists) {
        const { data: created } = await admin
          .from('customers')
          .insert({ 
            tenant_id: tenantId, 
            ...customer,
            total_spent: Math.floor(Math.random() * 500) + 50, // Random between 50-550
            total_bookings: Math.floor(Math.random() * 8) + 1, // Random between 1-8
          })
          .select('id')
          .single();
        if (created) customerIds.push(created.id);
      } else {
        customerIds.push(exists.id);
      }
    }

    // 6) Create vehicles for customers
    const vehicleData = [
      { make: 'BMW', model: 'X5', year: 2022, colour: 'Black', size_tier: 'L' },
      { make: 'Audi', model: 'A4', year: 2021, colour: 'White', size_tier: 'M' },
      { make: 'Mercedes', model: 'C-Class', year: 2023, colour: 'Silver', size_tier: 'M' },
      { make: 'Tesla', model: 'Model S', year: 2022, colour: 'Red', size_tier: 'L' },
      { make: 'Ford', model: 'Fiesta', year: 2020, colour: 'Blue', size_tier: 'S' },
      { make: 'Volkswagen', model: 'Golf', year: 2021, colour: 'Grey', size_tier: 'S' },
      { make: 'Range Rover', model: 'Evoque', year: 2023, colour: 'Green', size_tier: 'L' },
      { make: 'Jaguar', model: 'F-Pace', year: 2022, colour: 'Black', size_tier: 'L' },
      { make: 'Mini', model: 'Cooper', year: 2021, colour: 'Yellow', size_tier: 'S' },
      { make: 'Porsche', model: '911', year: 2023, colour: 'White', size_tier: 'M' },
    ];

    for (let i = 0; i < Math.min(customerIds.length, vehicleData.length); i++) {
      const customerId = customerIds[i];
      const vehicle = vehicleData[i % vehicleData.length];
      
      const { data: vExists } = await admin
        .from('vehicles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customerId)
        .maybeSingle();
      
      if (!vExists) {
        await admin.from('vehicles').insert({
          tenant_id: tenantId,
          customer_id: customerId,
          ...vehicle,
        });
      }
    }

    // 7) Create addresses for customers
    const addressData = [
      { label: 'Home', address_line1: '123 Oak Street', city: 'Manchester', postcode: 'M1 1AA' },
      { label: 'Work', address_line1: '456 Business Park', city: 'Birmingham', postcode: 'B2 2BB' },
      { label: 'Home', address_line1: '789 Elm Avenue', city: 'Leeds', postcode: 'LS3 3CC' },
      { label: 'Home', address_line1: '321 Pine Road', city: 'Liverpool', postcode: 'L4 4DD' },
      { label: 'Office', address_line1: '654 Cedar Lane', city: 'Sheffield', postcode: 'S5 5EE' },
      { label: 'Home', address_line1: '987 Maple Drive', city: 'Bristol', postcode: 'BS6 6FF' },
      { label: 'Home', address_line1: '147 Birch Close', city: 'Newcastle', postcode: 'NE7 7GG' },
      { label: 'Work', address_line1: '258 Willow Way', city: 'Nottingham', postcode: 'NG8 8HH' },
      { label: 'Home', address_line1: '369 Ash Gardens', city: 'Cardiff', postcode: 'CF9 9II' },
      { label: 'Home', address_line1: '741 Beech Court', city: 'Edinburgh', postcode: 'EH10 0JJ' },
    ];

    for (let i = 0; i < Math.min(customerIds.length, addressData.length); i++) {
      const customerId = customerIds[i];
      const address = addressData[i % addressData.length];
      
      const { data: aExists } = await admin
        .from('addresses')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customerId)
        .maybeSingle();
      
      if (!aExists) {
        await admin.from('addresses').insert({
          tenant_id: tenantId,
          customer_id: customerId,
          is_default: true,
          ...address,
        });
      }
    }

    // 8) Create 30 diverse bookings (mix of past/upcoming/completed)
    const { data: services } = await admin.from('services').select('*').eq('tenant_id', tenantId);
    const { data: customers } = await admin.from('customers').select('*').eq('tenant_id', tenantId).limit(10);
    const { data: vehicles } = await admin.from('vehicles').select('*').eq('tenant_id', tenantId).limit(10);
    const { data: addresses } = await admin.from('addresses').select('*').eq('tenant_id', tenantId).limit(10);
    const { data: pricing } = await admin.from('pricing_configs').select('*').eq('tenant_id', tenantId).single();

    if (services && customers && vehicles && addresses && pricing) {
      const bookings = [];
      const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'completed', 'completed']; // More completed
      const paymentStatuses = ['paid', 'paid', 'paid', 'pending', 'paid']; // Most paid

      for (let i = 0; i < 30; i++) {
        const service = services[i % services.length];
        const customer = customers[i % customers.length];
        const vehicle = vehicles[i % vehicles.length];
        const address = addresses[i % addresses.length];

        // Create varied booking times (past, present, future)
        const now = new Date();
        const bookingDate = new Date(now);
        
        if (i < 15) {
          // Past bookings (completed mostly)
          bookingDate.setDate(now.getDate() - Math.floor(Math.random() * 30) - 1);
        } else if (i < 20) {
          // Today's bookings
          bookingDate.setDate(now.getDate());
        } else {
          // Future bookings
          bookingDate.setDate(now.getDate() + Math.floor(Math.random() * 21) + 1);
        }

        bookingDate.setHours(Math.floor(Math.random() * 8) + 9); // 9-17
        bookingDate.setMinutes([0, 15, 30, 45][Math.floor(Math.random() * 4)]);

        const endDate = new Date(bookingDate);
        endDate.setMinutes(endDate.getMinutes() + service.base_duration_min);

        const taxRate = Number(pricing.tax?.rate ?? 0);
        const basePrice = Number(service.base_price);
        const tax = Math.round(basePrice * taxRate * 100) / 100;
        const total = Math.round((basePrice + tax) * 100) / 100;

        const status = i < 15 ? 'completed' : statuses[i % statuses.length];
        const paymentStatus = status === 'completed' ? 'paid' : paymentStatuses[i % paymentStatuses.length];

        bookings.push({
          tenant_id: tenantId,
          customer_id: customer.id,
          vehicle_id: vehicle.id,
          address_id: address.id,
          service_id: service.id,
          addon_ids: [],
          start_at: bookingDate.toISOString(),
          end_at: endDate.toISOString(),
          reference: `DEMO-${String(i + 1).padStart(3, '0')}`,
          price_breakdown: { base: basePrice, addons: 0, taxRate, tax, total },
          status,
          payment_status: paymentStatus,
        });
      }

      // Insert bookings in batches
      const batchSize = 10;
      for (let i = 0; i < bookings.length; i += batchSize) {
        const batch = bookings.slice(i, i + batchSize);
        await admin.from('bookings').insert(batch);
      }
    }

    // 9) Create admin user
    const adminEmail = 'admin@autodetailing.com';
    const defaultPassword = 'DemoAdmin123!';

    const ensureUser = async (email: string, password: string) => {
      const { data: list } = await admin.auth.admin.listUsers();
      const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) return found.id;
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      return created.data.user?.id as string;
    };

    const adminUserId = await ensureUser(adminEmail, defaultPassword);

    const { data: adminProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', adminUserId)
      .maybeSingle();
    if (!adminProfile) {
      await admin.from('profiles').insert({ 
        id: adminUserId, 
        tenant_id: tenantId, 
        role: 'admin', 
        email: adminEmail, 
        full_name: 'Demo Admin User' 
      });
    }

    return createSuccessResponse({ 
      message: 'Demo Auto Detailing tenant created successfully',
      tenantId, 
      adminEmail, 
      defaultPassword,
      stats: {
        services: services?.length || 0,
        customers: customerIds.length,
        bookings: 30
      }
    });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/demo/seed-full' }, 400);
  }
}