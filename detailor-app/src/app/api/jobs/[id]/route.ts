import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  status: z.enum(['not_started','in_progress','completed','paid']).optional(),
  notes: z.string().optional(),
  checklist: z.array(z.unknown()).optional(),
});

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const body = await req.json();
    const payload = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data: job } = await admin.from('jobs').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
    if (!job) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Job not found', { id }, 404);
    if (profile.role === 'staff' && job.staff_profile_id !== profile.id) return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Forbidden', undefined, 403);
    const updates: Record<string, unknown> = {};
    if (payload.status) updates.status = payload.status;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    if (payload.checklist !== undefined) updates.checklist = payload.checklist as unknown[];
    if (Object.keys(updates).length === 0) return createSuccessResponse({ job });
    const { data, error } = await admin.from('jobs').update(updates).eq('id', id).eq('tenant_id', profile.tenant_id).select('*').single();
    if (error) throw error;
    await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: id, actor_profile_id: profile.id, event: 'updated', payload: updates });
    return createSuccessResponse({ job: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/jobs/[id]' }, 400);
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data, error } = await admin.from('jobs').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
    if (error) throw error;
    if (profile.role === 'staff' && data?.staff_profile_id !== profile.id) return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Forbidden', undefined, 403);
    return createSuccessResponse({ job: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/jobs/[id]' }, 400);
  }
}


