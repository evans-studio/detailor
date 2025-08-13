export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price_delta: z.number().min(0).optional(),
  duration_delta_min: z.number().int().min(0).optional(),
  compatibility: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const payload = updateSchema.parse(body);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Admin only', undefined, 403);
    }
    const { data, error } = await admin
      .from('add_ons')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select('*')
      .single();
    if (error) throw error;
    return createSuccessResponse({ addon: data });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'PATCH /api/admin/addons/[id]' }, 400);
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Admin only', undefined, 403);
    }
    const { error } = await admin
      .from('add_ons')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id);
    if (error) throw error;
    return createSuccessResponse({});
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'DELETE /api/admin/addons/[id]' }, 400);
  }
}


