import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';

const schema = z.object({ to: z.string().email(), subject: z.string().default('Detailor Test'), text: z.string().default('Hello from Detailor.'), trading_name: z.string().default('Detailor Demo') });

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Disabled in production', undefined, 403);
  }
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = schema.parse(body);
    const { data: tenant } = await admin.from('tenants').select('id').eq('trading_name', payload.trading_name).single();
    if (!tenant) throw new Error('Demo tenant not found');
    const res = await sendTenantEmail({ tenantId: tenant.id as string, to: payload.to, subject: payload.subject, text: payload.text });
    return NextResponse.json({ success: true, data: res, meta: { timestamp: new Date().toISOString() } });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/dev/send-test' }, 400);
  }
}


