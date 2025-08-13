export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Disabled in production', undefined, 403);
  }
  try {
    const body = await req.json();
    const { email, password } = bodySchema.parse(body);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw error ?? new Error('Sign-in failed');
    return createSuccessResponse({ access_token: data.session.access_token });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/dev/sign-in' }, 400);
  }
}


