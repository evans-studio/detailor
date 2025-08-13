import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    let q = admin.from('jobs').select('id, staff_profile_id, status, started_at, completed_at, booking_id').eq('tenant_id', profile.tenant_id);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    const { data: jobs } = await q;
    const staffIds = Array.from(new Set((jobs || []).map((j: any) => j.staff_profile_id).filter(Boolean)));
    const { data: profiles } = await admin.from('profiles').select('id, full_name, email').in('id', staffIds.length ? staffIds : ['00000000-0000-0000-0000-000000000000']);
    const idToName = new Map<string, string>((profiles || []).map((p: any) => [p.id as string, (p.full_name || p.email || 'Staff') as string]));
    const map = new Map<string, { staff_profile_id: string; name: string; jobs_completed: number; avg_duration_min: number; total_duration_min: number }>();
    for (const j of jobs || []) {
      const sid = (j as any).staff_profile_id as string | null;
      if (!sid) continue;
      const key = sid;
      if (!map.has(key)) map.set(key, { staff_profile_id: sid, name: idToName.get(sid) || 'Staff', jobs_completed: 0, avg_duration_min: 0, total_duration_min: 0 });
      if ((j as any).status === 'completed' && j.started_at && j.completed_at) {
        const mins = Math.max(0, Math.round((new Date(j.completed_at as any).getTime() - new Date(j.started_at as any).getTime()) / 60000));
        const row = map.get(key)!;
        row.jobs_completed += 1;
        row.total_duration_min += mins;
      }
    }
    for (const row of map.values()) {
      row.avg_duration_min = row.jobs_completed > 0 ? Math.round(row.total_duration_min / row.jobs_completed) : 0;
    }
    const result = Array.from(map.values()).sort((a, b) => b.jobs_completed - a.jobs_completed);
    return createSuccessResponse({ staff: result });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/analytics/staff-productivity' }, 400);
  }
}


