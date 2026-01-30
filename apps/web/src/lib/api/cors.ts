import { NextRequest, NextResponse } from 'next/server';

// Your API host
const PROD_ORIGIN = 'https://amplee.app';

function isAllowedOrigin(origin: string) {
  if (!origin) return false;

  // Prod site
  if (origin === PROD_ORIGIN) return true;

  // Capacitor (iOS)
  if (origin === 'capacitor://localhost') return true;

  // Android WebView
  if (origin === 'https://localhost') return true;

  // Local dev (localhost)
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;

  // Local dev over LAN
  if (/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin))
    return true;

  return false;
}

export function getCorsOrigin(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  return isAllowedOrigin(origin) ? origin : PROD_ORIGIN;
}

export function createCorsResponse(
  req: NextRequest,
  body: unknown,
  options: { status: number }
) {
  const allowedOrigin = getCorsOrigin(req);

  return NextResponse.json(body, {
    status: options.status,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

export function createCorsOptions(req: NextRequest) {
  const allowedOrigin = getCorsOrigin(req);

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}
