import { NextResponse } from 'next/server';

export async function GET() {
  const association = {
    applinks: {
      apps: [],
      details: [
        {
          appID: 'Y5DJD4HR5Y.com.timoconnor.amplee.dev',
          paths: ['/invite/*'],
        },
      ],
    },
  };

  return NextResponse.json(association, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
