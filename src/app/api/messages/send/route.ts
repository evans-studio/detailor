import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  template_key: z.string().optional(),
  booking_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  idempotency_key: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const payload = schema.parse(await req.json());
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, email').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) throw new Error('Forbidden');
    // Enforce SMS/email messaging limits: if using email only, bypass; if SMS enabled, check credits
    const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', profile.tenant_id).single();
    const ff = (tenant?.feature_flags as Record<string, unknown>) || {};
    if (ff.sms_notifications === true || ff.sms_notifications === 'addon') {
      // Optional: decrement credits when SMS channel is used. Here we treat all sends as email; extend when SMS channel is added.
      // If we later add SMS, we will check 'sms_credits' > 0 and decrement via RPC.
    }
    // Demo tenants: route to sink (do not actually send)
    const { data: t } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    if (t?.is_demo) {
      return NextResponse.json({ ok: true, messageId: 'demo-sink' });
    }
    const res = await sendTenantEmail({
      tenantId: profile.tenant_id,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      templateKey: payload.template_key,
      bookingId: payload.booking_id,
      customerId: payload.customer_id,
      idempotencyKey: payload.idempotency_key,
    });
    return NextResponse.json(res);
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


