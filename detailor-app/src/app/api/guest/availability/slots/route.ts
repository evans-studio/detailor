export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { shouldRateLimit } from '@/lib/rate-limit';

// Guest availability slots endpoint
export async function GET(req: Request) {
  try {
    const rl = shouldRateLimit(req, 'guest:slots', 120, 60_000);
    if (rl.limited) {
      return createErrorResponse(API_ERROR_CODES.RATE_LIMITED, 'Too many requests', { retry_at: rl.resetAt }, 429);
    }
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    
    // Get tenant_id from URL param or header
    const tenantId = url.searchParams.get('tenant_id') || req.headers.get('x-tenant-id');
    const days = parseInt(url.searchParams.get('days') || '14', 10);
    
    if (!tenantId) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'tenant_id required in URL parameter or x-tenant-id header', { field: 'tenant_id' }, 400);
    }

    // Verify the tenant exists and is active
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, status')
      .eq('id', tenantId)
      .single();
    
    if (!tenant || tenant.status !== 'active') {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Invalid or inactive tenant', { tenant_id: tenantId }, 404);
    }

    // Real availability calculation using work patterns, blackouts, and bookings
    const { data: patterns } = await admin
      .from('work_patterns')
      .select('*')
      .eq('tenant_id', tenantId);

    const now = new Date();
    const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeStart.getUTCDate() + Math.max(1, Math.min(days, 60)));

    const { data: blackouts } = await admin
      .from('blackouts')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('starts_at', rangeEnd.toISOString())
      .gte('ends_at', rangeStart.toISOString());

    const blackoutRanges = (blackouts || []).map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }));

    const { data: bookings } = await admin
      .from('bookings')
      .select('start_at,end_at,status')
      .eq('tenant_id', tenantId)
      .lt('start_at', rangeEnd.toISOString())
      .gt('end_at', rangeStart.toISOString());
    const blockingStatuses = ['pending', 'confirmed', 'in_progress'];

    const slots: Array<{ start: string; end: string; capacity: number }> = [];
    function combine(dateUtc: Date, hhmm: string) {
      const [hh, mm] = hhmm.split(':').map((v) => parseInt(v, 10));
      const d = new Date(dateUtc);
      d.setUTCHours(hh, mm, 0, 0);
      return d;
    }
    for (let i = 0; i < Math.max(1, Math.min(days, 60)); i++) {
      const day = new Date(rangeStart);
      day.setUTCDate(rangeStart.getUTCDate() + i);
      const weekday = day.getUTCDay();
      const pattern = (patterns || []).find((p: any) => p.weekday === weekday);
      if (!pattern || pattern.capacity <= 0) continue;
      let cursor = combine(day, pattern.start_time);
      const dayEnd = combine(day, pattern.end_time);
      const incrementMs = pattern.slot_duration_min * 60 * 1000;
      while (cursor < dayEnd) {
        const slotEnd = new Date(cursor.getTime() + incrementMs);
        const overlapsBlackout = blackoutRanges.some((r) => slotEnd > r.start && cursor < r.end);
        if (!overlapsBlackout) {
          const overlappingCount = (bookings || []).filter((bk: any) =>
            blockingStatuses.includes(String(bk.status)) && (new Date(bk.end_at) > cursor) && (new Date(bk.start_at) < slotEnd)
          ).length;
          const remainingCapacity = Math.max(0, pattern.capacity - overlappingCount);
          if (remainingCapacity > 0) {
            slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString(), capacity: remainingCapacity });
          }
        }
        cursor = slotEnd;
      }
    }

    return createSuccessResponse({ slots });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'GET /api/guest/availability/slots' }, 400);
  }
}