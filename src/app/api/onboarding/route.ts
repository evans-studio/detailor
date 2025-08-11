export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/authServer';
import { sendWelcomeEmail } from '@/lib/email';

const bodySchema = z.object({
  legal_name: z.string().min(1),
  trading_name: z.string().optional(),
  contact_email: z.string().email(),
  admin_email: z.string().email(),
  admin_full_name: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bodySchema.parse(body);
    const admin = getSupabaseAdmin();

    const { data: tenant, error: tErr } = await admin
      .from('tenants')
      .insert({
        legal_name: parsed.legal_name,
        trading_name: parsed.trading_name ?? parsed.legal_name,
        contact_email: parsed.contact_email,
      })
      .select('*')
      .single();
    if (tErr || !tenant) throw tErr ?? new Error('Tenant creation failed');

    const { data: invite, error: iErr } = await admin
      .from('tenant_invites')
      .insert({ tenant_id: tenant.id, email: parsed.admin_email, role: 'admin' })
      .select('*')
      .single();
    if (iErr || !invite) throw iErr ?? new Error('Invite creation failed');
    // If the current request has an authenticated user, link them immediately
    try {
      const { user } = await getUserFromRequest(req);
      if (user) {
        await admin.from('profiles').upsert({ id: user.id, email: user.email, tenant_id: tenant.id, role: 'admin' }, { onConflict: 'id' });
        await admin.from('tenant_invites').update({ status: 'accepted', accepted_by: user.id, accepted_at: new Date().toISOString() }).eq('id', invite.id);
      }
    } catch {}

    // Send welcome email to admin
    try {
      await sendWelcomeEmail({
        tenant_name: tenant.trading_name || tenant.legal_name,
        admin_email: parsed.admin_email,
        admin_name: parsed.admin_full_name,
      });
    } catch (emailError) {
      // Log email errors but don't fail the onboarding
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({ ok: true, tenant, invite });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


