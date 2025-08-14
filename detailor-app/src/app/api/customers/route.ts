export const runtime = 'nodejs';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeText, sanitizeEmail, sanitizePhone, checkRateLimit } from '@/lib/security';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const status = url.searchParams.get('status') || undefined; // 'active' | 'inactive'
    const createdFrom = url.searchParams.get('from') || undefined;
    const createdTo = url.searchParams.get('to') || undefined;
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '25')));
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;
    // Staff/Admin view tenant customers; customer sees their own via RLS + filter
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (profile && ['staff', 'admin'].includes(profile.role)) {
      let query = admin.from('customers').select('*', { count: 'exact' }).eq('tenant_id', profile.tenant_id);
      if (q) {
        query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      }
      if (status === 'inactive') {
        query = query.eq('flags->>inactive', 'true');
      }
      if (status === 'active') {
        query = query.or(`flags->>inactive.is.null,flags->>inactive.eq.false`);
      }
      if (createdFrom) query = query.gte('created_at', createdFrom);
      if (createdTo) query = query.lte('created_at', createdTo);
      const { data, error, count } = await query.order('created_at').range(fromIdx, toIdx);
      if (error) {
        return createErrorResponse(
          API_ERROR_CODES.DATABASE_ERROR,
          'Failed to fetch customers',
          { db_error: error.message },
          500
        );
      }
      return createSuccessResponse(data, { pagination: { page, pageSize, total: count ?? (data?.length || 0) } });
    }
    // Fallback: try self customer
    const { data, error } = await admin.from('customers').select('*').eq('auth_user_id', user.id).order('created_at').range(fromIdx, toIdx);
    if (error) {
      return createErrorResponse(
        API_ERROR_CODES.DATABASE_ERROR,
        'Failed to fetch customer data',
        { db_error: error.message },
        500
      );
    }
    return createSuccessResponse(data, { pagination: { page, pageSize, total: (data?.length || 0) } });
  } catch (error: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      (error as Error).message,
      { endpoint: 'GET /api/customers' },
      400
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`customer-create-${user.id}-${ip}`, 10, 60000)) {
      return createErrorResponse(
        API_ERROR_CODES.RATE_LIMITED,
        'Rate limit exceeded',
        { limit: 10, window: '60s' },
        429
      );
    }
    
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    
    // Sanitize inputs
    const sanitizedPayload = {
      name: sanitizeText(payload.name),
      email: payload.email ? sanitizeEmail(payload.email) : undefined,
      phone: payload.phone ? sanitizePhone(payload.phone) : undefined,
    };
    
    // Validate sanitized inputs
    if (!sanitizedPayload.name) {
      return createErrorResponse(
        API_ERROR_CODES.INVALID_INPUT,
        'Invalid name provided',
        { field: 'name' },
        400
      );
    }
    
    if (payload.email && !sanitizedPayload.email) {
      return createErrorResponse(
        API_ERROR_CODES.INVALID_INPUT,
        'Invalid email format',
        { field: 'email' },
        400
      );
    }
    
    if (payload.phone && !sanitizedPayload.phone) {
      return createErrorResponse(
        API_ERROR_CODES.INVALID_INPUT,
        'Invalid phone number format',
        { field: 'phone' },
        400
      );
    }
    
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) {
      return createErrorResponse(
        API_ERROR_CODES.FORBIDDEN,
        'Insufficient permissions to create customers',
        { required_roles: ['staff', 'admin'] },
        403
      );
    }
    
    const { data, error } = await admin
      .from('customers')
      .insert({ tenant_id: profile.tenant_id, ...sanitizedPayload })
      .select('*')
      .single();
      
    if (error) {
      // Handle duplicate email constraint
      if (error.code === '23505') {
        return createErrorResponse(
          API_ERROR_CODES.DUPLICATE_ENTRY,
          'A customer with this email already exists',
          { field: 'email' },
          409
        );
      }
      
      return createErrorResponse(
        API_ERROR_CODES.DATABASE_ERROR,
        'Failed to create customer',
        { db_error: error.message },
        500
      );
    }
    
    return createSuccessResponse(data);
  } catch (error: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      (error as Error).message,
      { endpoint: 'POST /api/customers' },
      400
    );
  }
}


