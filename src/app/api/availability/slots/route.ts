export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function* iterateDays(start: Date, days: number): Generator<Date> {
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  for (let i = 0; i < days; i += 1) {
    const next = new Date(d);
    next.setUTCDate(d.getUTCDate() + i);
    yield next;
  }
}

function combineDateAndTime(dateUtc: Date, timeHHMM: string): Date {
  const [hh, mm] = timeHHMM.split(':').map((v) => parseInt(v, 10));
  const combined = new Date(dateUtc);
  combined.setUTCHours(hh, mm, 0, 0);
  return combined;
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');

    const url = new URL(req.url);
    const daysParam = parseInt(url.searchParams.get('days') || '30', 10);
    const days = Math.max(1, Math.min(daysParam, 60));

    const { data: patterns, error: pErr } = await admin
      .from('work_patterns')
      .select('*')
      .eq('tenant_id', profile.tenant_id);
    if (pErr) throw pErr;

    const now = new Date();
    const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeStart.getUTCDate() + days);

    const { data: blackouts, error: bErr } = await admin
      .from('blackouts')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .lte('starts_at', rangeEnd.toISOString())
      .gte('ends_at', rangeStart.toISOString());
    if (bErr) throw bErr;

    const blackoutRanges = (blackouts || []).map((b) => ({
      start: new Date(b.starts_at),
      end: new Date(b.ends_at),
    }));

    const slots: Array<{ start: string; end: string; capacity: number }> = [];

    for (const day of iterateDays(rangeStart, days)) {
      const weekday = day.getUTCDay();
      const pattern = patterns?.find((p) => p.weekday === weekday);
      if (!pattern || pattern.capacity <= 0) continue;

      let cursor = combineDateAndTime(day, pattern.start_time);
      const dayEnd = combineDateAndTime(day, pattern.end_time);
      const incrementMs = pattern.slot_duration_min * 60 * 1000;

      while (cursor < dayEnd) {
        const slotEnd = new Date(cursor.getTime() + incrementMs);
        const overlapsBlackout = blackoutRanges.some((r) => slotEnd > r.start && cursor < r.end);
        if (!overlapsBlackout) {
          slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString(), capacity: pattern.capacity });
        }
        cursor = slotEnd;
      }
    }

    return NextResponse.json({ ok: true, slots });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


