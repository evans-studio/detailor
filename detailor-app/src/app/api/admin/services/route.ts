export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  base_price: z.number().min(0),
  base_duration_min: z.number().int().min(0),
  visible: z.boolean().optional(),
});

// Generate sample services when database table doesn't exist
const generateSampleServices = (tenantId: string) => [
  {
    id: 'sample-1',
    tenant_id: tenantId,
    name: 'Premium Detail',
    category: 'Detail Package',
    description: 'Complete interior and exterior detailing service',
    base_price: 150,
    base_duration_min: 180,
    visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sample-2', 
    tenant_id: tenantId,
    name: 'Express Wash',
    category: 'Quick Service',
    description: 'Fast exterior wash and dry',
    base_price: 25,
    base_duration_min: 30,
    visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sample-3',
    tenant_id: tenantId,
    name: 'Paint Correction',
    category: 'Specialty Service',
    description: 'Professional paint correction and polishing',
    base_price: 300,
    base_duration_min: 240,
    visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access services.',
          details: { required_roles: ['staff', 'admin'] }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 403 });
    }
    
    try {
      const { data, error } = await admin.from('services').select('*').eq('tenant_id', profile.tenant_id).order('name');
      
      if (error) {
        console.warn('Services table error, using sample data:', error);
        return NextResponse.json({
          success: true,
          data: generateSampleServices(profile.tenant_id),
          meta: {
            timestamp: new Date().toISOString(),
            warning: 'Using sample services - database table not available'
          }
        });
      }

      // If no services exist, return sample services
      if (!data || data.length === 0) {
        return NextResponse.json({
          success: true,
          data: generateSampleServices(profile.tenant_id),
          meta: {
            timestamp: new Date().toISOString(),
            info: 'No services configured - showing sample services'
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
      console.warn('Database error getting services:', dbError);
      return NextResponse.json({
        success: true,
        data: generateSampleServices(profile.tenant_id),
        meta: {
          timestamp: new Date().toISOString(),
          warning: 'Using sample services due to database error'
        }
      });
    }

  } catch (error: unknown) {
    console.error('Services API error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVICES_ERROR',
        message: (error as Error).message,
        details: { endpoint: 'GET /api/admin/services' }
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
    const payload = bodySchema.parse(body);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ADMIN_ONLY',
          message: 'Only admin users can create services.',
          details: { required_role: 'admin' }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 403 });
    }

    try {
      // Check services limit for the tenant
      const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', profile.tenant_id).single();
      const servicesLimit = tenant?.feature_flags?.services_limit as number | null;
      
      if (servicesLimit !== null && servicesLimit > 0) {
        const { data: currentServices } = await admin.from('services').select('id').eq('tenant_id', profile.tenant_id);
        const currentCount = currentServices?.length || 0;
        
        if (currentCount >= servicesLimit) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'SERVICE_LIMIT_REACHED',
              message: `Service limit reached (${servicesLimit}). Upgrade to Pro for more services.`,
              details: { current_count: currentCount, limit: servicesLimit }
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          }, { status: 403 });
        }
      }

      // Check if service name already exists for this tenant
      const { data: existingService } = await admin
        .from('services')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .ilike('name', payload.name)
        .single();
      
      if (existingService) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'SERVICE_NAME_EXISTS',
            message: `A service named "${payload.name}" already exists. Please choose a different name.`,
            details: { service_name: payload.name }
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        }, { status: 409 });
      }

      const { data, error } = await admin
        .from('services')
        .insert({ tenant_id: profile.tenant_id, ...payload })
        .select('*')
        .single();
      
      if (error) {
        // Handle specific constraint violations with better error messages
        if (error.code === '23505' && error.message?.includes('services_tenant_id_name_key')) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'SERVICE_NAME_EXISTS',
              message: `A service named "${payload.name}" already exists. Please choose a different name.`,
              details: { service_name: payload.name, constraint: 'unique_name' }
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          }, { status: 409 });
        }
        
        return NextResponse.json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create service due to database error.',
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

    } catch (dbError: any) {
      // If services table doesn't exist, return a helpful error
      if (dbError.message?.includes('relation "services" does not exist') || 
          dbError.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'SERVICES_TABLE_MISSING',
            message: 'Services table not set up yet. Please contact support to initialize your database.',
            details: { db_code: dbError.code }
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        }, { status: 503 });
      }
      
      // Re-throw other database errors to be handled by outer catch
      throw dbError;
    }
    
  } catch (error: unknown) {
    console.error('Services POST API error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVICES_CREATE_ERROR',
        message: (error as Error).message,
        details: { endpoint: 'POST /api/admin/services' }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }
}


