export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    // Staff/Admin view tenant customers; customer sees their own via RLS + filter
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (profile && ['staff', 'admin'].includes(profile.role)) {
      const { data, error } = await admin.from('customers').select('*').eq('tenant_id', profile.tenant_id).order('created_at');
      if (error) throw error;
      return NextResponse.json({ ok: true, customers: data });
    }
    // Fallback: try self customer
    const { data, error } = await admin.from('customers').select('*').eq('auth_user_id', user.id).order('created_at');
    if (error) throw error;
    return NextResponse.json({ ok: true, customers: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin
      .from('customers')
      .insert({ tenant_id: profile.tenant_id, ...payload })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, customer: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


