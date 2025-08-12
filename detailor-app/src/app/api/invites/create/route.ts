export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
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
    if (pErr || !inviterProfile) throw new Error('Inviter has no profile');
    if (inviterProfile.role !== 'admin') throw new Error('Only admin can invite');

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
          throw new Error(`Staff limit reached (${staffLimit}). Upgrade to Pro for more team members.`);
        }
      }
    }

    const { data: invite, error: iErr } = await admin
      .from('tenant_invites')
      .insert({ tenant_id: inviterProfile.tenant_id, email, role, invited_by: user.id })
      .select('*')
      .single();
    if (iErr || !invite) throw iErr ?? new Error('Invite creation failed');

    return NextResponse.json({ ok: true, invite });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


