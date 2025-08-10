export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/authServer';

const bodySchema = z.object({ token: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const { token, user } = await (async () => {
      const body = await req.json();
      const parsed = bodySchema.parse(body);
      const { user } = await getUserFromRequest(req);
      return { token: parsed.token, user };
    })();

    const admin = getSupabaseAdmin();
    const { data: invite, error: iErr } = await admin
      .from('tenant_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();
    if (iErr || !invite) throw iErr ?? new Error('Invalid or consumed invite');

    // Upsert profile for this auth user
    const { error: pErr } = await admin.from('profiles').upsert(
      {
        id: user.id,
        tenant_id: invite.tenant_id,
        role: invite.role,
        email: user.email,
      },
      { onConflict: 'id' }
    );
    if (pErr) throw pErr;

    // Mark invite accepted
    const { error: uErr } = await admin
      .from('tenant_invites')
      .update({ status: 'accepted', accepted_by: user.id, accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
    if (uErr) throw uErr;

    return NextResponse.json({ ok: true, tenant_id: invite.tenant_id, role: invite.role });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


