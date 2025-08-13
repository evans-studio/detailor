import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').slice(-2)[0];
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data: job } = await admin.from('jobs').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
    if (!job) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Job not found', { id }, 404);
    if (profile.role === 'staff' && job.staff_profile_id !== profile.id) return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Forbidden', undefined, 403);
    await admin.from('jobs').update({ status: 'in_progress' }).eq('id', id).eq('tenant_id', profile.tenant_id);
    await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: id, actor_profile_id: profile.id, event: 'started', payload: {} });
    return createSuccessResponse({});
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/jobs/[id]/start' }, 400);
  }
}


