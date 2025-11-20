import { ThemePickerPublicBand } from '@/components/Public/ThemePickerPublicBand';
import { supabaseServer } from '@/lib/supabaseServer';
import AppleIcon from '@mui/icons-material/Apple';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import LinkIcon from '@mui/icons-material/Link';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';

import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import {
  type BandPageTheme,
  THEMES,
  type ThemeName,
  isDarkTheme,
} from '@/themes/publicPageThemes';

export const revalidate = 60;

type StreamingLink =
  | {
      url: string;
      label?: string | null;
      type?: string | null;
    }
  | string;

type PublicShow = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
};

type PublicComment = {
  id: string;
  display_name: string | null;
  body: string;
  created_at: string;
};

function initialsFromName(name: string | null | undefined) {
  const base = (name || '').trim();
  if (!base) return 'G';
  return base
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay >= 1) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffHour >= 1) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffMin >= 1) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  return 'Just now';
}

function normalizeLinks(raw: StreamingLink[] | null | undefined) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return {
          url: item,
          label: 'Listen',
          type: 'generic',
        };
      }
      return {
        url: item.url,
        label: item.label ?? item.type ?? 'Listen',
        type: (item.type || 'generic') as string,
      };
    })
    .filter((l) => !!l.url);
}

const LINK_TYPE_PRIORITY = ['spotify', 'apple', 'instagram', 'generic'];

const primaryButtonStyles = (theme: BandPageTheme) => ({
  borderRadius: 999,
  textTransform: 'none' as const,
  px: 3,
  py: 1.1,
  fontWeight: 700,
  fontSize: 14,
  backgroundColor: theme.followButtonBg,
  color: theme.followButtonTextColor,
  border: `1px solid ${theme.secondaryTextColor}`,
  boxShadow: 'none',
  transition: 'background-color 0.15s ease, transform 0.1s ease',
  '&:hover': {
    backgroundColor: theme.followButtonBorder,
    transform: 'translateY(-1px)',
  },
});

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

function formatShowDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  return { month, day };
}

function formatLocation(city: string | null, state: string | null) {
  const parts = [city, state].filter(Boolean);
  return parts.join(', ');
}

function pickIconForType(type?: string | null) {
  const key = (type || '').toLowerCase();

  if (key === 'spotify') return <MusicNoteIcon fontSize="large" />;
  if (key === 'apple' || key === 'applemusic')
    return <AppleIcon fontSize="large" />;
  if (key === 'bandcamp') return <LibraryMusicIcon fontSize="large" />;
  if (key === 'soundcloud') return <LibraryMusicIcon fontSize="large" />;
  if (key === 'youtube' || key === 'youtube_music')
    return <YouTubeIcon fontSize="large" />;

  if (key === 'instagram') return <InstagramIcon fontSize="large" />;
  if (key === 'facebook') return <FacebookIcon fontSize="large" />;
  if (key === 'twitter' || key === 'x') return <TwitterIcon fontSize="large" />;
  if (key === 'tiktok') return <AudiotrackIcon fontSize="large" />;

  if (key === 'linktree' || key === 'website' || key === 'site') {
    return <LinkIcon fontSize="large" />;
  }

  return <LinkIcon fontSize="large" />;
}

