import { createErrorResponse, createSuccessResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function toCSV(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return '';
    const s = String(v).replaceAll('"', '""');
    return s.includes(',') || s.includes('\n') ? `"${s}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(','));
  return lines.join('\n');
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const body = await req.json();
    const { report, from, to } = body as { report: 'revenue'|'services'|'clv'|'staff'|'funnel'; from?: string; to?: string };

    let rows: Array<Record<string, unknown>> = [];
    if (report === 'revenue') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/revenue`, { headers: { cookie: (req as any).headers.get('cookie') || '' } });
      const json = await res.json();
      rows = (json.data?.daily_revenue || []).map((r: any) => ({ date: r.date, revenue: r.revenue, bookings: r.bookings }));
    } else if (report === 'services') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/service-popularity${from||to?`?${new URLSearchParams({ from: from||'', to: to||'' })}`:''}`, { headers: { cookie: (req as any).headers.get('cookie') || '' } });
      const json = await res.json();
      rows = (json.data?.services || []).map((r: any) => ({ service: r.service, revenue: r.revenue, bookings: r.bookings }));
    } else if (report === 'clv') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/clv`, { headers: { cookie: (req as any).headers.get('cookie') || '' } });
      const json = await res.json();
      rows = (json.data?.customers || []).map((r: any) => ({ customer: r.name, ltv: r.ltv }));
    } else if (report === 'staff') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/staff-productivity${from||to?`?${new URLSearchParams({ from: from||'', to: to||'' })}`:''}`, { headers: { cookie: (req as any).headers.get('cookie') || '' } });
      const json = await res.json();
      rows = (json.data?.staff || []).map((r: any) => ({ staff: r.name, jobs_completed: r.jobs_completed, avg_duration_min: r.avg_duration_min }));
    } else if (report === 'funnel') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/conversion-funnel${from||to?`?${new URLSearchParams({ from: from||'', to: to||'' })}`:''}`, { headers: { cookie: (req as any).headers.get('cookie') || '' } });
      const json = await res.json();
      const f = json.data?.funnel || {};
      rows = [{ stage: 'quotes', value: f.quotes }, { stage: 'accepted', value: f.accepted }, { stage: 'bookings', value: f.bookings }, { stage: 'completed', value: f.completed }, { stage: 'paid', value: f.paid }];
    }

    const csv = toCSV(rows);
    return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=${report}.csv` } });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/analytics/export' }, 400);
  }
}


