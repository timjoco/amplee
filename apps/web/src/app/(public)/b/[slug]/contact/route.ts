import { supabaseServer } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.MAIL_FROM ?? 'Amplee <noreply@amplee.app>';

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

    const supabase = await supabaseServer();

    // 1) Find band by slug (include contact_email!)
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id, name, contact_email')
      .eq('public_slug', slug)
      .single();

    if (bandError || !band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // 2) Optional: current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3) Save the contact message
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

    // 4) Best-effort email to band's Gmail
    if (band.contact_email && RESEND_API_KEY) {
      try {
        const subject = `New message about ${band.name} via Amplee`;
        const html = `
          <p>You received a new message from your Amplee page.</p>
          <p><b>From:</b> ${name} &lt;${email}&gt;</p>
          <p><b>Message:</b></p>
          <p>${message.replace(/\n/g, '<br/>')}</p>
        `;
        const text = [
          `You received a new message from your Amplee page.`,
          '',
          `From: ${name} <${email}>`,
          '',
          `Message:`,
          message,
        ].join('\n');

        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM,
            to: [band.contact_email],
            subject,
            html,
            text,
            reply_to: email, // 👈 replying in Gmail goes back to sender
          }),
        });

        if (!r.ok) {
          const text = await r.text();
          console.error('[contact email error]', text);
          // don't throw — DB insert already succeeded
        }
      } catch (e) {
        console.error('[contact email send exception]', e);
        // swallow; we don't want to break the user experience
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact route error]', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
