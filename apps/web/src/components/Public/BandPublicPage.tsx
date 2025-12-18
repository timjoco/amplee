'use client';

import {
  CalendarMonth,
  Check,
  Close,
  Email,
  ExpandLess,
  ExpandMore,
  Headphones,
  LocationOn,
  OpenInNew,
  PhotoLibrary,
  PlayArrow,
  Send,
  Share,
} from '@mui/icons-material';

import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  Skeleton,
  Snackbar,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { AnimatedBackground } from './BandPublicAnimatedBackground';
import { SocialIcon, StreamingIcon } from './BandPublicIcons';
import { SectionHeader } from './BandPublicSectionHeader';
import { useBandPublicTheme, type BandThemeStyle } from './useBandPublicTheme';

// ============================================
// TYPES
// ============================================

export interface StreamingLink {
  platform: string;
  url: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export type BandData = {
  id: string;
  name: string;
  public_avatar_url?: string;
  public_bio?: string;
  location?: string;
  genres?: string[];
  public_slug?: string;
  embedded_video_url?: string;
  gallery_images?: string[];
  public_theme?:
    | 'cosmic'
    | 'cosmic-light'
    | 'matrix'
    | 'blocky'
    | 'modest'
    | 'modest-dark'
    | 'sakura';
};

export interface Event {
  id: string;
  title: string;
  date: string;
  venue?: string;
  location?: string;
  ticket_url?: string;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
}

export interface Video {
  id: string;
  embed_url: string;
  title?: string;
}

// ============================================
// COMPONENT PROPS
// ============================================
interface BandPublicPageProps {
  slug?: string;
  initialData?: {
    band: BandData | null;
    events: Event[];
    streamingLinks: StreamingLink[];
    photos: Photo[];
    videos: Video[];
    socialLinks?: SocialLink[];
  };
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function BandPublicPage({
  slug,
  initialData,
}: BandPublicPageProps) {
  const [band] = useState<BandData | null>(initialData?.band ?? null);
  const [events] = useState<Event[]>(initialData?.events ?? []);
  const [streamingLinks] = useState<StreamingLink[]>(
    initialData?.streamingLinks ?? []
  );
  const [socialLinks] = useState<SocialLink[]>(initialData?.socialLinks ?? []);
  const [photos] = useState<Photo[]>(initialData?.photos ?? []);
  const [videos] = useState<Video[]>(initialData?.videos ?? []);
  const [loading] = useState(!initialData);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [contactOpen, setContactOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [copied, setCopied] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Derive theme style from band / initialData
  const themeStyle: BandThemeStyle =
    (band?.public_theme as BandThemeStyle) ??
    (initialData?.band?.public_theme as BandThemeStyle) ??
    'cosmic';

  const {
    theme,
    themeMode,
    showAnimatedBackground,
    getCardStyle,
    getBackgroundStyle,
    getAccentColors,
  } = useBandPublicTheme(themeStyle);

  const handleCloseEventDialog = () => setSelectedEvent(null);

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const displayEvents = showAllEvents
    ? upcomingEvents
    : upcomingEvents.slice(0, 3);

  const formatEventDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  };

  // Theme-aware platform colors
  const getPlatformColor = (platform: string) => {
    if (themeStyle === 'matrix') return '#00FF00';
    if (themeStyle === 'modest') return '#525252';
    if (themeStyle === 'modest-dark') return '#a3a3a3';

    const colors: Record<string, string> = {
      spotify: '#1DB954',
      apple: '#FA2D48',
      youtube: '#FF0000',
      soundcloud: '#FF5500',
      bandcamp: '#1DA0C3',
    };
    return colors[platform.toLowerCase()] || theme.palette.primary.main;
  };

  const getSocialColor = (platform: string) => {
    if (themeStyle === 'matrix') return '#00FF00';
    if (themeStyle === 'modest') return '#525252';
    if (themeStyle === 'modest-dark') return '#a3a3a3';

    const colors: Record<string, string> = {
      instagram: '#E1306C',
      facebook: '#1877F2',
      twitter: '#1DA1F2',
      x: themeMode === 'dark' ? '#FFFFFF' : '#000000',
      website: theme.palette.primary.main,
      site: theme.palette.primary.main,
      linktree: '#43E660',
      homepage: theme.palette.primary.main,
    };
    return colors[platform.toLowerCase()] || theme.palette.primary.main;
  };

  // Theme-specific button styles
  const getPrimaryButtonStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          background: '#00FF00',
          color: '#000000',
          border: '1px solid #00FF00',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)',
          '&:hover': {
            background: '#00CC00',
            boxShadow:
              '0 0 30px rgba(0, 255, 0, 0.6), 0 0 60px rgba(0, 255, 0, 0.3)',
          },
        };
      case 'blocky':
        return {
          background: '#FF2E6C',
          color: '#FFFFFF',
          border: '2px solid #0a0a0a',
          borderRadius: '4px',
          boxShadow: '4px 4px 0px #0a0a0a',
          '&:hover': {
            background: '#E6295F',
            transform: 'translate(-2px, -2px)',
            boxShadow: '6px 6px 0px #0a0a0a',
          },
        };
      case 'modest':
        return {
          background: '#404040',
          color: '#FFFFFF',
          borderRadius: '6px',
          boxShadow: 'none',
          '&:hover': {
            background: '#525252',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
        };
      case 'modest-dark':
        return {
          background: '#f5f5f5',
          color: '#171717',
          borderRadius: '6px',
          boxShadow: 'none',
          '&:hover': {
            background: '#e5e5e5',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          },
        };
      case 'cosmic-light':
        return {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          boxShadow:
            '0 8px 32px rgba(139, 92, 246, 0.25), 0 0 40px rgba(236, 72, 153, 0.15)',
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow:
              '0 12px 40px rgba(139, 92, 246, 0.35), 0 0 60px rgba(236, 72, 153, 0.2)',
          },
        };
      case 'sakura':
        return {
          background: 'linear-gradient(135deg, #F472B6 0%, #FB7185 100%)',
          border: '1px solid rgba(244, 114, 182, 0.3)',
          borderRadius: '24px',
          boxShadow: '0 8px 24px rgba(244, 114, 182, 0.3)',
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow: '0 12px 32px rgba(244, 114, 182, 0.4)',
          },
        };
      case 'cosmic':
      default:
        return {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          boxShadow:
            '0 8px 32px rgba(139, 92, 246, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)',
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow:
              '0 12px 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(236, 72, 153, 0.3)',
          },
        };
    }
  };

  const getSecondaryButtonStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          background: 'transparent',
          color: '#00FF00',
          border: '1px solid #00FF00',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(0, 255, 0, 0.1)',
            boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
          },
        };
      case 'blocky':
        return {
          background: '#FFFFFF',
          color: '#0a0a0a',
          border: '2px solid #0a0a0a',
          borderRadius: '4px',
          boxShadow: '3px 3px 0px #0a0a0a',
          '&:hover': {
            background: '#0a0a0a',
            color: '#FFFFFF',
            transform: 'translate(-2px, -2px)',
            boxShadow: '5px 5px 0px #0a0a0a',
          },
        };
      case 'modest':
        return {
          background: 'transparent',
          color: '#525252',
          border: '1px solid #d4d4d4',
          borderRadius: '6px',
          '&:hover': {
            borderColor: '#a3a3a3',
            background: '#fafafa',
          },
        };
      case 'modest-dark':
        return {
          background: 'transparent',
          color: '#a3a3a3',
          border: '1px solid #525252',
          borderRadius: '6px',
          '&:hover': {
            borderColor: '#737373',
            background: '#333333',
          },
        };
      case 'cosmic-light':
        return {
          background: alpha(theme.palette.background.paper, 0.5),
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha('#34D399', 0.4)}`,
          borderRadius: '16px',
          color: '#10B981',
          '&:hover': {
            border: `1px solid ${alpha('#34D399', 0.7)}`,
            transform: 'translateY(-3px)',
            boxShadow:
              '0 8px 32px rgba(52, 211, 153, 0.2), 0 0 40px rgba(52, 211, 153, 0.1)',
          },
        };
      case 'sakura':
        return {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '2px solid #F9A8D4',
          borderRadius: '24px',
          color: '#BE185D',
          '&:hover': {
            border: '2px solid #F472B6',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(244, 114, 182, 0.2)',
          },
        };
      case 'cosmic':
      default:
        return {
          background: alpha(theme.palette.background.paper, 0.3),
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha('#34D399', 0.4)}`,
          borderRadius: '16px',
          color: '#34D399',
          '&:hover': {
            border: `1px solid ${alpha('#34D399', 0.7)}`,
            transform: 'translateY(-3px)',
            boxShadow:
              '0 8px 32px rgba(52, 211, 153, 0.3), 0 0 50px rgba(52, 211, 153, 0.15)',
          },
        };
    }
  };

  // Theme-specific link button styles
  const getLinkButtonStyle = (color: string) => {
    switch (themeStyle) {
      case 'matrix':
        return {
          background: 'transparent',
          border: '1px solid #00FF00',
          borderRadius: '4px',
          color: '#00FF00',
          '&:hover': {
            background: 'rgba(0, 255, 0, 0.15)',
            boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)',
          },
        };
      case 'blocky':
        return {
          background: '#FFFFFF',
          border: '2px solid #0a0a0a',
          borderRadius: '4px',
          color: '#0a0a0a',
          boxShadow: '3px 3px 0px #0a0a0a',
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '5px 5px 0px #0a0a0a',
          },
        };
      case 'modest':
        return {
          background: '#FFFFFF',
          border: '1px solid #e5e5e5',
          borderRadius: '6px',
          color: '#525252',
          '&:hover': {
            borderColor: '#d4d4d4',
            background: '#fafafa',
          },
        };
      case 'modest-dark':
        return {
          background: '#262626',
          border: '1px solid #404040',
          borderRadius: '6px',
          color: '#a3a3a3',
          '&:hover': {
            borderColor: '#525252',
            background: '#333333',
          },
        };
      case 'cosmic-light':
        return {
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(
            color,
            0.03
          )} 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha(color, 0.3)}`,
          borderRadius: '14px',
          color: color,
          '&:hover': {
            border: `1px solid ${alpha(color, 0.5)}`,
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 24px ${alpha(color, 0.2)}, 0 0 30px ${alpha(
              color,
              0.1
            )}`,
          },
        };
      case 'sakura':
        return {
          background: 'rgba(255, 255, 255, 0.8)',
          border: `1px solid ${alpha(color, 0.3)}`,
          borderRadius: '16px',
          color: color,
          '&:hover': {
            border: `1px solid ${alpha(color, 0.5)}`,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 20px ${alpha(color, 0.2)}`,
          },
        };
      case 'cosmic':
      default:
        return {
          background: `linear-gradient(135deg, ${alpha(
            color,
            0.15
          )} 0%, ${alpha(color, 0.05)} 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha(color, 0.4)}`,
          borderRadius: '14px',
          color: color,
          '&:hover': {
            border: `1px solid ${alpha(color, 0.7)}`,
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 24px ${alpha(color, 0.35)}, 0 0 40px ${alpha(
              color,
              0.2
            )}`,
          },
        };
    }
  };

  // Avatar glow style based on theme
  const getAvatarGlowStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          background: '#00FF00',
          filter: 'blur(40px)',
          opacity: 0.4,
        };
      case 'blocky':
        return {
          background: 'linear-gradient(135deg, #FF2E6C, #00D4FF)',
          filter: 'blur(30px)',
          opacity: 0.3,
        };
      case 'modest':
      case 'modest-dark':
        return {
          display: 'none',
        };
      case 'cosmic-light':
        return {
          background: 'linear-gradient(135deg, #5865F2, #EB459E)',
          filter: 'blur(40px)',
          opacity: 0.25,
        };
      case 'sakura':
        return {
          background: 'linear-gradient(135deg, #F472B6, #FBCFE8)',
          filter: 'blur(40px)',
          opacity: 0.4,
        };
      case 'cosmic':
      default:
        return {
          background: 'linear-gradient(135deg, #5865F2, #EB459E)',
          filter: 'blur(40px)',
          opacity: 0.4,
        };
    }
  };

  // Online indicator style based on theme
  const getOnlineIndicatorStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          bgcolor: '#00FF00',
          boxShadow: '0 0 12px rgba(0, 255, 0, 0.8)',
        };
      case 'blocky':
        return {
          bgcolor: '#00D4FF',
          boxShadow: 'none',
          border: '3px solid #0a0a0a',
        };
      case 'modest':
        return {
          bgcolor: '#22c55e',
          boxShadow: 'none',
        };
      case 'modest-dark':
        return {
          bgcolor: '#22c55e',
          boxShadow: 'none',
        };
      case 'cosmic-light':
        return {
          bgcolor: '#57F287',
          boxShadow: '0 0 8px rgba(87, 242, 135, 0.4)',
        };
      case 'sakura':
        return {
          bgcolor: '#86EFAC',
          boxShadow: '0 0 8px rgba(134, 239, 172, 0.5)',
        };
      case 'cosmic':
      default:
        return {
          bgcolor: '#57F287',
          boxShadow: '0 0 12px rgba(87, 242, 135, 0.5)',
        };
    }
  };

  // Band name gradient based on theme
  const getBandNameStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          color: '#00FF00',
          textShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
          WebkitTextFillColor: 'unset',
        };
      case 'blocky':
        return {
          color: '#0a0a0a',
          WebkitTextFillColor: 'unset',
        };
      case 'modest':
        return {
          color: '#171717',
          WebkitTextFillColor: 'unset',
        };
      case 'modest-dark':
        return {
          color: '#f5f5f5',
          WebkitTextFillColor: 'unset',
        };
      case 'cosmic-light':
        return {
          background: 'linear-gradient(135deg, #5865F2 0%, #EB459E 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        };
      case 'sakura':
        return {
          background: 'linear-gradient(135deg, #BE185D 0%, #F472B6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        };
      case 'cosmic':
      default:
        return {
          background:
            'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        };
    }
  };

  // Date badge style based on theme
  const getDateBadgeStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          background: 'rgba(0, 255, 0, 0.1)',
          border: '1px solid #00FF00',
        };
      case 'blocky':
        return {
          background: '#FFFFFF',
          border: '2px solid #0a0a0a',
          boxShadow: '2px 2px 0px #0a0a0a',
        };
      case 'modest':
        return {
          background: '#f5f5f5',
          border: '1px solid #e5e5e5',
        };
      case 'modest-dark':
        return {
          background: '#333333',
          border: '1px solid #404040',
        };
      case 'cosmic-light':
        return {
          background:
            'linear-gradient(135deg, rgba(88, 101, 242, 0.1), rgba(235, 69, 158, 0.08))',
        };
      case 'sakura':
        return {
          background: 'rgba(244, 114, 182, 0.1)',
          border: '1px solid rgba(244, 114, 182, 0.3)',
        };
      case 'cosmic':
      default:
        return {
          background:
            'linear-gradient(135deg, rgba(88, 101, 242, 0.15), rgba(235, 69, 158, 0.1))',
        };
    }
  };

  const handleContactSubmit = async () => {
    const { name, email, message } = contactForm;

    if (!name || !email || !message) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error',
      });
      return;
    }

    try {
      const res = await fetch(`/b/${slug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to send message');
      }

      setSnackbar({
        open: true,
        message: 'Message sent successfully!',
        severity: 'success',
      });
      setContactOpen(false);
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('[contact submit error]', err);
      setSnackbar({
        open: true,
        message: 'Something went wrong sending your message',
        severity: 'error',
      });
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: band?.name, url });
      } catch {
        // user cancelled
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share button style based on theme
  const getShareButtonStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #00FF00',
          borderRadius: '4px',
          color: '#00FF00',
          '&:hover': {
            boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)',
          },
        };
      case 'blocky':
        return {
          bgcolor: '#FFFFFF',
          border: '2px solid #0a0a0a',
          borderRadius: '4px',
          color: '#0a0a0a',
          boxShadow: '3px 3px 0px #0a0a0a',
        };
      case 'modest':
        return {
          bgcolor: '#FFFFFF',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          color: '#525252',
        };
      case 'cosmic':
      default:
        return {
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#fff', 0.08)}`,
          borderRadius: '20px',
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        };
    }
  };

  // Font imports based on theme
  const getFontImport = () => {
    switch (themeStyle) {
      case 'matrix':
        return `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');`;
      case 'blocky':
        return `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&display=swap');`;
      case 'modest':
        return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`;
      case 'cosmic':
      default:
        return `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');`;
    }
  };

  const getPublicAvatarSrc = (band: BandData | null): string | undefined => {
    const raw = (band?.public_avatar_url ?? '').trim();
    if (!raw) return undefined;

    if (raw.startsWith('https://')) return raw;

    return undefined;
  };

  const publicAvatarSrc = getPublicAvatarSrc(band);

  if (loading && !initialData) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
          <Container maxWidth="lg">
            <Skeleton
              variant="circular"
              width={140}
              height={140}
              sx={{ mx: 'auto', mb: 3 }}
            />
            <Skeleton
              variant="text"
              width="50%"
              height={56}
              sx={{ mx: 'auto' }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={28}
              sx={{ mx: 'auto', mt: 1 }}
            />
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  if (!band) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" color="text.secondary">
            Band not found
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>{getFontImport()}</style>
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          ...getBackgroundStyle(),
        }}
      >
        {showAnimatedBackground && (
          <AnimatedBackground themeMode={themeMode} themeStyle={themeStyle} />
        )}

        {/* Fixed Controls */}
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
            display: 'flex',
            gap: 1,
          }}
        >
          <Tooltip title={copied ? 'Copied!' : 'Share'}>
            <IconButton
              onClick={handleShare}
              sx={{ p: 1.5, ...getShareButtonStyle() }}
            >
              {copied ? <Check color="success" /> : <Share />}
            </IconButton>
          </Tooltip>
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* HERO SECTION */}
          <Fade in timeout={600}>
            <Box
              sx={{
                pt: { xs: 8, md: 12 },
                pb: { xs: 6, md: 8 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Avatar with glow */}
              <Box sx={{ position: 'relative', mb: 4 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: 160, md: 200 },
                    height: { xs: 160, md: 200 },
                    borderRadius: '50%',
                    ...getAvatarGlowStyle(),
                  }}
                />

                <Avatar
                  src={band.public_avatar_url ?? undefined}
                  alt={band.name}
                  imgProps={{
                    referrerPolicy: 'no-referrer', // optional, harmless
                    onError: (e) => {
                      // don’t keep retrying a bad URL
                      (e.currentTarget as HTMLImageElement).src = '';
                    },
                  }}
                  sx={{
                    width: { xs: 140, md: 180 },
                    height: { xs: 140, md: 180 },
                    border:
                      themeStyle === 'blocky'
                        ? '4px solid #0a0a0a'
                        : themeStyle === 'matrix'
                        ? '2px solid #00FF00'
                        : `4px solid ${alpha(
                            theme.palette.background.paper,
                            0.9
                          )}`,
                    boxShadow:
                      themeStyle === 'matrix'
                        ? '0 0 30px rgba(0, 255, 0, 0.3)'
                        : themeStyle === 'blocky'
                        ? '6px 6px 0px #0a0a0a'
                        : `0 20px 60px ${alpha('#000', 0.3)}`,
                    position: 'relative',
                  }}
                />
                {/* Online indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: `4px solid ${theme.palette.background.paper}`,
                    ...getOnlineIndicatorStyle(),
                  }}
                />
              </Box>

              {/* Band name */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  mb: 1.5,
                  ...getBandNameStyle(),
                }}
              >
                {band.name}
              </Typography>

              {/* Location */}
              {band.location && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 2,
                    py: 0.75,
                    borderRadius:
                      themeStyle === 'blocky' || themeStyle === 'matrix'
                        ? 1
                        : 2,
                    bgcolor:
                      themeStyle === 'matrix'
                        ? 'transparent'
                        : themeStyle === 'blocky'
                        ? '#FFFFFF'
                        : alpha(theme.palette.background.paper, 0.6),
                    backdropFilter:
                      themeStyle === 'cosmic' ? 'blur(8px)' : undefined,
                    border:
                      themeStyle === 'matrix'
                        ? '1px solid #00FF00'
                        : themeStyle === 'blocky'
                        ? '2px solid #0a0a0a'
                        : `1px solid ${theme.palette.divider}`,
                    boxShadow:
                      themeStyle === 'blocky'
                        ? '2px 2px 0px #0a0a0a'
                        : undefined,
                    mb: 3,
                  }}
                >
                  <LocationOn
                    sx={{
                      fontSize: 18,
                      color:
                        themeStyle === 'matrix'
                          ? '#00FF00'
                          : themeStyle === 'blocky'
                          ? '#FF2E6C'
                          : 'secondary.main',
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {band.location}
                  </Typography>
                </Box>
              )}

              {/* Genres */}
              {band.genres && band.genres.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    mb: 4,
                  }}
                >
                  {band.genres.map((genre, i) => (
                    <Chip
                      key={i}
                      label={genre}
                      sx={{
                        bgcolor:
                          themeStyle === 'matrix'
                            ? 'transparent'
                            : themeStyle === 'blocky'
                            ? '#FFFFFF'
                            : themeStyle === 'modest'
                            ? '#f5f5f5'
                            : alpha(theme.palette.primary.main, 0.1),
                        color:
                          themeStyle === 'matrix'
                            ? '#00FF00'
                            : themeStyle === 'blocky' || themeStyle === 'modest'
                            ? '#0a0a0a'
                            : 'primary.main',
                        fontWeight: 600,
                        border:
                          themeStyle === 'matrix'
                            ? '1px solid #00FF00'
                            : themeStyle === 'blocky'
                            ? '2px solid #0a0a0a'
                            : themeStyle === 'modest'
                            ? '1px solid #e5e5e5'
                            : `1px solid ${alpha(
                                theme.palette.primary.main,
                                0.2
                              )}`,
                        boxShadow:
                          themeStyle === 'blocky'
                            ? '2px 2px 0px #0a0a0a'
                            : undefined,
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Bio */}
              {band.public_bio && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    maxWidth: 640,
                    lineHeight: 1.8,
                    fontSize: '1.1rem',
                  }}
                >
                  {band.public_bio}
                </Typography>
              )}

              {/* CTA Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  mt: 4,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Email />}
                  onClick={() => setContactOpen(true)}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    ...getPrimaryButtonStyle(),
                  }}
                >
                  Get in Touch
                </Button>
                {upcomingEvents.length > 0 && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CalendarMonth />}
                    onClick={() =>
                      document
                        .getElementById('events')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      ...getSecondaryButtonStyle(),
                    }}
                  >
                    See Shows
                  </Button>
                )}
              </Box>
            </Box>
          </Fade>

          {/* CONTENT GRID */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
              gap: 4,
              pb: 8,
            }}
          >
            {/* Main Content */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* STREAMING SECTION */}
              {/* LISTEN NOW (Streaming) */}
              {streamingLinks.length > 0 && (
                <Fade in timeout={800}>
                  <Card sx={{ ...getCardStyle(), p: 3 }}>
                    <SectionHeader
                      icon={<Headphones fontSize="small" />}
                      title="Listen Now"
                      themeStyle={themeStyle}
                    />
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1.5,
                        // ✅ Always at least 2 columns on mobile
                        gridTemplateColumns: {
                          xs: 'repeat(2, minmax(0, 1fr))',
                          sm: 'repeat(2, minmax(0, 1fr))',
                          md: 'repeat(3, minmax(0, 1fr))', // optional: more cols on larger
                        },
                      }}
                    >
                      {streamingLinks.map((link, i) => {
                        const platformColor = getPlatformColor(link.platform);
                        return (
                          <Button
                            key={i}
                            variant="outlined"
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={
                              <StreamingIcon
                                platform={link.platform}
                                size={18}
                              />
                            }
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              padding: '10px 20px',
                              textTransform: 'none',
                              width: '100%', // ✅ full width inside grid cell
                              justifyContent: 'flex-start',
                              transition:
                                'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              ...getLinkButtonStyle(platformColor),
                            }}
                          >
                            {link.platform.charAt(0).toUpperCase() +
                              link.platform.slice(1)}
                          </Button>
                        );
                      })}
                    </Box>
                  </Card>
                </Fade>
              )}

              {/* FOLLOW US (Social) */}
              {socialLinks.length > 0 && (
                <Fade in timeout={900}>
                  <Card sx={{ ...getCardStyle(), p: 3 }}>
                    <SectionHeader
                      icon={<Share fontSize="small" />}
                      title="Follow Us"
                      themeStyle={themeStyle}
                    />
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: {
                          xs: 'repeat(2, minmax(0, 1fr))',
                          sm: 'repeat(2, minmax(0, 1fr))',
                          md: 'repeat(3, minmax(0, 1fr))',
                        },
                      }}
                    >
                      {socialLinks.map((link, i) => {
                        const socialColor = getSocialColor(link.platform);
                        return (
                          <Button
                            key={i}
                            variant="outlined"
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={
                              <SocialIcon platform={link.platform} size={18} />
                            }
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              padding: '10px 18px',
                              textTransform: 'none',
                              width: '100%',
                              justifyContent: 'flex-start',
                              transition:
                                'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              ...getLinkButtonStyle(socialColor),
                            }}
                          >
                            {link.platform.charAt(0).toUpperCase() +
                              link.platform.slice(1)}
                          </Button>
                        );
                      })}
                    </Box>
                  </Card>
                </Fade>
              )}

              {/* PHOTOS SECTION */}
              {photos.length > 0 && (
                <Fade in timeout={1200}>
                  <Card sx={{ ...getCardStyle(), p: 3 }}>
                    <SectionHeader
                      icon={<PhotoLibrary fontSize="small" />}
                      title="Photos"
                      count={photos.length}
                      themeStyle={themeStyle}
                    />
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: 1.5,
                      }}
                    >
                      {photos.map((photo, i) => (
                        <Box
                          key={photo.id}
                          onClick={() => {
                            setSelectedPhotoIndex(i);
                            setPhotoViewerOpen(true);
                          }}
                          sx={{
                            position: 'relative',
                            paddingTop: '100%',
                            borderRadius:
                              themeStyle === 'blocky' || themeStyle === 'matrix'
                                ? 1
                                : 2,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border:
                              themeStyle === 'matrix'
                                ? '1px solid #00FF00'
                                : themeStyle === 'blocky'
                                ? '2px solid #0a0a0a'
                                : undefined,
                            boxShadow:
                              themeStyle === 'blocky'
                                ? '3px 3px 0px #0a0a0a'
                                : undefined,
                            '&:hover': {
                              '& img': { transform: 'scale(1.1)' },
                              '& .overlay': { opacity: 1 },
                              ...(themeStyle === 'matrix' && {
                                boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)',
                              }),
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={photo.url}
                            alt={photo.caption || `Photo ${i + 1}`}
                            loading="lazy"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition:
                                'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />
                          <Box
                            className="overlay"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background:
                                themeStyle === 'matrix'
                                  ? 'linear-gradient(to top, rgba(0,255,0,0.3) 0%, transparent 50%)'
                                  : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              display: 'flex',
                              alignItems: 'flex-end',
                              p: 1.5,
                            }}
                          >
                            {photo.caption && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color:
                                    themeStyle === 'matrix'
                                      ? '#00FF00'
                                      : '#fff',
                                  fontWeight: 500,
                                }}
                              >
                                {photo.caption}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Fade>
              )}

              {/* VIDEOS SECTION */}
              {videos.length > 0 && (
                <Fade in timeout={1400}>
                  <Card sx={{ ...getCardStyle(), p: 3 }}>
                    <SectionHeader
                      icon={<PlayArrow fontSize="small" />}
                      title="Videos"
                      themeStyle={themeStyle}
                    />
                    {videos.map((video) => (
                      <Box key={video.id}>
                        <Box
                          sx={{
                            position: 'relative',
                            paddingTop: '56.25%',
                            borderRadius:
                              themeStyle === 'blocky' || themeStyle === 'matrix'
                                ? 1
                                : 2,
                            overflow: 'hidden',
                            bgcolor: '#000',
                            border:
                              themeStyle === 'matrix'
                                ? '1px solid #00FF00'
                                : themeStyle === 'blocky'
                                ? '2px solid #0a0a0a'
                                : undefined,
                            boxShadow:
                              themeStyle === 'blocky'
                                ? '4px 4px 0px #0a0a0a'
                                : undefined,
                          }}
                        >
                          <iframe
                            src={video.embed_url}
                            title={video.title || 'Video'}
                            frameBorder={0}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                            }}
                          />
                        </Box>
                        {video.title && (
                          <Typography
                            variant="subtitle2"
                            sx={{ mt: 1.5, fontWeight: 600 }}
                          >
                            {video.title}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Card>
                </Fade>
              )}
            </Box>

            {/* Sidebar - Events */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {upcomingEvents.length > 0 && (
                <Fade in timeout={1000}>
                  <Card id="events" sx={{ ...getCardStyle(), p: 3 }}>
                    <SectionHeader
                      icon={<CalendarMonth fontSize="small" />}
                      title="Upcoming Shows"
                      count={upcomingEvents.length}
                      themeStyle={themeStyle}
                    />
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {displayEvents.map((event) => {
                        const { day, date, month, time } = formatDate(
                          event.date
                        );
                        return (
                          <Box
                            key={event.id}
                            component="button"
                            type="button"
                            onClick={() => setSelectedEvent(event)}
                            sx={{
                              textAlign: 'left',
                              width: '100%',
                              // ❌ remove this line:
                              // border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',

                              // card styles
                              display: 'flex',
                              gap: 2,
                              p: 2,
                              borderRadius:
                                themeStyle === 'blocky' ||
                                themeStyle === 'matrix'
                                  ? 1
                                  : 2,
                              bgcolor:
                                themeStyle === 'matrix'
                                  ? 'transparent'
                                  : alpha(theme.palette.background.paper, 0.5),
                              border:
                                themeStyle === 'matrix'
                                  ? '1px solid rgba(0, 255, 0, 0.3)'
                                  : themeStyle === 'blocky'
                                  ? '2px solid #0a0a0a'
                                  : `1px solid ${theme.palette.divider}`,
                              boxShadow:
                                themeStyle === 'blocky'
                                  ? '3px 3px 0px #0a0a0a'
                                  : undefined,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor:
                                  themeStyle === 'matrix'
                                    ? 'rgba(0, 255, 0, 0.05)'
                                    : alpha(theme.palette.primary.main, 0.05),
                                borderColor:
                                  themeStyle === 'matrix'
                                    ? '#00FF00'
                                    : alpha(theme.palette.primary.main, 0.3),
                                transform:
                                  themeStyle === 'blocky'
                                    ? 'translate(-2px, -2px)'
                                    : 'translateX(4px)',
                                boxShadow:
                                  themeStyle === 'blocky'
                                    ? '5px 5px 0px #0a0a0a'
                                    : themeStyle === 'matrix'
                                    ? '0 0 15px rgba(0, 255, 0, 0.2)'
                                    : undefined,
                              },
                              '&:focus-visible': {
                                outline: `2px solid ${alpha(
                                  theme.palette.primary.main,
                                  0.7
                                )}`,
                                outlineOffset: 2,
                              },
                            }}
                          >
                            {/* Date badge */}
                            <Box
                              sx={{
                                minWidth: 56,
                                textAlign: 'center',
                                p: 1,
                                borderRadius: 1.5,
                                ...getDateBadgeStyle(),
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  color:
                                    themeStyle === 'matrix'
                                      ? '#00FF00'
                                      : themeStyle === 'blocky'
                                      ? '#FF2E6C'
                                      : 'primary.main',
                                  fontSize: '0.65rem',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                {month}
                              </Typography>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 800,
                                  color: 'text.primary',
                                  lineHeight: 1,
                                }}
                              >
                                {date}
                              </Typography>
                            </Box>

                            {/* Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  mb: 0.25,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {event.title}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {event.location}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {day} • {time}
                              </Typography>

                              {event.ticket_url && (
                                <Button
                                  variant="text"
                                  size="small"
                                  href={event.ticket_url}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()} // don't open dialog if they just want tickets
                                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                  sx={{
                                    mt: 1,
                                    p: '4px 12px',
                                    borderRadius:
                                      themeStyle === 'blocky' ||
                                      themeStyle === 'matrix'
                                        ? '4px'
                                        : '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    transition: 'all 0.2s ease',
                                    ...(themeStyle === 'matrix'
                                      ? {
                                          background: 'transparent',
                                          border: '1px solid #00FF00',
                                          color: '#00FF00',
                                          '&:hover': {
                                            background: 'rgba(0, 255, 0, 0.1)',
                                            boxShadow:
                                              '0 0 10px rgba(0, 255, 0, 0.3)',
                                          },
                                        }
                                      : themeStyle === 'blocky'
                                      ? {
                                          background: '#FF2E6C',
                                          border: '2px solid #0a0a0a',
                                          color: '#FFFFFF',
                                          boxShadow: '2px 2px 0px #0a0a0a',
                                          '&:hover': {
                                            transform: 'translate(-1px, -1px)',
                                            boxShadow: '3px 3px 0px #0a0a0a',
                                          },
                                        }
                                      : themeStyle === 'modest'
                                      ? {
                                          background: '#404040',
                                          border: 'none',
                                          color: '#FFFFFF',
                                          '&:hover': {
                                            background: '#525252',
                                          },
                                        }
                                      : {
                                          background:
                                            'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)',
                                          border:
                                            '1px solid rgba(236, 72, 153, 0.3)',
                                          color: '#EC4899',
                                          '&:hover': {
                                            background:
                                              'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(236, 72, 153, 0.1) 100%)',
                                            border:
                                              '1px solid rgba(236, 72, 153, 0.5)',
                                            boxShadow:
                                              '0 4px 16px rgba(236, 72, 153, 0.25)',
                                            transform: 'translateY(-1px)',
                                          },
                                        }),
                                  }}
                                >
                                  Get Tickets
                                </Button>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    {upcomingEvents.length > 3 && (
                      <Button
                        fullWidth
                        variant="text"
                        onClick={() => setShowAllEvents(!showAllEvents)}
                        endIcon={
                          showAllEvents ? <ExpandLess /> : <ExpandMore />
                        }
                        sx={{ mt: 2 }}
                      >
                        {showAllEvents
                          ? 'Show Less'
                          : `View All ${upcomingEvents.length} Shows`}
                      </Button>
                    )}
                  </Card>
                </Fade>
              )}
            </Box>
          </Box>

          {/* FOOTER */}
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Powered by{' '}
              <Box
                component="a"
                href="https://amplee.app"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontWeight: 700,
                  background:
                    themeStyle === 'matrix'
                      ? '#00FF00'
                      : themeStyle === 'blocky'
                      ? 'linear-gradient(135deg, #FF2E6C, #00D4FF)'
                      : themeStyle === 'modest'
                      ? '#525252'
                      : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Amplee
              </Box>
            </Typography>
          </Box>
        </Container>

        {/* CONTACT DIALOG */}
        <Dialog
          open={contactOpen}
          onClose={() => setContactOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor:
                themeStyle === 'matrix'
                  ? 'rgba(0, 0, 0, 0.95)'
                  : alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)',
              border:
                themeStyle === 'matrix'
                  ? '1px solid #00FF00'
                  : themeStyle === 'blocky'
                  ? '2px solid #0a0a0a'
                  : `1px solid ${theme.palette.divider}`,
              boxShadow:
                themeStyle === 'matrix'
                  ? '0 0 30px rgba(0, 255, 0, 0.2)'
                  : themeStyle === 'blocky'
                  ? '8px 8px 0px #0a0a0a'
                  : undefined,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 1,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Contact {band.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Send a message directly to the band
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setContactOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
            >
              <TextField
                label="Your Name"
                fullWidth
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                label="Your Email"
                type="email"
                fullWidth
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                label="Message"
                multiline
                rows={4}
                fullWidth
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                placeholder={`What would you like to say to ${band.name}?`}
                variant="outlined"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => setContactOpen(false)}
              sx={{ color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleContactSubmit}
              startIcon={<Send />}
              sx={{
                ...getPrimaryButtonStyle(),
              }}
            >
              Send Message
            </Button>
          </DialogActions>
        </Dialog>

        {/* PHOTO VIEWER */}
        <Dialog
          open={photoViewerOpen}
          onClose={() => setPhotoViewerOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { bgcolor: 'transparent', boxShadow: 'none' },
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setPhotoViewerOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor:
                  themeStyle === 'matrix'
                    ? 'rgba(0,0,0,0.8)'
                    : 'rgba(0,0,0,0.6)',
                color: themeStyle === 'matrix' ? '#00FF00' : '#fff',
                border:
                  themeStyle === 'matrix' ? '1px solid #00FF00' : undefined,
                zIndex: 1,
                '&:hover': {
                  bgcolor:
                    themeStyle === 'matrix'
                      ? 'rgba(0,0,0,0.9)'
                      : 'rgba(0,0,0,0.8)',
                },
              }}
            >
              <Close />
            </IconButton>
            {photos[selectedPhotoIndex] && (
              <Box
                component="img"
                src={photos[selectedPhotoIndex].url}
                alt={photos[selectedPhotoIndex].caption || ''}
                sx={{
                  width: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius:
                    themeStyle === 'blocky' || themeStyle === 'matrix' ? 1 : 3,
                  border:
                    themeStyle === 'matrix'
                      ? '2px solid #00FF00'
                      : themeStyle === 'blocky'
                      ? '4px solid #0a0a0a'
                      : undefined,
                  boxShadow:
                    themeStyle === 'matrix'
                      ? '0 0 30px rgba(0, 255, 0, 0.3)'
                      : themeStyle === 'blocky'
                      ? '8px 8px 0px #0a0a0a'
                      : undefined,
                }}
              />
            )}
            {photos[selectedPhotoIndex]?.caption && (
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  mt: 2,
                  color: themeStyle === 'matrix' ? '#00FF00' : '#fff',
                  textShadow:
                    themeStyle === 'matrix'
                      ? '0 0 10px rgba(0, 255, 0, 0.5)'
                      : '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {photos[selectedPhotoIndex].caption}
              </Typography>
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                mt: 2,
              }}
            >
              <Button
                variant="contained"
                size="small"
                disabled={selectedPhotoIndex === 0}
                onClick={() => setSelectedPhotoIndex((i) => Math.max(0, i - 1))}
                sx={{
                  bgcolor:
                    themeStyle === 'matrix'
                      ? 'rgba(0,0,0,0.8)'
                      : 'rgba(255,255,255,0.15)',
                  color: themeStyle === 'matrix' ? '#00FF00' : '#fff',
                  border:
                    themeStyle === 'matrix' ? '1px solid #00FF00' : undefined,
                  backdropFilter: 'blur(8px)',
                }}
              >
                Previous
              </Button>
              <Typography
                variant="body2"
                sx={{
                  minWidth: 60,
                  textAlign: 'center',
                  color: themeStyle === 'matrix' ? '#00FF00' : '#fff',
                }}
              >
                {selectedPhotoIndex + 1} / {photos.length}
              </Typography>
              <Button
                variant="contained"
                size="small"
                disabled={selectedPhotoIndex === photos.length - 1}
                onClick={() =>
                  setSelectedPhotoIndex((i) =>
                    Math.min(photos.length - 1, i + 1)
                  )
                }
                sx={{
                  bgcolor:
                    themeStyle === 'matrix'
                      ? 'rgba(0,0,0,0.8)'
                      : 'rgba(255,255,255,0.15)',
                  color: themeStyle === 'matrix' ? '#00FF00' : '#fff',
                  border:
                    themeStyle === 'matrix' ? '1px solid #00FF00' : undefined,
                  backdropFilter: 'blur(8px)',
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Dialog>

        {/* EVENT DETAILS DIALOG */}
        {selectedEvent && (
          <Dialog
            open
            onClose={handleCloseEventDialog}
            fullWidth
            maxWidth="xs"
            PaperProps={{
              sx: {
                borderRadius: 3,
                background:
                  themeStyle === 'matrix'
                    ? 'rgba(0, 0, 0, 0.95)'
                    : alpha(theme.palette.background.paper, 0.98),
                // 👇 only ONE border declaration
                border:
                  themeStyle === 'matrix'
                    ? '1px solid #00FF00'
                    : themeStyle === 'blocky'
                    ? '2px solid #0a0a0a'
                    : `1px solid ${theme.palette.divider}`,
                boxShadow:
                  themeStyle === 'matrix'
                    ? '0 0 30px rgba(0, 255, 0, 0.4)'
                    : themeStyle === 'blocky'
                    ? '8px 8px 0px #0a0a0a'
                    : '0 24px 80px rgba(15, 23, 42, 0.9)',
              },
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 1,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {selectedEvent.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatEventDateTime(selectedEvent.date)}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleCloseEventDialog}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  mt: 1,
                }}
              >
                {selectedEvent.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn
                      sx={{
                        fontSize: 20,
                        color:
                          themeStyle === 'matrix'
                            ? '#00FF00'
                            : theme.palette.primary.main,
                      }}
                    />
                    <Typography variant="body2">
                      {selectedEvent.location}
                    </Typography>
                  </Box>
                )}

                {selectedEvent.venue && (
                  <Typography variant="body2" color="text.secondary">
                    Venue: {selectedEvent.venue}
                  </Typography>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={handleCloseEventDialog}
                sx={{ color: 'text.secondary' }}
              >
                Close
              </Button>

              {selectedEvent.ticket_url && (
                <Button
                  variant="contained"
                  href={selectedEvent.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNew />}
                  sx={{
                    ...getPrimaryButtonStyle(),
                  }}
                >
                  Get Tickets
                </Button>
              )}
            </DialogActions>
          </Dialog>
        )}

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{
              borderRadius: 2,
              bgcolor:
                snackbar.severity === 'success'
                  ? themeStyle === 'matrix'
                    ? '#00FF00'
                    : 'success.main'
                  : 'error.main',
              color:
                themeStyle === 'matrix' && snackbar.severity === 'success'
                  ? '#000'
                  : '#fff',
              '& .MuiAlert-icon': {
                color:
                  themeStyle === 'matrix' && snackbar.severity === 'success'
                    ? '#000'
                    : '#fff',
              },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