export default async function PublicBandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ theme?: string }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const rawTheme = (sp.theme ?? '').toString();

  const allThemeKeys = Object.keys(THEMES) as ThemeName[];

  const themeKey: ThemeName = allThemeKeys.includes(rawTheme as ThemeName)
    ? (rawTheme as ThemeName)
    : 'default';

  const activeTheme = THEMES[themeKey];

  async function addComment(formData: FormData) {
    'use server';

    const bandId = formData.get('bandId') as string | null;
    const nameRaw = formData.get('name') as string | null;
    const bodyRaw = formData.get('body') as string | null;

    const display_name = nameRaw?.trim() || null;
    let body = bodyRaw?.trim() || null;

    if (!bandId || !body) return;

    const blockedWords = ['slur1', 'slur2', 'swear1', 'swear2'];
    const lower = body.toLowerCase();
    if (blockedWords.some((w) => w && lower.includes(w))) {
      console.warn('[public band comments] blocked comment due to moderation');
      return;
    }

    if (body.length > 1000) {
      body = body.slice(0, 1000);
    }

    const supabase = await supabaseServer();

    const { error } = await supabase.from('public_band_comments').insert({
      band_id: bandId,
      display_name,
      body,
    });

    if (error) {
      console.error('[public band comments insert] error', error.message);
    }

    revalidatePath(`/public/b/${slug}`);
  }

  async function subscribeNewsletter(formData: FormData) {
    'use server';

    const bandId = formData.get('bandId') as string | null;
    const emailRaw = formData.get('email') as string | null;
    const email = emailRaw?.trim().toLowerCase() || null;

    if (!bandId || !email) return;

    const supabase = await supabaseServer();

    const { error } = await supabase
      .from('public_band_newsletter_signups')
      .insert({
        band_id: bandId,
        email,
      });

    if (error) {
      console.error('[public band newsletter signup] error', error.message);
    }

    revalidatePath(`/public/b/${slug}`);
  }

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

  const { data: commentRows, error: commentsError } = await supabase
    .from('public_band_comments')
    .select('id, display_name, body, created_at')
    .eq('band_id', band.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (commentsError) {
    console.error('[public band comments] error', commentsError.message);
  }

  const comments: PublicComment[] = (commentRows ?? []) as PublicComment[];

  const { data: events, error: eventsError } = await supabase
    .from('public_band_events')
    .select(
      'id, band_id, title, starts_at, location, public_notes, ticket_url, is_cancelled'
    )
    .eq('band_id', band.id)
    .order('starts_at', { ascending: true });

  if (eventsError) {
    console.error('[public band events] error', eventsError.message);
  }

  const shows: PublicShow[] = (events ?? []).map((e: any) => ({
    id: String(e.id),
    title: String(e.title ?? 'Show'),
    starts_at: e.starts_at ?? null,
    location: e.location ?? null,
  }));

  const location = formatLocation(band.city, band.state);
  const links = normalizeLinks(band.streaming_links as StreamingLink[] | null);
  const avatarSrc = resolveAvatarSrc(band);

  const primaryLinkTypesInOrder = LINK_TYPE_PRIORITY.filter((t) =>
    links.some((l) => (l.type || '').toLowerCase() === t)
  );

  const orderedLinks =
    primaryLinkTypesInOrder.length === 0
      ? links
      : primaryLinkTypesInOrder
          .map((t) => links.filter((l) => (l.type || '').toLowerCase() === t))
          .flat()
          .concat(
            links.filter(
              (l) =>
                !primaryLinkTypesInOrder.includes((l.type || '').toLowerCase())
            )
          );

  const FOLLOW_TYPES = [
    'instagram',
    'facebook',
    'tiktok',
    'twitter',
    'x',
    'threads',
    'bluesky',
    'linktree',
  ];

  const followLinks = orderedLinks.filter((l) =>
    FOLLOW_TYPES.includes((l.type || '').toLowerCase())
  );

  const listenLinks = orderedLinks.filter(
    (l) => !FOLLOW_TYPES.includes((l.type || '').toLowerCase())
  );

  const topListenLinks = listenLinks;
  const topFollowLinks = followLinks;

  const dark = isDarkTheme(themeKey);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0a0f',
      }}
    >
      {/* Background */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: activeTheme.background,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200%',
            height: '200%',
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 100px,
                rgba(139, 92, 246, 0.03) 100px,
                rgba(139, 92, 246, 0.03) 102px
              )
            `,
            '@keyframes slideDown': {
              '0%': { transform: 'translateX(-50%) translateY(0)' },
              '100%': { transform: 'translateX(-50%) translateY(100px)' },
            },
            animation: 'slideDown 20s linear infinite',
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 70%)',
            filter: 'blur(60px)',
            '@keyframes float': {
              '0%, 100%': { transform: 'translate(0, 0)' },
              '50%': { transform: 'translate(30px, -30px)' },
            },
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(236, 72, 153, 0.15), transparent 70%)',
            filter: 'blur(80px)',
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />
      </Box>

      {/* Main content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 3, md: 4 }, // slightly tighter so top controls are higher
          px: { xs: 2.5, md: 4 },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 680,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            alignItems: 'center',
          }}
        >
          {/* THEME PICKER – centered at top */}
          <Box
            sx={{
              width: '100%',
              maxWidth: 420,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <ThemePickerPublicBand themeKey={themeKey} />
          </Box>

          {/* HERO */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 3,
              alignItems: 'center',
              p: { xs: 1, md: 2 },
              width: '100%',
            }}
          >
            {/* Avatar with clean ring */}
            <Box
              sx={{
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  padding: '3px',
                  background: activeTheme.avatarGlow,
                  boxShadow: '0 0 28px rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: activeTheme.fieldColor || 'rgba(15,23,42,0.98)',
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
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 36,
                        background: activeTheme.textGradient,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {(band.name || '')
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((p: string) => p[0] || '')
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Name + Bio */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: 28, md: 36 },
                  fontWeight: 900,
                  color: activeTheme.mainTextColor,
                  mb: 1,
                  textShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
                }}
              >
                {band.name}
              </Typography>

              <Typography
                sx={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: activeTheme.secondaryTextColor,
                  fontWeight: 400,
                }}
              >
                {band.public_bio ||
                  "An alternative rock band you can't miss. New album out now!"}
              </Typography>

              {location && (
                <Chip
                  label={location}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: 'rgba(139, 92, 246, 0.15)',
                    color: activeTheme.secondaryTextColor,
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                />
              )}
            </Box>
          </Box>

          {/* UPCOMING SHOWS */}
          {shows.length > 0 && (
            <>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 30 },
                  fontWeight: 900,
                  letterSpacing: 0.08,
                  color: activeTheme.mainTextColor,
                  mb: 1,
                  mt: 3,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                Upcoming Shows
              </Typography>

              <Stack spacing={2.25} sx={{ width: '100%' }}>
                {shows.slice(0, 5).map((show) => {
                  const dateParts = formatShowDate(show.starts_at);

                  return (
                    <Box
                      key={show.id}
                      sx={{
                        borderRadius: 2.5,
                        p: 2.5,
                        background: activeTheme.showBg,
                        border: `1px solid ${activeTheme.borderColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          background:
                            themeKey === 'chocolate'
                              ? 'rgba(33, 20, 16, 0.98)'
                              : dark
                              ? 'rgba(15, 23, 42, 0.96)'
                              : 'rgba(255, 255, 255, 0.96)',
                          borderColor:
                            activeTheme.followButtonBorder ||
                            activeTheme.borderColor,
                          transform: 'translateX(4px)',
                          boxShadow:
                            themeKey === 'chocolate'
                              ? '0 8px 20px rgba(15, 10, 8, 0.8)'
                              : dark
                              ? `-4px 0 0 ${activeTheme.followButtonBorder}`
                              : '0 6px 18px rgba(15,23,42,0.15)',
                        },
                      }}
                    >
                      {/* Date badge */}
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${activeTheme.followButtonBorder}, ${activeTheme.borderColor})`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow:
                            themeKey === 'white' || themeKey === 'banana'
                              ? '0 0 14px rgba(0,0,0,0.25)'
                              : '0 0 20px rgba(0,0,0,0.5)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(45deg, transparent, rgba(255,255,255,0.12), transparent)',
                            '@keyframes shine': {
                              '0%': { transform: 'translateX(-100%)' },
                              '100%': { transform: 'translateX(100%)' },
                            },
                            animation: 'shine 3s ease-in-out infinite',
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            color: 'rgba(255,255,255,0.9)',
                          }}
                        >
                          {dateParts?.month || 'TBA'}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 28,
                            fontWeight: 900,
                            lineHeight: 1,
                            color: '#fff',
                          }}
                        >
                          {dateParts?.day ?? '?'}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: activeTheme.mainTextColor,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {show.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 14,
                            color: activeTheme.secondaryTextColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          📍 {(show.location || '').trim() || 'Venue TBA'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </>
          )}

          {/* LISTEN */}
          {topListenLinks.length > 0 && (
            <>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 30 },
                  fontWeight: 900,
                  letterSpacing: 0.08,
                  color: activeTheme.mainTextColor,
                  mb: 1,
                  mt: 4,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                Listen
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 4,
                  background: 'transparent',
                  borderRadius: 2,
                  width: '100%',
                }}
              >
                {topListenLinks.map((link, idx) => (
                  <IconButton
                    key={`${link.url}-${idx}`}
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: activeTheme.followButtonBg,
                      border: `2px solid ${activeTheme.followButtonBorder}`,
                      color: activeTheme.followButtonTextColor,
                      boxShadow:
                        themeKey === 'white' || themeKey === 'banana'
                          ? '0 4px 10px rgba(0,0,0,0.18)'
                          : '0 0 18px rgba(0,0,0,0.45), 0 10px 26px rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background:
                          'conic-gradient(from 140deg, rgba(255,255,255,0.35), transparent 45%, rgba(255,255,255,0.6), transparent 80%, rgba(255,255,255,0.35))',
                        opacity: 0,
                        transition: 'opacity 0.25s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.05)',
                        borderColor: activeTheme.followButtonBorder,
                        boxShadow:
                          themeKey === 'white' || themeKey === 'banana'
                            ? '0 6px 14px rgba(0,0,0,0.28)'
                            : '0 0 26px rgba(0,0,0,0.75), 0 16px 32px rgba(0,0,0,0.9)',
                        '&::before': {
                          opacity: 0.7,
                        },
                      },
                      '& svg': {
                        position: 'relative',
                        zIndex: 1,
                        fontSize: 34,
                      },
                    }}
                  >
                    {pickIconForType(link.type)}
                  </IconButton>
                ))}
              </Stack>
            </>
          )}

          {/* FOLLOW */}
          {topFollowLinks.length > 0 && (
            <>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 30 },
                  fontWeight: 900,
                  letterSpacing: 0.08,
                  color: activeTheme.mainTextColor,
                  mb: 1,
                  mt: 2,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                Follow
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 4,
                  background: 'transparent',
                  borderRadius: 2,
                  width: '100%',
                }}
              >
                {topFollowLinks.map((link, idx) => (
                  <IconButton
                    key={`${link.url}-${idx}`}
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: activeTheme.followButtonBg,
                      border: `2px solid ${activeTheme.followButtonBorder}`,
                      color: activeTheme.followButtonTextColor,
                      boxShadow:
                        themeKey === 'white' || themeKey === 'banana'
                          ? '0 4px 10px rgba(0,0,0,0.18)'
                          : '0 0 18px rgba(0,0,0,0.45), 0 10px 26px rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background:
                          'conic-gradient(from 140deg, rgba(255,255,255,0.35), transparent 45%, rgba(255,255,255,0.6), transparent 80%, rgba(255,255,255,0.35))',
                        opacity: 0,
                        transition: 'opacity 0.25s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.05)',
                        borderColor: activeTheme.followButtonBorder,
                        boxShadow:
                          themeKey === 'white' || themeKey === 'banana'
                            ? '0 6px 14px rgba(0,0,0,0.28)'
                            : '0 0 26px rgba(0,0,0,0.75), 0 16px 32px rgba(0,0,0,0.9)',
                        '&::before': {
                          opacity: 0.7,
                        },
                      },
                      '& svg': {
                        position: 'relative',
                        zIndex: 1,
                        fontSize: 34,
                      },
                    }}
                  >
                    {pickIconForType(link.type)}
                  </IconButton>
                ))}
              </Stack>
            </>
          )}

          {/* NEWSLETTER */}
          <>
            <Typography
              sx={{
                fontSize: { xs: 26, md: 30 },
                fontWeight: 900,
                letterSpacing: 0.08,
                color: activeTheme.mainTextColor,
                mb: 1,
                mt: 4,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
              }}
            >
              Newsletter
            </Typography>

            <Paper
              elevation={10}
              sx={{
                borderRadius: 2.5,
                p: 2.5,
                background: activeTheme.showBg,
                border: `1px solid ${activeTheme.borderColor}`,
                backdropFilter: 'blur(18px)',
                transition: 'all 0.2s ease',
                width: '100%',
              }}
            >
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: activeTheme.mainTextColor,
                  mb: 0.5,
                }}
              >
                Join the mailing list
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: activeTheme.secondaryTextColor,
                  mb: 2,
                }}
              >
                Get show announcements, new music drops, and behind-the-scenes
                updates straight from the band.
              </Typography>

              <form action={subscribeNewsletter}>
                <input type="hidden" name="bandId" value={band.id} />
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                  <TextField
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    variant="standard"
                    sx={{ flex: 1 }}
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        fontSize: 14,
                        color: activeTheme.mainTextColor,
                        bgcolor: activeTheme.fieldColor,
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        border: '1px solid rgba(71, 85, 105, 0.6)',
                        transition: 'all 0.2s ease',
                        '&:focus-within': {
                          borderColor: 'rgba(59, 130, 246, 0.8)',
                          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
                        },
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={primaryButtonStyles(activeTheme)}
                  >
                    Subscribe
                  </Button>
                </Stack>
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: 11,
                    color: activeTheme.secondaryTextColor,
                    opacity: 0.8,
                  }}
                >
                  No spam, ever. Unsubscribe anytime.
                </Typography>
              </form>
            </Paper>
          </>

          {/* COMMENTS */}
          <>
            <Typography
              sx={{
                fontSize: { xs: 26, md: 30 },
                fontWeight: 900,
                letterSpacing: 0.08,
                color: activeTheme.mainTextColor,
                mb: 1,
                mt: 4,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
              }}
            >
              Talk to the band
            </Typography>

            <Paper
              elevation={12}
              sx={{
                borderRadius: 2.5,
                p: 2.5,
                background: activeTheme.showBg,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${activeTheme.borderColor}`,
                transition: 'all 0.2s ease',
                width: '100%',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1,
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  mb: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: activeTheme.mainTextColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  Comments
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: activeTheme.secondaryTextColor,
                    opacity: 0.9,
                  }}
                >
                  {comments.length === 0
                    ? 'No comments yet'
                    : `${comments.length} comment${
                        comments.length === 1 ? '' : 's'
                      }`}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: 12,
                  color: activeTheme.secondaryTextColor,
                  mb: 2,
                  opacity: 0.85,
                }}
              >
                Comments are public and lightly moderated. Be kind and keep it
                band-related 🎸
              </Typography>

              {/* Comment list */}
              {comments.length === 0 ? (
                <Typography
                  sx={{
                    fontSize: 13,
                    color: activeTheme.secondaryTextColor,
                    mb: 3,
                  }}
                >
                  Be the first to leave a message for this band.
                </Typography>
              ) : (
                <Box
                  sx={{
                    maxHeight: 360,
                    overflowY: 'auto',
                    pr: 1,
                    mb: 3,
                    '&::-webkit-scrollbar': {
                      width: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                      background: activeTheme.showBg,
                      borderRadius: 999,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: activeTheme.borderColor,
                      borderRadius: 999,
                    },
                  }}
                >
                  <Stack spacing={2}>
                    {comments.map((c) => (
                      <Box
                        key={c.id}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: activeTheme.commentBg,
                          color: dark ? activeTheme.mainTextColor : '#0f172a',
                          border: `1px solid ${activeTheme.borderColor}`,
                          transition:
                            'background-color 0.2s ease, transform 0.2s ease',
                        }}
                      >
                        {/* Responsive circular avatar + glow */}
                        <Box
                          sx={{
                            position: 'relative',
                            flexShrink: 0,
                            width: 52,
                            height: 52,
                          }}
                        >
                          {/* glow behind */}
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              borderRadius: '50%',
                              background: activeTheme.avatarGlow,
                              opacity: 0.7,
                              filter: 'blur(4px)',
                              pointerEvents: 'none',
                            }}
                          />
                          {/* ring + avatar */}
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              padding: '2px',
                              background: activeTheme.avatarGlow,
                              boxSizing: 'border-box',
                            }}
                          >
                            <Avatar
                              sx={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                fontWeight: 700,
                                fontSize: 14,
                                bgcolor: dark
                                  ? activeTheme.commentBg
                                  : '#ffffff',
                                color: dark
                                  ? activeTheme.mainTextColor
                                  : '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textTransform: 'uppercase',
                              }}
                            >
                              {initialsFromName(c.display_name)}
                            </Avatar>
                          </Box>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: dark ? '#ffffff' : '#757983ff',
                              }}
                            >
                              {c.display_name || 'Guest'}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: dark ? '#e5e7eb' : '#4b5563',
                              }}
                            >
                              {formatTimeAgo(c.created_at)}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 14,
                              color: dark ? '#e5e7eb' : '#374151',
                              lineHeight: 1.5,
                            }}
                          >
                            {c.body}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Comment form */}
              <form action={addComment}>
                <input type="hidden" name="bandId" value={band.id} />
                <Stack spacing={1.5}>
                  <TextField
                    name="name"
                    placeholder="Your name (optional)"
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        fontSize: 14,
                        color: activeTheme.mainTextColor,
                        bgcolor: activeTheme.fieldColor,
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        border: '1px solid rgba(71, 85, 105, 0.6)',
                        transition: 'all 0.2s ease',
                        '&:focus-within': {
                          borderColor: 'rgba(59, 130, 246, 0.8)',
                          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
                        },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 2,
                      background: activeTheme.fieldColor,
                      border: '1px solid rgba(71, 85, 105, 0.6)',
                      transition: 'all 0.3s ease',
                      '&:focus-within': {
                        borderColor: 'rgba(59, 130, 246, 0.8)',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
                      },
                    }}
                  >
                    <TextField
                      name="body"
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Add a public comment... 💬"
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontSize: 14,
                          color: activeTheme.mainTextColor,
                          '&::placeholder': {
                            color: activeTheme.secondaryTextColor,
                          },
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={primaryButtonStyles(activeTheme)}
                    >
                      Post
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Paper>
          </>

          {/* FOOTER */}
          <Box
            sx={{
              mt: 2,
              py: 3,
              textAlign: 'center',
              borderTop: '1px solid rgba(71, 85, 105, 0.3)',
              width: '100%',
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                color: activeTheme.secondaryTextColor,
                fontWeight: 500,
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
    </Box>
  );
}
