import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';

const schema = z.object({ to: z.string().email(), subject: z.string().default('DetailFlow Test'), text: z.string().default('Hello from DetailFlow.'), trading_name: z.string().default('DetailFlow Demo') });

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Disabled in production' }, { status: 403 });
  }
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = schema.parse(body);
    const { data: tenant } = await admin.from('tenants').select('id').eq('trading_name', payload.trading_name).single();
    if (!tenant) throw new Error('Demo tenant not found');
    const res = await sendTenantEmail({ tenantId: tenant.id as string, to: payload.to, subject: payload.subject, text: payload.text });
    return NextResponse.json(res);
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


