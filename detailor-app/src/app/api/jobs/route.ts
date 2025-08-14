import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    let tenantId: string | undefined;
    let staffProfileId: string | undefined;
    let role: string | undefined;
    try {
      const { user } = await getUserFromRequest(req);
      const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
      if (profile) {
        tenantId = profile.tenant_id as string | undefined;
        role = profile.role as string | undefined;
        staffProfileId = profile.id as string | undefined;
      }
    } catch {}
    if (!tenantId) {
      const url = new URL(req.url);
      const headerTenant = req.headers.get('x-tenant-id') || url.searchParams.get('tenant_id') || '';
      let cookieTenant = '';
      const cookie = req.headers.get('cookie') || '';
      const match = cookie.split('; ').find((c) => c.startsWith('df-tenant='));
      if (match) cookieTenant = decodeURIComponent(match.split('=')[1] || '');
      tenantId = (headerTenant || cookieTenant) || undefined;
    }
    if (!tenantId) return createErrorResponse(API_ERROR_CODES.UNAUTHORIZED, 'Unauthorized', { hint: 'Missing tenant context' }, 401);
    const url = new URL(req.url);
    const day = url.searchParams.get('day');
    const status = url.searchParams.get('status');
    let query = admin
      .from('jobs')
      .select('*, bookings(*), customers:bookings_customer_id_fkey(*), vehicles:bookings_vehicle_id_fkey(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (day) query = query.gte('created_at', `${day} 00:00:00+00`).lte('created_at', `${day} 23:59:59+00`);
    if (role === 'staff' && staffProfileId) query = query.eq('staff_profile_id', staffProfileId);
    const { data, error } = await query;
    if (error) throw error;
    return createSuccessResponse({ jobs: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/jobs' }, 400);
  }
}


