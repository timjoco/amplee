// apps/web/src/middleware.ts
import { createClient } from '@/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const ALLOW_PUBLIC = [
  '/download',
  '/privacy',
  '/terms',
  '/support',
  '/robots.txt',
  '/sitemap.xml',
  '/community-guidelines',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next internals & common static assets
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|css|js|map|txt|xml|webp|woff|woff2)$/
    );

  if (isStatic) return NextResponse.next();

  // Allow legal/support/download
  if (
    ALLOW_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.next();
  }

  // Optional: keep public band pages if you want them still visible
  // if (pathname.startsWith('/b/')) return NextResponse.next();

  // Bypass for you/testers (ex: ?preview=secret123)
  const bypassKey = request.nextUrl.searchParams.get('preview');
  const hasBypass = bypassKey === process.env.NEXT_PUBLIC_PREVIEW_KEY; // set in env

  if (hasBypass) {
    // You can optionally strip the preview param so it doesn't leak
    const url = request.nextUrl.clone();
    url.searchParams.delete('preview');
    // Attach Supabase middleware for authenticated flows
    const res = await createClient(request);
    // Redirect to cleaned URL (only if it changed)
    if (url.toString() !== request.nextUrl.toString()) {
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Redirect everything else to /download
  const url = request.nextUrl.clone();
  url.pathname = '/download';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
