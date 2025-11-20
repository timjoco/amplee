// apps/web/src/app/public/b/[slug]/page.tsx
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
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 60;

type ThemeName =
  | 'default'
  | 'cherry'
  | 'white'
  | 'woods'
  | 'deepPurple'
  | 'banana'
  | 'samus'
  | 'liquidDeath'
  | 'blackout'
  | 'money'
  | 'silver'
  | 'onepiece'
  | 'chocolate'
  | 'bioshock'
  | 'mario'
  | 'mattePurple'
  | 'matteYellow'
  | 'matteRed';

const DARK_THEMES: ThemeName[] = [
  'default',
  'deepPurple',
  'samus',
  'liquidDeath',
  'blackout',
];

function isDarkTheme(key: ThemeName) {
  return DARK_THEMES.includes(key);
}

type BandPageTheme = {
  background: string;
  avatarGlow: string;
  textGradient: string;
  showBg: string;
  borderColor: string;
  followButtonBg: string;
  followButtonBorder: string;
  followButtonTextColor: string;
  mainTextColor: string;
  secondaryTextColor: string;
};

const blackoutTheme: BandPageTheme = {
  background: '#000000', // Solid black background
  avatarGlow: 'linear-gradient(135deg, #444444, #111111)', // Subtle dark gray glow
  textGradient: 'linear-gradient(135deg, #ffffff, #cccccc)', // Light gradient for text
  showBg: 'rgba(255, 255, 255, 0.1)', // Light background for shows
  borderColor: 'rgba(255, 255, 255, 0.3)', // White border color
  followButtonBg: 'rgba(255, 255, 255, 0.1)', // Slightly transparent white for buttons
  followButtonBorder: 'rgba(255, 255, 255, 0.3)', // White border for buttons
  followButtonTextColor: '#ffffff', // White text color
  mainTextColor: '#ffffff', // White main text
  secondaryTextColor: '#cccccc', // Light gray for secondary text
};

const moneyTheme: BandPageTheme = {
  background: '#00ff00', // Bright green background
  avatarGlow: 'linear-gradient(135deg, #aaffaa, #007700)', // Light green to dark green glow
  textGradient: 'linear-gradient(135deg, #333333, #ffffff)', // Dark to white gradient for text
  showBg: 'rgba(0, 255, 0, 0.1)', // Light green for shows
  borderColor: 'rgba(0, 128, 0, 0.6)', // Dark green border color
  followButtonBg: 'rgba(0, 200, 0, 0.8)', // Green for buttons
  followButtonBorder: 'rgba(0, 150, 0, 0.6)', // Darker green border for buttons
  followButtonTextColor: '#ffffff', // White text color
  mainTextColor: '#111111', // Dark gray main text
  secondaryTextColor: '#555555', // Medium gray for secondary text
};

const silverTheme: BandPageTheme = {
  background: '#C0C0C0', // Silver background
  avatarGlow: 'linear-gradient(135deg, #ffffff, #a0a0a0)', // Light to dark silver glow
  textGradient: 'linear-gradient(135deg, #333333, #ffffff)', // Dark to white gradient for text
  showBg: 'rgba(192, 192, 192, 0.1)', // Light silver for shows
  borderColor: 'rgba(128, 128, 128, 0.6)', // Dark gray border color
  followButtonBg: 'rgba(192, 192, 192, 0.8)', // Slightly transparent silver for buttons
  followButtonBorder: 'rgba(128, 128, 128, 0.6)', // Dark gray border for buttons
  followButtonTextColor: '#000000', // Black text color
  mainTextColor: '#000000', // Black main text
  secondaryTextColor: '#444444', // Dark gray for secondary text
};

