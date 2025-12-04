import { Box, Chip, Typography } from '@mui/material';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { ContactFormSection } from '@/components/Public/ContactFormSection';
import { StreamingLinksSection } from '@/components/Public/StreamingLinksSection';
import { ThemePickerPublicBand } from '@/components/Public/ThemePickerPublicBand';
import { UpcomingShowsSection } from '@/components/Public/UpcomingShowsSection';
import { supabaseServer } from '@/lib/supabaseServer';
import { THEMES, isDarkTheme, type ThemeName } from '@/themes/publicPageThemes';
import type { BandMediaItem } from '@/types/db'; // adjust path if needed

export const revalidate = 60;

type StreamingLink =
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
  notes?: string | null;
  ticket_url?: string | null;
};

function normalizeLinks(raw: StreamingLink[] | null | undefined) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { url: item, label: 'Listen', type: 'generic' };
      }
      return {
        url: item.url,
        label: item.label ?? item.type ?? 'Listen',
        type: (item.type || 'generic') as string,
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

function getInitials(name: string | null | undefined) {
  const base = (name || '').trim();
  if (!base) return 'B';
  return base
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Validate theme key
function isValidTheme(key: string): key is ThemeName {
  return key in THEMES;
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

  // Validate theme - default to 'default' (Neon)
  const themeKey: ThemeName = isValidTheme(rawTheme) ? rawTheme : 'default';
  const theme = THEMES[themeKey];
  const dark = isDarkTheme(themeKey);

  // ─────────────────── SERVER ACTION: CONTACT FORM ───────────────────
  async function handleContactSubmit(
    formData: FormData
  ): Promise<{ success: boolean; error?: string }> {
    'use server';

    const bandId = formData.get('bandId') as string | null;
    const senderName =
      (formData.get('name') as string | null)?.trim() || 'Anonymous';
    const senderEmail = (formData.get('email') as string | null)?.trim();
    const messageBody = (formData.get('message') as string | null)?.trim();

    if (!bandId || !senderEmail || !messageBody) {
      return { success: false, error: 'Missing required fields' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    // Message length validation
    if (messageBody.length > 5000) {
      return {
        success: false,
        error: 'Message too long (max 5000 characters)',
      };
    }

    const supabase = await supabaseServer();

    // Get the band's contact email
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

    // Store the contact message in the database
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

    // TODO: Send email notification to band's contact_email

    revalidatePath(`/b/${slug}`);

    return { success: true };
  }

  // ─────────────────── FETCH BAND DATA ───────────────────
  const supabase = await supabaseServer();

  const { data: band, error } = await supabase
    .from('public_band_profiles')
    .select(
      'id, public_slug, name, public_bio, city, state, avatar_url, streaming_links, public_avatar_enabled'
    )
    .eq('public_slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[public band] error', error.message);
  }

  if (!band) {
    notFound();
  }

  // Fetch upcoming events
  const { data: events, error: eventsError } = await supabase
    .from('public_band_events')
    .select(
      'id, band_id, title, starts_at, location, public_notes, ticket_url, is_cancelled'
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
    notes: e.public_notes ?? null,
    ticket_url: e.ticket_url ?? null,
  }));

  // Process data
  const location = formatLocation(band.city, band.state);
  const links = normalizeLinks(band.streaming_links as StreamingLink[] | null);
  const avatarSrc = resolveAvatarSrc(band);
  const initials = getInitials(band.name);

  const mediaItems: BandMediaItem[] = [
    {
      id: 'live-show-1',
      type: 'video',
      title: 'Live at The Roxy',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', // or any image you like
      href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tag: 'Live',
    },
    {
      id: 'promo-photo-1',
      type: 'photo',
      title: 'Band Promo Shot',
      thumbnailUrl:
        'https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg', // placeholder
      href: undefined,
      tag: 'Photo',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: theme.background,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Noise texture overlay */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          opacity: 0.02,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 720,
          margin: '0 auto',
          padding: { xs: '24px 20px', md: '32px 24px' },
        }}
      >
        {/* Theme Picker */}
        <ThemePickerPublicBand
          currentTheme={themeKey}
          theme={theme}
          bandSlug={slug}
          isPremiumBand={true}
        />

        {/* Hero Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            mb: 4,
            mt: 2,
          }}
        >
          {/* Avatar */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                padding: '4px',
                background: theme.avatarGlow,
                boxShadow: dark
                  ? '0 0 40px rgba(0,0,0,0.5)'
                  : '0 0 30px rgba(0,0,0,0.15)',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: theme.showBg,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={band.name}
                    fill
                    sizes="120px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontSize: 36,
                      fontWeight: 900,
                      background: theme.textGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {initials}
                  </Typography>
                )}
              </Box>
            </Box>
            {/* Online indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#22c55e',
                border: '3px solid',
                borderColor: theme.showBg,
                boxShadow: '0 0 10px rgba(34,197,94,0.5)',
              }}
            />
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1 }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 28, md: 32 },
                fontWeight: 900,
                color: theme.mainTextColor,
                mb: 1,
                letterSpacing: -0.5,
              }}
            >
              {band.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 15,
                color: theme.secondaryTextColor,
                lineHeight: 1.6,
              }}
            >
              {band.public_bio || 'Welcome to our page!'}
            </Typography>
            {location && (
              <Chip
                label={location}
                size="small"
                sx={{
                  mt: 1.5,
                  background: theme.followButtonBg,
                  color: theme.followButtonTextColor,
                  border: `1px solid ${theme.borderColor}`,
                  fontWeight: 600,
                  fontSize: 12,
                }}
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill={theme.followButtonTextColor}
                    width="14"
                    height="14"
                    style={{ marginLeft: 8 }}
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                }
              />
            )}
          </Box>
        </Box>

        {/* Upcoming Shows */}
        {shows.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <UpcomingShowsSection shows={shows} theme={theme} dark={dark} />
          </Box>
        )}

        {/* Streaming Links */}
        {links.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <StreamingLinksSection links={links} theme={theme} dark={dark} />
          </Box>
        )}

        {/* Media Strip */}
        {/* <Box sx={{ mb: 2.5 }}>
          <BandMediaStrip items={mediaItems} theme={theme} />
        </Box> */}

        {/* Contact Form */}
        <Box sx={{ mb: 2.5 }}>
          <ContactFormSection
            theme={theme}
            dark={dark}
            bandId={band.id}
            bandName={band.name}
            onSubmit={handleContactSubmit}
          />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            pt: 3,
            borderTop: `1px solid ${theme.borderColor}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              color: theme.secondaryTextColor,
            }}
          >
            Powered by{' '}
            <Box
              component="a"
              href="https://amplee.app"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
              }}
            >
              Amplee
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
