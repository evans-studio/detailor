import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] || null;
}

function getCookieToken(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || req.headers.get('Cookie');
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === 'sb-access-token') {
      return rest.join('=');
    }
  }
  return null;
}

export function getUserScopedClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anon) throw new Error('Missing Supabase env for user client');
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function getUserFromRequest(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anon) throw new Error('Missing Supabase env');
  const token = getBearerToken(req) || getCookieToken(req);
  if (!token) throw new Error('Missing Authorization token');
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) throw new Error('Invalid or expired token');
  return { token, user: data.user };
}


