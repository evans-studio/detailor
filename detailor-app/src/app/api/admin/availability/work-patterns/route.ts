export const runtime = 'nodejs';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const upsertSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  slot_duration_min: z.number().int().min(1),
  capacity: z.number().int().min(0),
});

// Default work patterns when database table doesn't exist or is empty
const generateDefaultPatterns = (tenantId: string) => [
  { id: 'default-1', tenant_id: tenantId, weekday: 1, start_time: '09:00', end_time: '17:00', slot_duration_min: 60, capacity: 5 },
  { id: 'default-2', tenant_id: tenantId, weekday: 2, start_time: '09:00', end_time: '17:00', slot_duration_min: 60, capacity: 5 },
  { id: 'default-3', tenant_id: tenantId, weekday: 3, start_time: '09:00', end_time: '17:00', slot_duration_min: 60, capacity: 5 },
  { id: 'default-4', tenant_id: tenantId, weekday: 4, start_time: '09:00', end_time: '17:00', slot_duration_min: 60, capacity: 5 },
  { id: 'default-5', tenant_id: tenantId, weekday: 5, start_time: '09:00', end_time: '17:00', slot_duration_min: 60, capacity: 5 },
];

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    
    const { data: profile } = await admin
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();
    
    if (!profile || !['staff', 'admin'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions to access work patterns.', { required_roles: ['staff','admin'] }, 403);
    }

    try {
      const { data, error } = await admin
        .from('work_patterns')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('weekday');
      
      if (error) {
        return createSuccessResponse(generateDefaultPatterns(profile.tenant_id));
      }

      // If no patterns exist, return defaults
      if (!data || data.length === 0) {
        return createSuccessResponse(generateDefaultPatterns(profile.tenant_id));
      }

      return createSuccessResponse(data);

    } catch (dbError) {
      return createSuccessResponse(generateDefaultPatterns(profile.tenant_id));
    }

  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'GET /api/admin/availability/work-patterns' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const payload = upsertSchema.parse(body);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin users can create work patterns.', { required_role: 'admin' }, 403);
    }
    
    const { data, error } = await admin
      .from('work_patterns')
      .upsert({ tenant_id: profile.tenant_id, ...payload }, { onConflict: 'tenant_id,weekday' })
      .select('*')
      .single();
      
    if (error) {
      return createErrorResponse(API_ERROR_CODES.DATABASE_ERROR, 'Failed to create/update work pattern.', { db_error: error.message }, 500);
    }
    
    return createSuccessResponse(data);
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/admin/availability/work-patterns' }, 400);
  }
}


