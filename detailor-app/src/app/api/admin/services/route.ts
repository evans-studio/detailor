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

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin.from('services').select('*').eq('tenant_id', profile.tenant_id).order('name');
    if (error) throw error;
    return NextResponse.json({ ok: true, services: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
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
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


