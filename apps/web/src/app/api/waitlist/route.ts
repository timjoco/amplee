/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function supabaseAnonBare() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ctype = req.headers.get('content-type') || '';
    if (!ctype.includes('application/json')) {
      return NextResponse.json(
        { error: 'Expected application/json' },
        { status: 400 }
      );
    }

    const { email } = await req.json();
    const normalized =
      typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const sb = supabaseAnonBare();

    const { error } = await sb.from('waitlist_submissions').upsert(
      { email: normalized },
      {
        onConflict: 'email',
        ignoreDuplicates: true,
        returning: 'minimal',
      } as any //
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Server error' },
      { status: 500 }
    );
  }
}
