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
  '/invite',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) return NextResponse.next();

  // Allow .well-known for Android App Links verification (assetlinks.json)
  if (pathname.startsWith('/.well-known')) return NextResponse.next();

  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|css|js|json|map|txt|xml|webp|woff|woff2|mp4|webm|mov|mp3|wav|ogg|pdf|gif)$/,
    );

  if (isStatic) return NextResponse.next();

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
