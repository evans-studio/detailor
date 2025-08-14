import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set([
  '/signin',
  '/signup',
  '/forgot-password',
  '/welcome',
  '/book',
  '/bookings/confirmation',
]);

function isPublicPath(pathname: string) {
  for (const p of PUBLIC_PATHS) if (pathname.startsWith(p)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'detailor.co.uk';
  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://detailor.co.uk';
  const baseDomain = rootDomain.replace(/^.*?\./, '');
  const isRootHost = host === rootDomain || host === baseDomain;
  const isAdminHost = host.startsWith('admin.');
  const isWildcardSub = !isAdminHost && !isRootHost && host.endsWith(baseDomain);
  const subdomainMatch = isWildcardSub ? host.split('.')[0] : undefined;
  const roleHint = req.cookies.get('df-role')?.value || '';

  // Security headers baseline
  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Lightweight CSP aligned with next.config.ts (this path-level header helps for dynamic routes)
  res.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com blob:",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://*.sentry.io",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '));

  // Subdomain routing for customer microsites
  if (isWildcardSub) {
    const blockedSubdomains = new Set(['app', 'www', 'mail', 'ftp']);
    if (subdomainMatch && blockedSubdomains.has(subdomainMatch)) {
      const target = `https://admin.${baseDomain}`;
      return NextResponse.redirect(target);
    }
    if (pathname === '/' || pathname === '') {
      const url = req.nextUrl.clone();
      url.pathname = '/site';
      url.searchParams.set('subdomain', subdomainMatch || '');
      return NextResponse.rewrite(url);
    }
  }

  // Marketing host: redirect root to marketing site
  if (isRootHost && (pathname === '/' || pathname === '')) {
    return NextResponse.redirect(marketingUrl);
  }

  // Normalize legacy/admin roots
  if (pathname === '/dashboard') {
    const url = req.nextUrl.clone();
    url.pathname = roleHint === 'customer' ? '/customer/dashboard' : '/admin/dashboard';
    return NextResponse.redirect(url);
  }
  if (pathname === '/admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }
  if (pathname === '/customer') {
    const url = req.nextUrl.clone();
    url.pathname = '/customer/dashboard';
    return NextResponse.redirect(url);
  }

  // Always allow API and public paths
  if (pathname.startsWith('/api') || isPublicPath(pathname)) return res;

  // Auth check via cookie/header
  const cookieToken = req.cookies.get('sb-access-token')?.value;
  const headerAuth = req.headers.get('authorization');
  const headerToken = headerAuth && headerAuth.startsWith('Bearer ') ? headerAuth.slice(7) : undefined;
  const token = cookieToken || headerToken;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // Token present: if user hits root on admin host, route by role hint
  if (pathname === '/' && isAdminHost) {
    const url = req.nextUrl.clone();
    url.pathname = roleHint === 'customer' ? '/customer/dashboard' : '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = { matcher: ['/((?!_next|_vercel|static|favicon.ico).*)'] };


