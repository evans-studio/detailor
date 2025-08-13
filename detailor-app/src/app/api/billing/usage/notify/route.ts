export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';

export async function POST() {
  try {
    const admin = getSupabaseAdmin();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const period = monthStart.toISOString().slice(0, 10);
    // Fetch usage + limits for all tenants with tracking
    const { data: rows } = await admin
      .from('usage_tracking')
      .select('tenant_id, period_month, bookings_used')
      .eq('period_month', period);

    const results: Array<{ tenant_id: string; notified80?: boolean; overage?: boolean }> = [];

    for (const r of rows || []) {
      const tenantId = r.tenant_id as string;
      const used = Number(r.bookings_used || 0);
      const { data: t } = await admin.from('tenants').select('contact_email, feature_flags').eq('id', tenantId).single();
      const ff = (t?.feature_flags as Record<string, unknown>) || {};
      const limit = ff.bookings_limit as number | null;
      const buffer = 5;
      if (limit === null || limit <= 0) continue;
      const warnThreshold = Math.floor(limit * 0.8);
      const isWarn = used >= warnThreshold && used < limit + buffer;
      const isOver = used >= limit + buffer;
      if (isWarn || isOver) {
        // Find admin emails
        const { data: admins } = await admin
          .from('profiles')
          .select('email')
          .eq('tenant_id', tenantId)
          .eq('role', 'admin');
        const recipients = (admins || []).map((a) => a.email).filter(Boolean);
        const to = recipients.length ? recipients[0] : (t?.contact_email as string | undefined);
        if (to) {
          await sendTenantEmail({
            tenantId,
            to,
            subject: isOver ? 'Overage charges active' : 'Usage nearing plan limit',
            text: isOver
              ? `You have exceeded your monthly booking allowance (incl. 5 overages). Overage fees apply this period.`
              : `You have used ${used}/${limit} bookings this month. You can exceed by 5 before overage fees apply.`,
          });
        }
        results.push({ tenant_id: tenantId, notified80: isWarn || undefined, overage: isOver || undefined });
      }
    }
    return createSuccessResponse({ results });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/billing/usage/notify' }, 400);
  }
}