const onepieceTheme: BandPageTheme = {
  background: '#ffcc00', // Yellow background inspired by One Piece
  avatarGlow: 'linear-gradient(135deg, #ff6600, #cc0000)', // Orange to red glow
  textGradient: 'linear-gradient(135deg, #000000, #ffffff)', // Black to white gradient for text
  showBg: 'rgba(255, 204, 0, 0.1)', // Light yellow for shows
  borderColor: 'rgba(255, 153, 0, 0.6)', // Orange border color
  followButtonBg: 'rgba(255, 204, 0, 0.8)', // Yellow for buttons
  followButtonBorder: 'rgba(255, 153, 0, 0.6)', // Orange border for buttons
  followButtonTextColor: '#000000', // Black text color
  mainTextColor: '#000000', // Black main text
  secondaryTextColor: '#333333', // Dark gray for secondary text
};

const cherryBlossomTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #ffe4e1, #fff0f5)',
  avatarGlow: 'linear-gradient(135deg, #ffb6c1, #ff69b4)',
  textGradient: 'linear-gradient(135deg, #ff69b4, #ffb6c1)',
  showBg: 'rgba(255, 192, 203, 0.7)',
  borderColor: 'rgba(255, 105, 180, 0.6)',
  followButtonBg: 'rgba(255, 182, 193, 0.8)',
  followButtonBorder: 'rgba(255, 105, 180, 0.7)',
  followButtonTextColor: '#d81b60',
  mainTextColor: '#d81b60',
  secondaryTextColor: '#6d4c41',
};

const whiteTheme: BandPageTheme = {
  background: '#ffffff',
  avatarGlow: '#e0e0e0',
  textGradient: '#333333',
  showBg: 'rgba(240, 240, 240, 0.5)',
  borderColor: 'rgba(0, 0, 0, 0.1)',
  followButtonBg: '#f9f9f9',
  followButtonBorder: 'rgba(0, 0, 0, 0.2)',
  followButtonTextColor: '#333333',
  mainTextColor: '#000000',
  secondaryTextColor: '#555555',
};

const treesAndWoodsTheme: BandPageTheme = {
  background: '#f0f8ff',
  avatarGlow: 'linear-gradient(135deg, #8FBC8F, #6B8E23)',
  textGradient: 'linear-gradient(135deg, #556B2F, #8FBC8F)',
  showBg: 'rgba(34, 139, 34, 0.18)',
  borderColor: 'rgba(139, 69, 19, 0.6)',
  followButtonBg: 'rgba(34, 139, 34, 0.6)',
  followButtonBorder: 'rgba(139, 69, 19, 0.7)',
  followButtonTextColor: '#fff8dc',
  mainTextColor: '#1b4332',
  secondaryTextColor: '#4a5568',
};

const deepPurpleTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #5e35b1, #673ab7)',
  avatarGlow: 'linear-gradient(135deg, #7b1fa2, #ab47bc)',
  textGradient: 'linear-gradient(135deg, #d5006d, #f50057)',
  showBg: 'rgba(255, 255, 255, 0.1)',
  borderColor: 'rgba(156, 39, 176, 0.5)',
  followButtonBg: 'rgba(255, 255, 255, 0.1)',
  followButtonBorder: 'rgba(255, 255, 255, 0.3)',
  followButtonTextColor: '#ffffff',
  mainTextColor: '#ffffff',
  secondaryTextColor: '#e1bee7',
};

const bananaTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #fff176, #ffe135)',
  avatarGlow: 'linear-gradient(135deg, #fbc02d, #fdd835)',
  textGradient: 'linear-gradient(135deg, #fbc02d, #f9a825)',
  showBg: 'rgba(255, 235, 59, 0.7)',
  borderColor: 'rgba(255, 235, 59, 0.5)',
  followButtonBg: 'rgba(255, 245, 157, 0.5)',
  followButtonBorder: 'rgba(255, 193, 7, 0.6)',
  followButtonTextColor: '#4a4a4a',
  mainTextColor: '#5d4037',
  secondaryTextColor: '#8d6e63',
};

const samusAranTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #ff6f00, #b2ff59)',
  avatarGlow: 'linear-gradient(135deg, #ff8f00, #c6ff00)',
  textGradient: 'linear-gradient(135deg, #ff5722, #ffab40)',
  showBg: 'rgba(0, 150, 136, 0.6)',
  borderColor: 'rgba(255, 87, 34, 0.5)',
  followButtonBg: 'rgba(0, 150, 136, 0.1)',
  followButtonBorder: 'rgba(0, 150, 136, 0.3)',
  followButtonTextColor: '#ffffff',
  mainTextColor: '#ffffff',
  secondaryTextColor: '#ffcc80',
};

const liquidDeathTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #111111, #222222)',
  avatarGlow: 'linear-gradient(135deg, #ffd700, #ffcc00)',
  textGradient: 'linear-gradient(135deg, #ffcc00, #ffd700)',
  showBg: 'rgba(0, 0, 0, 0.8)',
  borderColor: 'rgba(255, 215, 0, 0.5)',
  followButtonBg: 'rgba(255, 215, 0, 0.1)',
  followButtonBorder: 'rgba(255, 215, 0, 0.3)',
  followButtonTextColor: '#ffd700',
  mainTextColor: '#ffd700',
  secondaryTextColor: '#ffffff',
};

