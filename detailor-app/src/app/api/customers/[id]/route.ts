import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  flags: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const id = req.url.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    // Staff/Admin fetch by tenant
    if (['staff','admin'].includes(profile.role)) {
      const { data, error } = await admin
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, customer: data });
    }
    // Customer self access
    const { data, error } = await admin
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('auth_user_id', user.id)
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, customer: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const id = req.url.split('/').pop() as string;
    const payload = updateSchema.parse(await req.json());
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin
      .from('customers')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, customer: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


