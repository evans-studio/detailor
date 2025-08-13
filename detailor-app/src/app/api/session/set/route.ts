import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';

const schema = z.object({ access_token: z.string().min(10) });

export async function POST(req: Request) {
  try {
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
    return res;
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, (e as Error).message, { endpoint: 'POST /api/session/set' }, 400);
  }
}


