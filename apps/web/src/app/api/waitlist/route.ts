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

    const body = await req.json();

    const { email, name, instrument, bands, pain_point } = body ?? {};
    const normalized =
      typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const sb = supabaseAnonBare();

    const payload = {
      email: normalized,
      // these assume you created nullable columns:
      // name text, instrument text, bands text, pain_point text
      name:
        typeof name === 'string' && name.trim().length > 0 ? name.trim() : null,
      instrument:
        typeof instrument === 'string' && instrument.trim().length > 0
          ? instrument.trim()
          : null,
      bands: typeof bands === 'string' && bands.length > 0 ? bands : null,
      pain_point:
        typeof pain_point === 'string' && pain_point.trim().length > 0
          ? pain_point.trim()
          : null,
    };

    const { error } = await sb.from('waitlist_submissions').upsert(payload, {
      onConflict: 'email',
      // if you want updates when someone submits again, DON'T ignore duplicates:
      ignoreDuplicates: false,
      returning: 'minimal',
    } as any);

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
