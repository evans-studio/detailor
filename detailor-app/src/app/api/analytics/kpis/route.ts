export const runtime = 'nodejs';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    let tenantId: string | undefined;
    try {
      const { user } = await getUserFromRequest(req);
      const { data: profile } = await admin
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      tenantId = profile?.tenant_id as string | undefined;
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

    if (!tenantId) {
      return createErrorResponse(API_ERROR_CODES.UNAUTHORIZED, 'Unauthorized', { hint: 'Missing tenant context' }, 401);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Bookings today (count)
    const { count: bookingsTodayCount } = await admin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('start_at', today.toISOString())
      .lt('start_at', tomorrow.toISOString());

    // Revenue month-to-date (sum of succeeded payments)
    const { data: mtdPayments } = await admin
      .from('payments')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'succeeded')
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', nextMonthStart.toISOString());
    const revenueMtd = (mtdPayments || []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

    // Total customers (count)
    const { count: totalCustomersCount } = await admin
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Active jobs (in_progress)
    const { count: activeJobsCount } = await admin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'in_progress');

    return createSuccessResponse({
      bookings_today: bookingsTodayCount || 0,
      revenue_mtd: revenueMtd,
      total_customers: totalCustomersCount || 0,
      active_jobs: activeJobsCount || 0,
    });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'GET /api/analytics/kpis' }, 500);
  }
}


