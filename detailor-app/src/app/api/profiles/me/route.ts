export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error || !profile) throw error ?? new Error('Profile not found');
    return NextResponse.json({ ok: true, profile });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message, hint: 'Ensure sb-access-token cookie is present and not expired' }, { status: 401 });
  }
}


