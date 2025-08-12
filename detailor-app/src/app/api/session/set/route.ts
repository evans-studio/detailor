import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ access_token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { access_token } = schema.parse(body);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


