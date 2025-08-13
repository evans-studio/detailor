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
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access work patterns.',
          details: { required_roles: ['staff', 'admin'] }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 403 });
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
          success: true,
          data: generateDefaultPatterns(profile.tenant_id),
          meta: {
            timestamp: new Date().toISOString(),
            warning: 'Using default work patterns - database table not available'
          }
        });
      }

      // If no patterns exist, return defaults
      if (!data || data.length === 0) {
        return NextResponse.json({
          success: true,
          data: generateDefaultPatterns(profile.tenant_id),
          meta: {
            timestamp: new Date().toISOString(),
            info: 'No work patterns configured - showing defaults'
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: data,
        meta: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (dbError) {
      console.warn('Database error getting work patterns:', dbError);
      return NextResponse.json({
        success: true,
        data: generateDefaultPatterns(profile.tenant_id),
        meta: {
          timestamp: new Date().toISOString(),
          warning: 'Using default work patterns due to database error'
        }
      });
    }

  } catch (error: unknown) {
    console.error('Work patterns API error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'WORK_PATTERNS_ERROR',
        message: (error as Error).message,
        details: { endpoint: 'GET /api/admin/availability/work-patterns' }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
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
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ADMIN_ONLY',
          message: 'Only admin users can create work patterns.',
          details: { required_role: 'admin' }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 403 });
    }
    
    const { data, error } = await admin
      .from('work_patterns')
      .upsert({ tenant_id: profile.tenant_id, ...payload }, { onConflict: 'tenant_id,weekday' })
      .select('*')
      .single();
      
    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create/update work pattern.',
          details: { db_error: error.message }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'WORK_PATTERN_CREATE_ERROR',
        message: (error as Error).message,
        details: { endpoint: 'POST /api/admin/availability/work-patterns' }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }
}


