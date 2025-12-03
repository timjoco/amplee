// app/public/b/[slug]/page.tsx
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';

import PublicBandPageClient from '@/components/Public/PublicBandPageClient';
import { supabaseServer } from '@/lib/supabaseServer';
import { isValidTheme, type ThemeName } from '@/themes/publicPageThemes';

export const revalidate = 60;

type RawStreamingLink =
  | {
      url: string;
      label?: string | null;
      type?: string | null;
    }
  | string;

export type PublicShow = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  venue?: string | null;
  city?: string | null;
  ticket_url?: string | null;
};

function normalizeLinks(raw: RawStreamingLink[] | null | undefined) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { url: item, label: 'Listen', type: 'generic' as string | null };
      }
      return {
        url: item.url,
        label: item.label ?? item.type ?? 'Listen',
        type: (item.type || 'generic') as string | null,
      };
    })
    .filter((l) => !!l.url);
}

function resolveAvatarSrc(
  band: {
    avatar_url: string | null;
    public_avatar_enabled?: boolean | null;
  } | null
) {
  if (!band?.avatar_url) return null;
  if (band.public_avatar_enabled === false) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/band-avatars/${band.avatar_url.replace(
    /^\/+/,
    ''
  )}`;
}

function formatLocation(city: string | null, state: string | null) {
  const parts = [city, state].filter(Boolean);
  return parts.join(', ');
}

export default async function PublicBandPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { theme?: string };
}) {
  const { slug } = params;
  const sp = searchParams ?? {};
  const rawTheme = (sp.theme ?? '').toString();

  const themeKey: ThemeName = isValidTheme(rawTheme) ? rawTheme : 'midnight';

  const supabase = await supabaseServer();

  // Public band profile
  const { data: band, error } = await supabase
    .from('public_band_profiles')
    .select(
      'id, public_slug, name, public_bio, city, state, avatar_url, streaming_links, public_avatar_enabled, is_premium'
    )
    .eq('public_slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[public band] error', error.message);
  }

  if (!band) {
    notFound();
  }

  // Upcoming events
  const { data: events, error: eventsError } = await supabase
    .from('public_band_events')
    .select(
      'id, band_id, title, starts_at, location, venue, city, ticket_url, is_cancelled'
    )
    .eq('band_id', band.id)
    .eq('is_cancelled', false)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5);

  if (eventsError) {
    console.error('[public band events] error', eventsError.message);
  }

  const shows: PublicShow[] = (events ?? []).map((e: any) => ({
    id: String(e.id),
    title: String(e.title ?? 'Show'),
    starts_at: e.starts_at ?? null,
    location: e.location ?? null,
    venue: e.venue ?? null,
    city: e.city ?? null,
    ticket_url: e.ticket_url ?? null,
  }));

  const location = formatLocation(band.city, band.state);
  const links = normalizeLinks(
    band.streaming_links as RawStreamingLink[] | null
  );
  const avatarSrc = resolveAvatarSrc(band);

  // ─────────────────── CONTACT FORM SERVER ACTION ───────────────────
  async function handleContactSubmit(
    formData: FormData
  ): Promise<{ success: boolean; error?: string }> {
    'use server';

    const bandId = band?.id as string;
    const senderName =
      (formData.get('name') as string | null)?.trim() || 'Anonymous';
    const senderEmail = (formData.get('email') as string | null)?.trim();
    const messageBody = (formData.get('message') as string | null)?.trim();

    if (!bandId || !senderEmail || !messageBody) {
      return { success: false, error: 'Missing required fields' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    if (messageBody.length > 5000) {
      return {
        success: false,
        error: 'Message too long (max 5000 characters)',
      };
    }

    const supabase = await supabaseServer();

    const { data: bandData, error: bandError } = await supabase
      .from('bands')
      .select('id, name, contact_email')
      .eq('id', bandId)
      .maybeSingle();

    if (bandError || !bandData) {
      console.error(
        '[public band contact] band lookup error',
        bandError?.message
      );
      return { success: false, error: 'Band not found' };
    }

    const { error: insertError } = await supabase
      .from('public_band_contact_messages')
      .insert({
        band_id: bandId,
        sender_name: senderName,
        sender_email: senderEmail,
        message: messageBody,
      });

    if (insertError) {
      console.error('[public band contact] insert error', insertError.message);
      return { success: false, error: 'Failed to send message' };
    }

    revalidatePath(`/public/b/${slug}`);

    return { success: true };
  }

  return (
    <PublicBandPageClient
      initialTheme={themeKey}
      band={{
        name: band.name,
        bio: band.public_bio,
        location,
        avatarSrc,
        isPremium: band.is_premium ?? false,
        streamingLinks: links.map((l) => ({
          url: l.url,
          type: l.type,
        })),
      }}
      shows={shows}
      onContactSubmit={handleContactSubmit}
    />
  );
}
