import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  status: z.enum(['not_started','in_progress','completed','paid']).optional(),
  notes: z.string().optional(),
  checklist: z.array(z.unknown()).optional(),
  materials: z.array(z.object({ name: z.string(), quantity: z.number().nonnegative().default(1), unit_cost: z.number().nonnegative().default(0) })).optional(),
  signature_data_url: z.string().optional(),
  assign_to_me: z.boolean().optional(),
  qc_passed: z.boolean().optional(),
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
    // Optional self-assignment for staff
    if (payload.assign_to_me && profile.role === 'staff') {
      updates.staff_profile_id = profile.id;
    }
    // QC flag stored on job if desired
    if (payload.qc_passed !== undefined) updates.qc_passed = payload.qc_passed;
    const needUpdate = Object.keys(updates).length > 0;
    let updatedJob = job;
    if (needUpdate) {
      const { data, error } = await admin.from('jobs').update(updates).eq('id', id).eq('tenant_id', profile.tenant_id).select('*').single();
      if (error) throw error;
      updatedJob = data as typeof job;
      await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: id, actor_profile_id: profile.id, event: 'updated', payload: updates });
    }
    // Log materials as activity (no schema change)
    if (payload.materials && payload.materials.length > 0) {
      await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: id, actor_profile_id: profile.id, event: 'materials_logged', payload: { materials: payload.materials } });
    }
    // Log signature capture as activity (data URL reference)
    if (payload.signature_data_url) {
      await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: id, actor_profile_id: profile.id, event: 'signature_captured', payload: { data_url: payload.signature_data_url } });
    }
    return createSuccessResponse({ job: updatedJob });
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


