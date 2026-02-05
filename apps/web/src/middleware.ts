// apps/web/src/middleware.ts
// Temporarily disabled to debug Android deep linking issues
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
