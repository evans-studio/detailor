import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const client = getSupabaseClient();
    return NextResponse.json({ ok: true, clientCreated: Boolean(client) });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}


