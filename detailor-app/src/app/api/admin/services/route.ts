export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  base_price: z.number().min(0),
  base_duration_min: z.number().int().min(0),
  visible: z.boolean().optional(),
});

// Generate sample services when database table doesn't exist
const generateSampleServices = (tenantId: string) => [
  {
    id: 'sample-1',
    tenant_id: tenantId,
    name: 'Premium Detail',
    category: 'Detail Package',
    description: 'Complete interior and exterior detailing service',
    base_price: 150,
    base_duration_min: 180,
    visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sample-2', 
    tenant_id: tenantId,
    name: 'Express Wash',
    category: 'Quick Service',
    description: 'Fast exterior wash and dry',
    base_price: 25,
    base_duration_min: 30,
    visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sample-3',
    tenant_id: tenantId,
    name: 'Paint Correction',
    category: 'Specialty Service',
    description: 'Professional paint correction and polishing',
    base_price: 300,
    base_duration_min: 240,
    visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    
    try {
      const { data, error } = await admin.from('services').select('*').eq('tenant_id', profile.tenant_id).order('name');
      
      if (error) {
        console.warn('Services table error, using sample data:', error);
        return NextResponse.json({
          ok: true,
          services: generateSampleServices(profile.tenant_id),
          warning: 'Using sample services - database table not available'
        });
      }

      // If no services exist, return sample services
      if (!data || data.length === 0) {
        return NextResponse.json({
          ok: true,
          services: generateSampleServices(profile.tenant_id),
          info: 'No services configured - showing sample services'
        });
      }

      return NextResponse.json({ ok: true, services: data });

    } catch (dbError) {
      console.warn('Database error getting services:', dbError);
      return NextResponse.json({
        ok: true,
        services: generateSampleServices(profile.tenant_id),
        warning: 'Using sample services due to database error'
      });
    }

  } catch (error: unknown) {
    console.error('Services API error:', error);
    return NextResponse.json({
      ok: false,
      error: (error as Error).message
    }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const payload = bodySchema.parse(body);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Admin only');

    try {
      // Check services limit for the tenant
      const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', profile.tenant_id).single();
      const servicesLimit = tenant?.feature_flags?.services_limit as number | null;
      
      if (servicesLimit !== null && servicesLimit > 0) {
        const { data: currentServices } = await admin.from('services').select('id').eq('tenant_id', profile.tenant_id);
        const currentCount = currentServices?.length || 0;
        
        if (currentCount >= servicesLimit) {
          throw new Error(`Service limit reached (${servicesLimit}). Upgrade to Pro for more services.`);
        }
      }

      // Check if service name already exists for this tenant
      const { data: existingService } = await admin
        .from('services')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .ilike('name', payload.name)
        .single();
      
      if (existingService) {
        throw new Error(`A service named "${payload.name}" already exists. Please choose a different name.`);
      }

      const { data, error } = await admin
        .from('services')
        .insert({ tenant_id: profile.tenant_id, ...payload })
        .select('*')
        .single();
      
      if (error) {
        // Handle specific constraint violations with better error messages
        if (error.code === '23505' && error.message?.includes('services_tenant_id_name_key')) {
          throw new Error(`A service named "${payload.name}" already exists. Please choose a different name.`);
        }
        throw error;
      }
      
      return NextResponse.json({ ok: true, service: data });

    } catch (dbError: any) {
      // If services table doesn't exist, return a helpful error
      if (dbError.message?.includes('relation "services" does not exist') || 
          dbError.code === '42P01') {
        return NextResponse.json({
          ok: false,
          error: 'Services table not set up yet. Please contact support to initialize your database.'
        }, { status: 503 });
      }
      
      // Re-throw other database errors to be handled by outer catch
      throw dbError;
    }
    
  } catch (error: unknown) {
    console.error('Services POST API error:', error);
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


