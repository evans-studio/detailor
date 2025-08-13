export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
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
      throw new Error('Forbidden');
    }

    try {
      const { data, error } = await admin
        .from('work_patterns')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('weekday');
      
      if (error) {
        console.warn('Work patterns table error, using defaults:', error);
        return NextResponse.json({
          ok: true,
          patterns: generateDefaultPatterns(profile.tenant_id),
          warning: 'Using default work patterns - database table not available'
        });
      }

      // If no patterns exist, return defaults
      if (!data || data.length === 0) {
        return NextResponse.json({
          ok: true,
          patterns: generateDefaultPatterns(profile.tenant_id),
          info: 'No work patterns configured - showing defaults'
        });
      }

      return NextResponse.json({ ok: true, patterns: data });

    } catch (dbError) {
      console.warn('Database error getting work patterns:', dbError);
      return NextResponse.json({
        ok: true,
        patterns: generateDefaultPatterns(profile.tenant_id),
        warning: 'Using default work patterns due to database error'
      });
    }

  } catch (error: unknown) {
    console.error('Work patterns API error:', error);
    return NextResponse.json({
      ok: false,
      error: (error as Error).message
    }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const payload = upsertSchema.parse(body);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Admin only');
    const { data, error } = await admin
      .from('work_patterns')
      .upsert({ tenant_id: profile.tenant_id, ...payload }, { onConflict: 'tenant_id,weekday' })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, pattern: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


