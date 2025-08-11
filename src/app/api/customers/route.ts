export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeText, sanitizeEmail, sanitizePhone, checkRateLimit } from '@/lib/security';

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
    // Staff/Admin view tenant customers; customer sees their own via RLS + filter
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (profile && ['staff', 'admin'].includes(profile.role)) {
      let query = admin.from('customers').select('*').eq('tenant_id', profile.tenant_id);
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
      const { data, error } = await query.order('created_at');
      if (error) throw error;
      return NextResponse.json({ ok: true, customers: data });
    }
    // Fallback: try self customer
    const { data, error } = await admin.from('customers').select('*').eq('auth_user_id', user.id).order('created_at');
    if (error) throw error;
    return NextResponse.json({ ok: true, customers: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`customer-create-${user.id}-${ip}`, 10, 60000)) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
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
      throw new Error('Invalid name provided');
    }
    
    if (payload.email && !sanitizedPayload.email) {
      throw new Error('Invalid email format');
    }
    
    if (payload.phone && !sanitizedPayload.phone) {
      throw new Error('Invalid phone number format');
    }
    
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    
    const { data, error } = await admin
      .from('customers')
      .insert({ tenant_id: profile.tenant_id, ...sanitizedPayload })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, customer: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


