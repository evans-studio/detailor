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
    let q = admin.from('quotes').select('id, status, created_at').eq('tenant_id', profile.tenant_id);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    const { data: quotes } = await q;
    // stages: quote.draft/sent -> accepted -> booking.pending/confirmed -> booking.completed -> paid
    const stages = { quotes: 0, accepted: 0, bookings: 0, completed: 0, paid: 0 };
    stages.quotes = quotes?.length || 0;
    const { data: accepted } = await admin.from('quotes').select('id').eq('tenant_id', profile.tenant_id).eq('status', 'accepted');
    stages.accepted = accepted?.length || 0;
    const { data: bookings } = await admin.from('bookings').select('id, status, payment_status').eq('tenant_id', profile.tenant_id);
    stages.bookings = bookings?.length || 0;
    stages.completed = (bookings || []).filter((b: any) => b.status === 'completed').length;
    stages.paid = (bookings || []).filter((b: any) => b.payment_status === 'paid').length;
    return createSuccessResponse({ funnel: stages });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/analytics/conversion-funnel' }, 400);
  }
}


