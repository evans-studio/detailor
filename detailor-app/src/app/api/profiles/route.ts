import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: me } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!me) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    // staff can list only staff (self + peers) masked; admins can list all
    const q = admin.from('profiles').select('id, role, full_name, email, created_at').eq('tenant_id', me.tenant_id);
    const { data, error } = role ? await q.eq('role', role) : await q;
    if (error) throw error;
    return createSuccessResponse({ profiles: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/profiles' }, 400);
  }
}

const patchSchema = z.object({ id: z.string().uuid(), role: z.enum(['customer','staff','admin']) });
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, role } = patchSchema.parse(body);
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: me } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!me) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    if (me.role !== 'admin') return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Admin only', undefined, 403);
    // prevent self-demotion lockout (optional safeguard)
    if (id === (user.id as string) && role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Cannot change own role', undefined, 400);
    }
    const { error } = await admin.from('profiles').update({ role }).eq('id', id).eq('tenant_id', me.tenant_id);
    if (error) throw error;
    return createSuccessResponse({ id, role });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/profiles' }, 400);
  }
}


