import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/signin', '/signup', '/forgot-password', '/demo']);

function isPublicPath(pathname: string) {
  for (const p of PUBLIC_PATHS) if (pathname.startsWith(p)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Always allow API routes; API handlers perform their own auth via tokens/cookies
  if (pathname.startsWith('/api')) return NextResponse.next();
  if (isPublicPath(pathname)) return NextResponse.next();

  const cookieToken = req.cookies.get('sb-access-token')?.value;
  const headerAuth = req.headers.get('authorization');
  const headerToken = headerAuth && headerAuth.startsWith('Bearer ') ? headerAuth.slice(7) : undefined;
  const token = cookieToken || headerToken;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }
  // Let page-level RoleGuard enforce fine-grained access; middleware only ensures presence of token.
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|_vercel|static|favicon.ico).*)'] };


