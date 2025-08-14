import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/security';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const schema = z.object({ access_token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`session-set-${ip}`, 30, 60000)) {
      return createErrorResponse(API_ERROR_CODES.RATE_LIMITED, 'Too many session attempts', { window: '1m', limit: 30 }, 429);
    }
    const body = await req.json();
    const { access_token } = schema.parse(body);
    const res = NextResponse.json({ success: true, meta: { timestamp: new Date().toISOString() } });
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').trim();
    const cookieDomain = process.env.NODE_ENV === 'production' && rootDomain
      ? (rootDomain.startsWith('.') ? rootDomain : `.${rootDomain}`)
      : undefined;
    const secure = process.env.NODE_ENV === 'production';
    res.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      domain: cookieDomain,
      maxAge: 60 * 60 * 8,
    });

    // Hint middleware with role and tenant for routing decisions (non-authoritative)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      if (url && anon) {
        const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data: userData } = await client.auth.getUser(access_token);
        const authUserId = userData?.user?.id;
        if (authUserId) {
          const admin = getSupabaseAdmin();
          const { data: profile } = await admin
            .from('profiles')
            .select('role, tenant_id')
            .eq('id', authUserId)
            .single();
          const role = (profile?.role as string) || '';
          const tenantId = (profile?.tenant_id as string) || '';
          if (role) {
            res.cookies.set('df-role', role, {
              httpOnly: true,
              secure,
              sameSite: 'lax',
              path: '/',
              domain: cookieDomain,
              maxAge: 60 * 60 * 8,
            });
          }
          if (tenantId) {
            res.cookies.set('df-tenant', tenantId, {
              httpOnly: true,
              secure,
              sameSite: 'lax',
              path: '/',
              domain: cookieDomain,
              maxAge: 60 * 60 * 8,
            });
          }
        }
      }
    } catch {}
    return res;
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, (e as Error).message, { endpoint: 'POST /api/session/set' }, 400);
  }
}


