import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';

const schema = z.object({
  template_key: z.string().min(1),
  segment: z.enum(['all','active','inactive']).default('all'),
  limit: z.number().int().positive().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const payload = schema.parse(await req.json());
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['admin','staff'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions', { required_roles: ['admin','staff'] }, 403);
    }

    const { data: tenant } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    const isDemo = Boolean(tenant?.is_demo);

    // Build recipient query
    let custQuery = admin.from('customers').select('id, email, flags').eq('tenant_id', profile.tenant_id);
    if (payload.segment === 'active') {
      custQuery = custQuery.or(`flags->>inactive.is.null,flags->>inactive.eq.false`);
    }
    if (payload.segment === 'inactive') {
      custQuery = custQuery.eq('flags->>inactive', 'true');
    }
    if (payload.limit) custQuery = custQuery.limit(payload.limit);
    const { data: customers } = await custQuery;
    const recipients = (customers || []).filter((c) => Boolean((c as { email?: string }).email));

    // In demo, don't actually send; pretend success
    if (isDemo) {
      return createSuccessResponse({ sent: recipients.length, demo: true });
    }

    let sent = 0;
    for (const c of recipients) {
      const email = (c as { email?: string }).email as string;
      try {
        await sendTenantEmail({ tenantId: profile.tenant_id, to: email, subject: '', html: undefined, text: undefined, templateKey: payload.template_key, customerId: (c as { id: string }).id, idempotencyKey: `${payload.template_key}:${(c as { id: string }).id}` });
        sent += 1;
      } catch {
        // continue
      }
    }

    return createSuccessResponse({ sent });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/messaging/bulk' }, 400);
  }
}


