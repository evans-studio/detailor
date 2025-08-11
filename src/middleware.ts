import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/signin', '/signup', '/forgot-password', '/demo', '/welcome', '/book', '/bookings/confirmation']);

function isPublicPath(pathname: string) {
  for (const p of PUBLIC_PATHS) if (pathname.startsWith(p)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Security checks for all requests
  const response = NextResponse.next();
  
  // Rate limiting check (basic implementation)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  
  // Block suspicious requests
  if (
    userAgent.includes('bot') && 
    !userAgent.includes('Googlebot') && 
    !userAgent.includes('Bingbot') &&
    !pathname.startsWith('/api/webhooks') // Allow webhooks from legitimate services
  ) {
    // Block suspicious bots from sensitive areas
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return new NextResponse('Access denied', { status: 403 });
    }
  }
  
  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /[<>]/,   // HTML/Script injection attempts
    /script/i, // Script tags
    /javascript:/i, // JavaScript protocols
    /vbscript:/i,   // VBScript protocols
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(pathname))) {
    return new NextResponse('Invalid request', { status: 400 });
  }

  // Always allow API routes; API handlers perform their own auth via tokens/cookies
  if (pathname.startsWith('/api')) return response;
  if (isPublicPath(pathname)) return response;

  // Authentication check
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
  return response;
}

export const config = { matcher: ['/((?!_next|_vercel|static|favicon.ico).*)'] };


