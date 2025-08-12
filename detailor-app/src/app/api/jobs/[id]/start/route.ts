import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').slice(-2)[0];
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const { data: job } = await admin.from('jobs').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
    if (!job) throw new Error('Not found');
    if (profile.role === 'staff' && job.staff_profile_id !== profile.id) throw new Error('Forbidden');
    await admin.from('jobs').update({ status: 'in_progress' }).eq('id', id).eq('tenant_id', profile.tenant_id);
    await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: id, actor_profile_id: profile.id, event: 'started', payload: {} });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