// neon / default
const defaultTheme: BandPageTheme = {
  background: `
    radial-gradient(ellipse at 50% -50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 0% 100%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0f 0%, #050509 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  textGradient: 'linear-gradient(135deg, #fff, #a78bfa)',
  showBg: 'rgba(30, 41, 59, 0.6)',
  borderColor: 'rgba(71, 85, 105, 0.65)',
  followButtonBg: 'rgba(15,23,42,0.95)',
  followButtonBorder: 'rgba(236, 72, 153, 0.6)',
  followButtonTextColor: '#f9a8d4',
  mainTextColor: '#ffffff',
  secondaryTextColor: '#d1d5db',
};

const chocolateTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #4e342e, #3e2723)',
  avatarGlow: 'linear-gradient(135deg, #6d4c41, #a1887f)',
  textGradient: 'linear-gradient(135deg, #ffccbc, #ffe0b2)',
  showBg: 'rgba(62, 39, 35, 0.75)',
  borderColor: 'rgba(161, 136, 127, 0.7)',
  followButtonBg: 'rgba(33, 22, 18, 0.95)',
  followButtonBorder: 'rgba(198, 166, 144, 0.9)',
  followButtonTextColor: '#ffe0b2',
  mainTextColor: '#fff7ed',
  secondaryTextColor: '#ffccbc',
};

const bioshockTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #0f172a, #022c22)',
  avatarGlow: 'linear-gradient(135deg, #22c55e, #0ea5e9)',
  textGradient: 'linear-gradient(135deg, #e5e7eb, #a7f3d0)',
  showBg: 'rgba(15, 23, 42, 0.8)',
  borderColor: 'rgba(148, 163, 184, 0.7)',
  followButtonBg: 'rgba(15, 23, 42, 0.95)',
  followButtonBorder: 'rgba(56, 189, 248, 0.7)',
  followButtonTextColor: '#e0f2fe',
  mainTextColor: '#f9fafb',
  secondaryTextColor: '#a7f3d0',
};

const marioTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #ef4444, #1d4ed8)',
  avatarGlow: 'linear-gradient(135deg, #f97316, #facc15)',
  textGradient: 'linear-gradient(135deg, #fef3c7, #facc15)',
  showBg: 'rgba(15, 23, 42, 0.75)',
  borderColor: 'rgba(248, 250, 252, 0.6)',
  followButtonBg: 'rgba(248, 250, 252, 0.14)',
  followButtonBorder: 'rgba(248, 250, 252, 0.7)',
  followButtonTextColor: '#fef9c3',
  mainTextColor: '#fefce8',
  secondaryTextColor: '#fde68a',
};

const mattePurpleTheme: BandPageTheme = {
  background: '#171427',
  avatarGlow: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  textGradient: 'linear-gradient(135deg, #e5e7eb, #a855f7)',
  showBg: 'rgba(15, 15, 26, 0.9)',
  borderColor: 'rgba(129, 140, 248, 0.6)',
  followButtonBg: '#1f172f',
  followButtonBorder: 'rgba(168, 85, 247, 0.8)',
  followButtonTextColor: '#ede9fe',
  mainTextColor: '#f9fafb',
  secondaryTextColor: '#c4b5fd',
};

const matteYellowTheme: BandPageTheme = {
  background: '#1e1b18',
  avatarGlow: 'linear-gradient(135deg, #fbbf24, #facc15)',
  textGradient: 'linear-gradient(135deg, #fef3c7, #facc15)',
  showBg: 'rgba(24, 20, 15, 0.95)',
  borderColor: 'rgba(245, 158, 11, 0.7)',
  followButtonBg: '#29221a',
  followButtonBorder: 'rgba(234, 179, 8, 0.9)',
  followButtonTextColor: '#fef3c7',
  mainTextColor: '#fef9c3',
  secondaryTextColor: '#fcd34d',
};

const matteRedTheme: BandPageTheme = {
  background: '#1a1111',
  avatarGlow: 'linear-gradient(135deg, #ef4444, #f97316)',
  textGradient: 'linear-gradient(135deg, #fecaca, #f97316)',
  showBg: 'rgba(24, 14, 14, 0.95)',
  borderColor: 'rgba(248, 113, 113, 0.7)',
  followButtonBg: '#241111',
  followButtonBorder: 'rgba(239, 68, 68, 0.9)',
  followButtonTextColor: '#fee2e2',
  mainTextColor: '#fee2e2',
  secondaryTextColor: '#fecaca',
};

const THEMES: Record<ThemeName, BandPageTheme> = {
  default: defaultTheme,
  cherry: cherryBlossomTheme,
  white: whiteTheme,
  woods: treesAndWoodsTheme,
  deepPurple: deepPurpleTheme,
  banana: bananaTheme,
  samus: samusAranTheme,
  liquidDeath: liquidDeathTheme,
  blackout: blackoutTheme,
  money: moneyTheme,
  silver: silverTheme,
  onepiece: onepieceTheme,
  chocolate: chocolateTheme,
  bioshock: bioshockTheme,
  mario: marioTheme,
  mattePurple: mattePurpleTheme,
  matteYellow: matteYellowTheme,
  matteRed: matteRedTheme,
};

const THEME_OPTIONS: { key: ThemeName; label: string }[] = [
  { key: 'default', label: 'Neon' },
  { key: 'cherry', label: 'Blossom' },
  { key: 'white', label: 'White' },
  { key: 'woods', label: 'Woods' },
  { key: 'deepPurple', label: 'Deep Purple' },
  { key: 'banana', label: 'Banana' },
  { key: 'samus', label: 'Samus' },
  { key: 'liquidDeath', label: 'Liquid Death' },
  { key: 'blackout', label: 'Blackout' },
  { key: 'money', label: 'Money' },
  { key: 'silver', label: 'Silver' },
  { key: 'onepiece', label: 'One Piece' },
  { key: 'chocolate', label: 'Chocolate' },
  { key: 'bioshock', label: 'BioShock' },
  { key: 'mario', label: 'Mario' },
  { key: 'mattePurple', label: 'Matte Purple' },
  { key: 'matteYellow', label: 'Matte Yellow' },
  { key: 'matteRed', label: 'Matte Red' },
];

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
  border: `1px solid ${theme.followButtonBorder}`,
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

  // music / listen platforms
  if (key === 'spotify') return <MusicNoteIcon fontSize="large" />;
  if (key === 'apple' || key === 'applemusic')
    return <AppleIcon fontSize="large" />;
  if (key === 'bandcamp') return <LibraryMusicIcon fontSize="large" />;
  if (key === 'soundcloud') return <LibraryMusicIcon fontSize="large" />;
  if (key === 'youtube' || key === 'youtube_music')
    return <YouTubeIcon fontSize="large" />;

  // socials
  if (key === 'instagram') return <InstagramIcon fontSize="large" />;
  if (key === 'facebook') return <FacebookIcon fontSize="large" />;
  if (key === 'twitter' || key === 'x') return <TwitterIcon fontSize="large" />;
  if (key === 'tiktok') return <AudiotrackIcon fontSize="large" />;

  // link hubs / misc
  if (key === 'linktree' || key === 'website' || key === 'site') {
    return <LinkIcon fontSize="large" />;
  }

  // fallback
  return <LinkIcon fontSize="large" />;
}

export default async function PublicBandPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ theme?: string }>;
}) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) || {};
  const rawTheme = (sp.theme || '').toString();

  const allThemeKeys = Object.keys(THEMES) as ThemeName[];

  const themeKey: ThemeName = allThemeKeys.includes(rawTheme as ThemeName)
    ? (rawTheme as ThemeName)
    : 'default';

  const activeTheme = THEMES[themeKey];

  // --- Server Actions ------------------------------------------------

  async function addComment(formData: FormData) {
    'use server';

    const bandId = formData.get('bandId') as string | null;
    const nameRaw = formData.get('name') as string | null;
    const bodyRaw = formData.get('body') as string | null;

    const display_name = nameRaw?.trim() || null;
    let body = bodyRaw?.trim() || null;

    if (!bandId || !body) return;

    // basic text moderation
    const blockedWords = [
      'slur1',
      'slur2',
      'swear1',
      'swear2',
      // TODO: replace with whatever list you actually want
    ];
    const lower = body.toLowerCase();
    if (blockedWords.some((w) => w && lower.includes(w))) {
      console.warn('[public band comments] blocked comment due to moderation');
      return;
    }

    // hard cap length so people can’t post a novel
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

  // --- BAND --------------------------------------------------------
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

  // --- COMMENTS ----------------------------------------------------
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

  // --- EVENTS ------------------------------------------------------
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

  // everything NOT an explicit social goes into "Listen"
  const listenLinks = orderedLinks.filter(
    (l) => !FOLLOW_TYPES.includes((l.type || '').toLowerCase())
  );

  const topListenLinks = listenLinks;
  const topFollowLinks = followLinks;

  const dark = isDarkTheme(themeKey);

  // --- UI ---------------------------------------------------------
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0a0f',
      }}
    >
      {/* ANIMATED BACKGROUND */}
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
        {/* Animated gradient lines */}
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

        {/* Glowing orbs */}
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

      {/* MAIN CONTENT */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 4, md: 6 },
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
          }}
        >
          {/* HERO */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 3,
              alignItems: 'center',
              p: { xs: 1, md: 2 },
            }}
          >
            {/* Avatar with epic glow */}
            <Box
              sx={{
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: -8,
                  borderRadius: '50%',
                  background: activeTheme.avatarGlow,
                  opacity: 0.6,
                  filter: 'blur(20px)',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
                    '50%': { opacity: 0.8, transform: 'scale(1.05)' },
                  },
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <Box
                sx={{
                  position: 'relative',
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid transparent',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  padding: '3px',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: 'rgba(15,23,42,0.98)',
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
            <Box>
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

          {/* THEME SWITCHER */}
          {/* THEME SWITCHER */}
          <Box
            sx={{
              alignSelf: { xs: 'center', md: 'flex-end' },
              mb: 1,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', // 4 x 2 grid
                gap: 0.75,
              }}
            >
              {THEME_OPTIONS.map((t) => (
                <Box
                  key={t.key}
                  component={Link}
                  href={t.key === 'default' ? '?' : `?theme=${t.key}`}
                  sx={{
                    px: 1.25,
                    py: 0.6,
                    borderRadius: 999,
                    fontSize: 11,
                    textAlign: 'center',
                    border:
                      t.key === themeKey
                        ? '1px solid rgba(255,255,255,0.9)'
                        : '1px solid rgba(148,163,184,0.5)',
                    color:
                      t.key === themeKey ? '#0f172a' : 'rgba(226,232,240,0.9)',
                    backgroundColor:
                      t.key === themeKey
                        ? 'rgba(248,250,252,0.95)'
                        : 'rgba(15,23,42,0.7)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    },
                  }}
                >
                  {t.label}
                </Box>
              ))}
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
                  color: activeTheme.mainTextColor, // themed
                  mb: 1,
                  mt: 3,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                Upcoming Shows
              </Typography>

              <Stack spacing={2.25}>
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
                          // keep a darker hover bg for all themes
                          background:
                            themeKey === 'white' || themeKey === 'cherry'
                              ? 'rgba(15,23,42,0.06)'
                              : 'rgba(30, 41, 59, 0.9)',
                          borderColor:
                            themeKey === 'white' || themeKey === 'cherry'
                              ? activeTheme.borderColor
                              : 'rgba(59, 130, 246, 0.7)',
                          transform: 'translateX(4px)',
                          boxShadow:
                            themeKey === 'white' || themeKey === 'cherry'
                              ? 'none'
                              : '-4px 0 0 rgba(59, 130, 246, 0.7)',
                        },
                      }}
                    >
                      {/* Date Badge */}
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

                      {/* Show Info */}
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

          {/* NEWSLETTER SIGNUP */}
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
                '&:hover': {
                  background:
                    themeKey === 'white' || themeKey === 'cherry'
                      ? 'rgba(15,23,42,0.06)'
                      : 'rgba(30, 41, 59, 0.9)',
                  borderColor:
                    themeKey === 'white' || themeKey === 'cherry'
                      ? activeTheme.borderColor
                      : 'rgba(59, 130, 246, 0.7)',
                  transform: 'translateX(4px)',
                  boxShadow:
                    themeKey === 'white' || themeKey === 'cherry'
                      ? 'none'
                      : '-4px 0 0 rgba(59, 130, 246, 0.7)',
                },
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
                        bgcolor: 'rgba(15,23,42,0.5)',
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

          {/* COMMENTS / MESSAGE THE BAND */}
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
              }}
            >
              Message the Band
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
                '&:hover': {
                  background:
                    themeKey === 'white' || themeKey === 'cherry'
                      ? 'rgba(15,23,42,0.06)'
                      : 'rgba(30, 41, 59, 0.9)',
                  borderColor:
                    themeKey === 'white' || themeKey === 'cherry'
                      ? activeTheme.borderColor
                      : 'rgba(59, 130, 246, 0.7)',
                  transform: 'translateX(4px)',
                  boxShadow:
                    themeKey === 'white' || themeKey === 'cherry'
                      ? 'none'
                      : '-4px 0 0 rgba(59, 130, 246, 0.7)',
                },
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
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#3b82f6',
                      boxShadow: '0 0 14px #3b82f6',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
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
                      '&:hover': {
                        background: activeTheme.followButtonBorder,
                      },
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
                          backgroundColor: dark ? '#000000' : '#ffffff', // 👈 rule: only black or white
                          color: dark ? '#f9fafb' : '#0f172a', // text white on black, dark on white
                          border: `1px solid ${activeTheme.borderColor}`,
                          transition:
                            'background-color 0.2s ease, transform 0.2s ease',
                          '&:hover': {
                            backgroundColor: dark ? '#000000' : '#ffffff', // stay flat, no extra tints
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: 'transparent',
                            background:
                              'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            fontWeight: 700,
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                            fontSize: 14,
                          }}
                        >
                          {initialsFromName(c.display_name)}
                        </Avatar>
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
                                color: dark ? '#ffffff' : '#0f172a',
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
                        bgcolor: 'rgba(15,23,42,0.5)',
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
                      background: 'rgba(15,23,42,0.5)',
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
