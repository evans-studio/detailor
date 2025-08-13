import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data, error } = await admin.from('inventory_items').select('*').eq('tenant_id', profile.tenant_id).order('name');
    if (error) throw error;
    return createSuccessResponse({ items: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/inventory' }, 400);
  }
}

const bodySchema = z.object({ name: z.string(), sku: z.string().optional(), unit: z.string().default('unit'), stock: z.number().nonnegative().default(0), reorder_level: z.number().nonnegative().default(0) });
export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    if (profile.role !== 'admin') return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Admin only', undefined, 403);
    const body = bodySchema.parse(await req.json());
    const { data, error } = await admin.from('inventory_items').insert({ ...body, tenant_id: profile.tenant_id }).select('*').single();
    if (error) throw error;
    return createSuccessResponse({ item: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/inventory' }, 400);
  }
}


