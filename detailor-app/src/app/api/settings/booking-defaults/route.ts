import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  slot_minutes: z.number().int().positive(),
  capacity: z.number().int().positive().default(2),
  weekdays: z.array(z.number().int().min(0).max(6)).default([1,2,3,4,5]),
});

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { start, end, slot_minutes, capacity, weekdays } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can update work patterns', undefined, 403);
    }
    // Replace patterns for the given weekdays
    await admin.from('work_patterns').delete().eq('tenant_id', profile.tenant_id).in('weekday', weekdays);
    const inserts = weekdays.map((d) => ({ tenant_id: profile.tenant_id, weekday: d, start_time: start, end_time: end, slot_duration_min: slot_minutes, capacity }));
    const { error } = await admin.from('work_patterns').insert(inserts);
    if (error) throw error;
    return createSuccessResponse({});
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/settings/booking-defaults' }, 400);
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data } = await admin.from('work_patterns').select('*').eq('tenant_id', profile.tenant_id).order('weekday');
    return createSuccessResponse({ patterns: data || [] });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/settings/booking-defaults' }, 400);
  }
}


