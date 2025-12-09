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

    console.log('[contact] incoming', { slug, name, email });

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Please fill in all fields' },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id, name, contact_email')
      .eq('public_slug', slug)
      .single();

    console.log('[contact] loaded band', {
      bandId: band?.id,
      name: band?.name,
      contact_email: band?.contact_email,
    });

    if (bandError || !band) {
      console.error('[contact] bandError', bandError);
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    console.log('[contact] message saved; attempting email', {
      hasContactEmail: !!band.contact_email,
      hasResendKey: !!RESEND_API_KEY,
      from: FROM,
    });

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
            reply_to: email,
          }),
        });

        const bodyText = await r.text();
        console.log('[contact] resend response', r.status, bodyText);

        if (!r.ok) {
          console.error('[contact email error]', bodyText);
        }
      } catch (e) {
        console.error('[contact email send exception]', e);
      }
    } else {
      console.warn(
        '[contact] skipping email – missing contact_email or RESEND_API_KEY',
        {
          contact_email: band.contact_email,
          hasResendKey: !!RESEND_API_KEY,
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact route error]', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
