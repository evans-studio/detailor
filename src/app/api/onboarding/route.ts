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

    // Use authenticated user email as canonical; upsert to avoid duplicates
    const { user } = await getUserFromRequest(req);
    const userEmail = user?.email as string | undefined;
    if (!userEmail) throw new Error('Authenticated user email is required');

    const existing = await admin.from('tenants').select('id').eq('email', userEmail).maybeSingle();
    let tenantId: string | undefined = existing.data?.id as string | undefined;
    if (tenantId) {
      const { error: updErr } = await admin
        .from('tenants')
        .update({
          legal_name: parsed.legal_name,
          trading_name: parsed.trading_name ?? parsed.legal_name,
          contact_email: parsed.contact_email,
        })
        .eq('id', tenantId);
      if (updErr) throw updErr;
    } else {
      const ins = await admin
        .from('tenants')
        .insert({
          legal_name: parsed.legal_name,
          trading_name: parsed.trading_name ?? parsed.legal_name,
          contact_email: parsed.contact_email,
          email: userEmail,
          status: 'active',
          is_demo: false,
        })
        .select('id')
        .single();
      if (ins.error || !ins.data) throw ins.error ?? new Error('Tenant creation failed');
      tenantId = ins.data.id as string;
    }

    const { data: invite, error: iErr } = await admin
      .from('tenant_invites')
      .insert({ tenant_id: tenantId, email: parsed.admin_email, role: 'admin' })
      .select('*')
      .single();
    if (iErr || !invite) throw iErr ?? new Error('Invite creation failed');
    // If the current request has an authenticated user, link them immediately
    try {
      if (user) {
        await admin.from('profiles').upsert({ id: user.id, email: user.email, tenant_id: tenantId, role: 'admin' }, { onConflict: 'id' });
        await admin.from('tenant_invites').update({ status: 'accepted', accepted_by: user.id, accepted_at: new Date().toISOString() }).eq('id', invite.id);
      }
    } catch {}

    // Send welcome email to admin (best-effort)
    try {
      await sendWelcomeEmail({
        tenant_name: parsed.trading_name || parsed.legal_name,
        admin_email: parsed.admin_email,
        admin_name: parsed.admin_full_name,
      });
    } catch (emailError) {
      // Log email errors but don't fail the onboarding
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({ ok: true, tenant_id: tenantId, invite });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


