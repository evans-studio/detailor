import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({ booking_id: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { booking_id } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile || !['admin','staff'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions', { required_roles: ['admin','staff'] }, 403);
    }
    const { data: booking } = await admin
      .from('bookings')
      .select('*, services(name), tenants(feature_flags), customers(name), vehicles(make, model), addresses(address_line1, postcode)')
      .eq('id', booking_id)
      .eq('tenant_id', profile.tenant_id)
      .single();
    if (!booking) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Booking not found', { booking_id }, 404);
    // Seed checklist from service default if available
    const svc = booking?.services as { name?: string } | null;
    const defaultChecklist: Array<{ label: string; done: boolean }> = svc?.name ? [
      { label: `Prepare for ${svc.name}`, done: false },
      { label: 'Protect interior surfaces', done: false },
      { label: 'Pre-rinse exterior', done: false },
      { label: 'Dry and inspect', done: false },
    ] : [];

    const { data, error } = await admin
      .from('jobs')
      .insert({ tenant_id: profile.tenant_id, booking_id: booking_id, staff_profile_id: null, status: 'not_started', checklist: defaultChecklist })
      .select('*')
      .single();
    if (error) throw error;
    await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: data.id, actor_profile_id: profile.id, event: 'created', payload: {} });
    return createSuccessResponse({ job: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/jobs/create-from-booking' }, 400);
  }
}


