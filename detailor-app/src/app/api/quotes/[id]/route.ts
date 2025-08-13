export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const updateSchema = z.object({ status: z.enum(['draft','issued','accepted','expired','revoked']) });

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { status } = updateSchema.parse(body);
    const { pathname } = new URL(req.url);
    const quoteId = pathname.split('/').pop() as string;

    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);

    // Staff/Admin can set any status per RLS; customer can only accept their own issued quote
    const { data, error } = await admin
      .from('quotes')
      .update({ status })
      .eq('id', quoteId)
      .select('*')
      .single();
    if (error) throw error;
    return createSuccessResponse({ quote: data });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'PATCH /api/quotes/[id]' }, 400);
  }
}


