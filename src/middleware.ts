import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/signin', '/signup', '/forgot-password', '/demo']);

function isPublicPath(pathname: string) {
  for (const p of PUBLIC_PATHS) if (pathname.startsWith(p)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
  // Role-based simple guard via path hints
  if (pathname.startsWith('/customer') && req.headers.get('x-role') === 'admin') {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|_vercel|static|favicon.ico).*)'] };


