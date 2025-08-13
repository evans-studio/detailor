import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['admin','staff'].includes(profile.role)) return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Forbidden', { required_roles: ['admin','staff'] }, 403);
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || 50);
    const { data, error } = await admin
      .from('messages')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(Math.min(200, limit));
    if (error) throw error;
    return createSuccessResponse({ messages: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/messages' }, 400);
  }
}


