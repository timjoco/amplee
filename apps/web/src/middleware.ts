// apps/web/src/middleware.ts
import { createClient } from '@/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const ALLOW_PUBLIC = [
  '/',
  '/download',
  '/privacy',
  '/terms',
  '/help',
  '/robots.txt',
  '/sitemap.xml',
  '/community-guidelines',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Always bypass API routes (preflight + API calls must not redirect)
  if (pathname.startsWith('/api')) return NextResponse.next();

  // Allow Next internals & common static assets
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|css|js|map|txt|xml|webp|woff|woff2)$/
    );

  if (isStatic) return NextResponse.next();

  // ✅ Allow public band pages
  // This covers: /b/teem-and-tiger-6ynr
  if (pathname === '/b' || pathname.startsWith('/b/')) {
    return NextResponse.next();
  }

  // Allow legal/support/download
  if (
    ALLOW_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.next();
  }

  // Bypass for you/testers (ex: ?preview=secret123)
  const bypassKey = request.nextUrl.searchParams.get('preview');
  const hasBypass = bypassKey === process.env.NEXT_PUBLIC_PREVIEW_KEY;

  if (hasBypass) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('preview');

    const res = await createClient(request);

    if (url.toString() !== request.nextUrl.toString()) {
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Redirect protected routes (like /bands/*) to home
  // These are internal app routes not meant for public web access
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // ✅ Exclude /api from middleware entirely
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
