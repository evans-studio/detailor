import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define route patterns and their required roles
const PROTECTED_ROUTES = {
  '/dashboard': ['admin', 'staff'],
  '/admin': ['admin'],
  '/onboarding': ['admin'], 
  '/staff': ['staff'],
  '/customer': ['customer'],
  '/bookings': ['admin', 'staff', 'customer'],
  '/payments': ['admin', 'staff', 'customer'],
} as const;

const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/site',
  '/book',
] as const;

const API_ROUTES = [
  '/api/guest',
  '/api/health',
  '/api/webhooks',
  '/api/placeholder',
] as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, images, and favicon
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|otf)$/)
  ) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public pages
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check if route needs protection
  const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  // Check authentication
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration in middleware');
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session from request headers
    const authHeader = request.headers.get('authorization') || request.cookies.get('sb-access-token')?.value;
    
    if (!authHeader) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // For API routes that need authentication, validate the session
    if (pathname.startsWith('/api/')) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      
      const { data: user, error } = await supabase.auth.getUser(token);
      
      if (error || !user.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.user.id);
      requestHeaders.set('x-user-email', user.user.email || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Middleware auth error:', error);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};