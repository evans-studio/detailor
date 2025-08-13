export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['customer', 'staff', 'admin']),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const { email, role } = bodySchema.parse(body);
    const admin = getSupabaseAdmin();

    const { data: inviterProfile, error: pErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (pErr || !inviterProfile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Inviter has no profile', undefined, 404);
    if (inviterProfile.role !== 'admin') return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can invite', undefined, 403);

    // Check staff limit for staff/admin invites
    if (role === 'staff' || role === 'admin') {
      const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', inviterProfile.tenant_id).single();
      const staffLimit = tenant?.feature_flags?.staff_limit as number | null;
      
      if (staffLimit !== null && staffLimit > 0) {
        const { data: currentStaff } = await admin.from('profiles')
          .select('id')
          .eq('tenant_id', inviterProfile.tenant_id)
          .in('role', ['staff', 'admin']);
        
        const currentCount = currentStaff?.length || 0;
        
          if (currentCount >= staffLimit) {
            return createErrorResponse(API_ERROR_CODES.LIMIT_EXCEEDED, `Staff limit reached (${staffLimit}). Upgrade to Pro for more team members.`, { current_count: currentCount, limit: staffLimit }, 403);
          }
      }
    }

    const { data: invite, error: iErr } = await admin
      .from('tenant_invites')
      .insert({ tenant_id: inviterProfile.tenant_id, email, role, invited_by: user.id })
      .select('*')
      .single();
    if (iErr || !invite) throw iErr ?? new Error('Invite creation failed');

    return createSuccessResponse({ invite });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/invites/create' }, 400);
  }
}


