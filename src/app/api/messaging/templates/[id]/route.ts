import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const updateSchema = z.object({
  subject: z.string().optional(),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const body = await req.json();
    const payload = updateSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
    const { data, error } = await admin.from('message_templates').update(payload).eq('id', id).eq('tenant_id', profile.tenant_id).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, template: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['admin','staff'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin.from('message_templates').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
    if (error) throw error;
    return NextResponse.json({ ok: true, template: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


