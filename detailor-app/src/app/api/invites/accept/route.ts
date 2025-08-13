export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
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
    if (iErr || !invite) return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid or consumed invite', undefined, 400);

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

    return createSuccessResponse({ tenant_id: invite.tenant_id, role: invite.role });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/invites/accept' }, 400);
  }
}


