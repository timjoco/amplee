// apps/web/src/middleware.ts
import { createClient } from '@/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === WAITLIST REDIRECT (remove this block after launch) ===
  const isAllowedPath =
    pathname === '/waitlist' ||
    pathname.startsWith('/b/') || // Public band pages
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/logo') ||
    pathname.match(/\.(ico|png|jpg|svg|css|js|woff|woff2)$/);

  // Optional: bypass with secret param for testing (e.g., ?preview=secret123)
  const bypassKey = request.nextUrl.searchParams.get('preview');
  const hasBypass = bypassKey === 'your-secret-key'; // Change this!

  if (!isAllowedPath && !hasBypass) {
    return NextResponse.redirect(new URL('/waitlist', request.url));
  }
  // === END WAITLIST REDIRECT ===

  // Supabase auth handling
  return createClient(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
