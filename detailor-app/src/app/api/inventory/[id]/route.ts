import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const patchSchema = z.object({ name: z.string().optional(), sku: z.string().optional(), unit: z.string().optional(), stock: z.number().nonnegative().optional(), reorder_level: z.number().nonnegative().optional() });

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    if (profile.role !== 'admin') return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Admin only', undefined, 403);
    const patch = patchSchema.parse(await req.json());
    const { data, error } = await admin.from('inventory_items').update(patch).eq('id', id).eq('tenant_id', profile.tenant_id).select('*').single();
    if (error) throw error;
    return createSuccessResponse({ item: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/inventory/[id]' }, 400);
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    if (profile.role !== 'admin') return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Admin only', undefined, 403);
    await admin.from('inventory_items').delete().eq('id', id).eq('tenant_id', profile.tenant_id);
    return createSuccessResponse({ deleted: true });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'DELETE /api/inventory/[id]' }, 400);
  }
}


