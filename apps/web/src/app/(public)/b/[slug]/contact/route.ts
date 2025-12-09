import { supabaseServer } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Please fill in all fields' },
        { status: 400 }
      );
    }

    // Server-side Supabase client
    const supabase = await supabaseServer();

    // 1) Find band by slug
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id, name, contact_email')
      .eq('public_slug', slug)
      .single();

    if (bandError || !band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // 2) Get user if logged in (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3) Insert contact message
    const { error: insertError } = await supabase
      .from('band_contact_messages')
      .insert({
        band_id: band.id,
        name,
        email,
        message,
        user_id: user?.id ?? null,
        source: 'public_page',
      });

    if (insertError) {
      console.error('[contact insert error]', insertError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact route error]', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
