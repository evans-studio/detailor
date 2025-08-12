export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Disabled in production' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { email, password } = bodySchema.parse(body);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw error ?? new Error('Sign-in failed');
    return NextResponse.json({ ok: true, access_token: data.session.access_token });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


