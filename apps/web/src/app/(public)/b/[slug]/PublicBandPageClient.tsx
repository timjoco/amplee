'use client';

import {
  CalendarMonth,
  Check,
  Close,
  DarkMode,
  Email,
  ExpandLess,
  ExpandMore,
  Headphones,
  LightMode,
  LocationOn,
  MusicNote,
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
  createTheme,
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
  useMediaQuery,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

// ============================================
// TYPES
// ============================================
export interface BandData {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  genres?: string[];
  public_slug?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  venue?: string;
  location?: string;
  ticket_url?: string;
}

export interface StreamingLink {
  platform: string;
  url: string;
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
// MOCK DATA
// ============================================
const MOCK_BAND: BandData = {
  id: '1',
  name: 'The Midnight Echo',
  avatar_url:
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  bio: 'Indie rock band from Kansas City bringing atmospheric soundscapes and raw energy to stages across the Midwest. Formed in 2019, we blend shoegaze textures with post-punk rhythms.',
  location: 'Kansas City, MO',
  genres: ['Indie Rock', 'Shoegaze', 'Post-Punk'],
  public_slug: 'midnight-echo',
};

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Winter Showcase',
    date: '2025-01-15T20:00:00',
    venue: 'The Truman',
    location: 'Kansas City, MO',
    ticket_url: 'https://example.com/tickets',
  },
  {
    id: '2',
    title: 'New Years Eve Bash',
    date: '2024-12-31T21:00:00',
    venue: 'recordBar',
    location: 'Kansas City, MO',
    ticket_url: 'https://example.com/tickets',
  },
];

const MOCK_STREAMING: StreamingLink[] = [
  { platform: 'spotify', url: 'https://spotify.com' },
  { platform: 'apple', url: 'https://apple.com/music' },
  { platform: 'youtube', url: 'https://youtube.com' },
  { platform: 'soundcloud', url: 'https://soundcloud.com' },
];

const MOCK_PHOTOS: Photo[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop',
    caption: 'Live at The Truman',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop',
    caption: 'Festival 2024',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
    caption: 'Studio session',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
    caption: 'Opening night',
  },
];

const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Official Music Video',
  },
];

// ============================================
// STREAMING ICONS
// ============================================
const StreamingIcon: React.FC<{ platform: string; size?: number }> = ({
  platform,
  size = 24,
}) => {
  const iconStyle = { width: size, height: size };

  switch (platform.toLowerCase()) {
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M23.997 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.401-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.8.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.873-.134-2.66-.728-.587-.44-.96-1.01-1.033-1.74-.108-1.08.526-2.167 1.644-2.524.417-.134.85-.186 1.286-.238.39-.047.78-.09 1.167-.147.396-.06.676-.27.796-.67.03-.1.04-.21.04-.31v-4.35c0-.06-.01-.12-.02-.18-.04-.18-.16-.29-.33-.32-.08-.01-.15-.01-.23 0l-4.86.97c-.03.01-.07.01-.1.02-.21.04-.35.17-.4.38-.02.07-.02.14-.02.21v6.61c0 .48-.07.95-.28 1.39-.32.65-.84 1.06-1.5 1.25-.32.09-.65.14-.99.16-.98.06-1.93-.08-2.78-.66-.6-.42-1-.97-1.1-1.7-.13-1.08.5-2.17 1.63-2.57.45-.16.92-.23 1.4-.28.36-.04.72-.08 1.08-.14.48-.08.77-.35.86-.83.02-.1.02-.2.02-.3V7.23c0-.2.01-.4.05-.59.1-.48.42-.8.87-.92l6.18-1.52c.28-.07.57-.1.86-.1.43 0 .77.26.86.7.02.1.03.21.03.31v5z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.198-1.308-.198-1.332c-.01-.057-.044-.094-.09-.094m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.474-.24-2.547c0-.06-.059-.104-.12-.104m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.016-.075-.075-.135-.15-.135m.93-.132c-.09 0-.149.075-.165.165l-.195 2.789.21 2.609c.016.09.075.165.165.165.075 0 .149-.075.165-.165l.225-2.609-.225-2.789c-.016-.09-.09-.165-.165-.165m.96-.165c-.105 0-.18.075-.18.18l-.18 2.94.195 2.625c0 .105.075.18.18.18.09 0 .18-.075.18-.18l.21-2.625-.21-2.94c0-.105-.075-.18-.18-.18m.99-.165c-.105 0-.195.09-.195.195l-.165 3.09.18 2.64c0 .105.09.195.195.195.09 0 .195-.09.195-.195l.195-2.64-.195-3.09c0-.105-.105-.195-.195-.195m1.02-.135c-.12 0-.21.09-.225.21l-.15 3.195.165 2.64c.015.12.105.21.225.21.105 0 .21-.09.225-.21l.18-2.64-.18-3.195c-.015-.12-.12-.21-.225-.21m1.02-.15c-.135 0-.225.105-.24.24l-.135 3.33.15 2.64c.015.135.105.24.24.24.12 0 .225-.105.24-.24l.165-2.64-.165-3.33c-.015-.135-.12-.24-.24-.24m1.035-.165c-.15 0-.255.12-.27.27l-.12 3.48.135 2.625c.015.15.12.27.27.27.135 0 .255-.12.27-.27l.15-2.625-.15-3.48c-.015-.15-.135-.27-.27-.27m1.05-.135c-.165 0-.285.135-.3.3l-.105 3.585.12 2.61c.015.165.135.3.3.3.15 0 .285-.135.3-.3l.135-2.61-.135-3.585c-.015-.165-.15-.3-.3-.3m1.05-.12c-.18 0-.3.135-.315.315l-.09 3.69.105 2.595c.015.18.135.315.315.315.165 0 .3-.135.315-.315l.12-2.595-.12-3.69c-.015-.18-.15-.315-.315-.315m1.065-.135c-.195 0-.33.15-.345.345L12.51 14.5l.105 2.58c.015.195.15.345.345.345.18 0 .33-.15.345-.345l.12-2.58-.12-3.75c-.015-.195-.165-.345-.345-.345m1.2.6c0-.21-.165-.36-.36-.36s-.345.15-.36.36l-.075 3.165.09 2.565c.015.21.165.36.36.36.18 0 .345-.15.36-.36l.09-2.565-.105-3.165m.78-1.215c-.225 0-.39.165-.405.39l-.075 3.975.09 2.535c.015.225.18.39.405.39.21 0 .39-.165.405-.39l.105-2.535-.105-3.975c-.015-.225-.195-.39-.405-.39m1.2-.135c-.24 0-.42.18-.435.42l-.06 4.08.075 2.52c.015.24.195.42.435.42.225 0 .42-.18.435-.42l.09-2.52-.09-4.08c-.015-.24-.21-.42-.435-.42m1.17.015c-.24 0-.435.195-.435.435v.015l-.045 4.065.06 2.505c0 .24.195.435.435.435.225 0 .435-.195.45-.435l.075-2.505-.075-4.08c-.015-.24-.225-.435-.45-.435m1.2.135c-.255 0-.45.195-.465.45l-.045 3.945.06 2.49c.015.255.21.45.465.45.24 0 .45-.195.465-.45l.075-2.49-.075-3.945c-.015-.255-.225-.45-.465-.45m1.2.18c-.27 0-.48.21-.48.465l-.03 3.75.045 2.475c.015.27.21.48.48.48.255 0 .48-.21.48-.48l.06-2.475-.06-3.75c0-.255-.225-.465-.48-.465m1.215.24c-.285 0-.495.225-.51.495l-.015 3.555.03 2.46c.015.285.225.51.51.51.27 0 .495-.225.51-.51l.045-2.46-.045-3.555c-.015-.27-.24-.495-.51-.495m1.215.3c-.285 0-.525.24-.525.525v3.285l.015 2.445c0 .285.24.525.525.525.27 0 .525-.24.54-.525l.03-2.445-.03-3.285c-.015-.285-.255-.525-.54-.525m1.815 2.85c-.225-.135-.45-.21-.705-.21-.135 0-.27.015-.405.06-.135-.885-.45-1.695-.915-2.37-.9-1.305-2.37-2.145-4.005-2.205-.405-.015-.51-.03-.765-.03H11.4c-.255 0-.33.03-.57.03-.21.01-.405.015-.585.045V6.06c0-.21-.18-.39-.39-.39-.165 0-.315.105-.375.255l-.015.045v7.305c0 .06.015.105.03.15.015.06.06.12.12.165.09.06.195.09.3.09h8.385c.915 0 1.68-.75 1.68-1.665s-.765-1.665-1.68-1.665" />
        </svg>
      );
    case 'bandcamp':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
        </svg>
      );
    default:
      return <MusicNote style={iconStyle} />;
  }
};

// ============================================
// ANIMATED BACKGROUND COMPONENT
// ============================================
const AnimatedBackground: React.FC<{ themeMode: 'light' | 'dark' }> = ({
  themeMode,
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        background:
          themeMode === 'dark'
            ? 'radial-gradient(ellipse at 20% 0%, rgba(88, 101, 242, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(235, 69, 158, 0.1) 0%, transparent 50%), #0e0e10'
            : 'radial-gradient(ellipse at 20% 0%, rgba(88, 101, 242, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(235, 69, 158, 0.06) 0%, transparent 50%), #f8f9fa',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            themeMode === 'dark'
              ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
              : 'none',
          opacity: 0.03,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Floating orbs */}
      {[...Array(3)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 200, md: 400 },
            height: { xs: 200, md: 400 },
            borderRadius: '50%',
            background:
              i === 0
                ? 'radial-gradient(circle, rgba(88, 101, 242, 0.2) 0%, transparent 70%)'
                : i === 1
                ? 'radial-gradient(circle, rgba(235, 69, 158, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(87, 242, 135, 0.1) 0%, transparent 70%)',
            top: i === 0 ? '-10%' : i === 1 ? '60%' : '30%',
            left: i === 0 ? '60%' : i === 1 ? '-10%' : '80%',
            animation: `float${i} ${20 + i * 5}s ease-in-out infinite`,
            '@keyframes float0': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(-30px, 20px) scale(1.1)' },
            },
            '@keyframes float1': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(20px, -30px) scale(1.05)' },
            },
            '@keyframes float2': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(-20px, -20px) scale(0.95)' },
            },
            filter: 'blur(60px)',
          }}
        />
      ))}
    </Box>
  );
};

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  count?: number;
}> = ({ icon, title, count }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      mb: 3,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '10px',
        background:
          'linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(235, 69, 158, 0.2))',
        color: 'primary.main',
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: 'text.primary',
      }}
    >
      {title}
    </Typography>
    {count !== undefined && (
      <Chip
        label={count}
        size="small"
        sx={{
          height: 22,
          fontSize: '0.75rem',
          fontWeight: 600,
          bgcolor: 'rgba(88, 101, 242, 0.15)',
          color: 'primary.main',
        }}
      />
    )}
  </Box>
);

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
  };
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function BandPublicPage({
  slug,
  initialData,
}: BandPublicPageProps) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [band, setBand] = useState<BandData | null>(
    initialData?.band ?? MOCK_BAND
  );
  const [events] = useState<Event[]>(initialData?.events ?? MOCK_EVENTS);
  const [streamingLinks] = useState<StreamingLink[]>(
    initialData?.streamingLinks ?? MOCK_STREAMING
  );
  const [photos] = useState<Photo[]>(initialData?.photos ?? MOCK_PHOTOS);
  const [videos] = useState<Video[]>(initialData?.videos ?? MOCK_VIDEOS);
  const [loading] = useState(!initialData);

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

  useEffect(() => {
    setThemeMode(prefersDarkMode ? 'dark' : 'light');
  }, [prefersDarkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: '#5865F2',
          },
          secondary: {
            main: '#EB459E',
          },
          success: {
            main: '#57F287',
          },
          warning: {
            main: '#FEE75C',
          },
          background: {
            default: themeMode === 'light' ? '#f8f9fa' : '#0e0e10',
            paper: themeMode === 'light' ? '#ffffff' : '#18181b',
          },
          text: {
            primary: themeMode === 'light' ? '#1a1a1a' : '#ffffff',
            secondary: themeMode === 'light' ? '#6b7280' : '#a1a1aa',
          },
          divider:
            themeMode === 'light'
              ? 'rgba(0,0,0,0.06)'
              : 'rgba(255,255,255,0.06)',
        },
        typography: {
          fontFamily:
            '"DM Sans", "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif',
          h1: {
            fontWeight: 800,
            letterSpacing: '-0.03em',
          },
          h2: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
          },
          h3: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: '0.9rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(88, 101, 242, 0.3)',
                  transform: 'translateY(-2px)',
                },
              },
              outlined: {
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-1px)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderRadius: 16,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
                borderRadius: 8,
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 20,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                },
              },
            },
          },
        },
      }),
    [themeMode]
  );

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

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      spotify: '#1DB954',
      apple: '#FA2D48',
      youtube: '#FF0000',
      soundcloud: '#FF5500',
      bandcamp: '#1DA0C3',
    };
    return colors[platform.toLowerCase()] || theme.palette.primary.main;
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error',
      });
      return;
    }

    setSnackbar({
      open: true,
      message: 'Message sent successfully!',
      severity: 'success',
    });
    setContactOpen(false);
    setContactForm({ name: '', email: '', message: '' });
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

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const displayEvents = showAllEvents
    ? upcomingEvents
    : upcomingEvents.slice(0, 3);

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
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        `}
      </style>
      <Box sx={{ minHeight: '100vh', position: 'relative' }}>
        <AnimatedBackground themeMode={themeMode} />

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
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(12px)',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.background.paper, 0.95),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? <Check color="success" /> : <Share />}
            </IconButton>
          </Tooltip>
          <Tooltip
            title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
          >
            <IconButton
              onClick={() =>
                setThemeMode(themeMode === 'light' ? 'dark' : 'light')
              }
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(12px)',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.background.paper, 0.95),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {themeMode === 'light' ? <DarkMode /> : <LightMode />}
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
              <Box
                sx={{
                  position: 'relative',
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: 160, md: 200 },
                    height: { xs: 160, md: 200 },
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5865F2, #EB459E)',
                    filter: 'blur(40px)',
                    opacity: 0.4,
                  }}
                />
                <Avatar
                  src={band.avatar_url}
                  alt={band.name}
                  sx={{
                    width: { xs: 140, md: 180 },
                    height: { xs: 140, md: 180 },
                    border: `4px solid ${alpha(
                      theme.palette.background.paper,
                      0.9
                    )}`,
                    boxShadow: `0 20px 60px ${alpha('#000', 0.3)}`,
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
                    bgcolor: '#57F287',
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: '0 0 12px rgba(87, 242, 135, 0.5)',
                  }}
                />
              </Box>

              {/* Band name */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  color: 'text.primary',
                  mb: 1.5,
                  background:
                    themeMode === 'dark'
                      ? 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                      : 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${theme.palette.divider}`,
                    mb: 3,
                  }}
                >
                  <LocationOn sx={{ fontSize: 18, color: 'secondary.main' }} />
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
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        fontWeight: 600,
                        border: `1px solid ${alpha(
                          theme.palette.primary.main,
                          0.2
                        )}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                        },
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Bio */}
              {band.bio && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    maxWidth: 640,
                    lineHeight: 1.8,
                    fontSize: '1.1rem',
                  }}
                >
                  {band.bio}
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
                    background:
                      'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
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
                      borderColor: alpha(theme.palette.text.primary, 0.2),
                      color: 'text.primary',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
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
              {streamingLinks.length > 0 && (
                <Fade in timeout={800}>
                  <Card
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.7),
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${theme.palette.divider}`,
                      p: 3,
                    }}
                  >
                    <SectionHeader
                      icon={<Headphones fontSize="small" />}
                      title="Listen Now"
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      {streamingLinks.map((link, i) => (
                        <Button
                          key={i}
                          variant="contained"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={
                            <StreamingIcon platform={link.platform} size={18} />
                          }
                          sx={{
                            bgcolor: getPlatformColor(link.platform),
                            color: '#fff',
                            '&:hover': {
                              bgcolor: getPlatformColor(link.platform),
                              filter: 'brightness(1.15)',
                              boxShadow: `0 8px 24px ${alpha(
                                getPlatformColor(link.platform),
                                0.4
                              )}`,
                            },
                          }}
                        >
                          {link.platform.charAt(0).toUpperCase() +
                            link.platform.slice(1)}
                        </Button>
                      ))}
                    </Box>
                  </Card>
                </Fade>
              )}

              {/* PHOTOS SECTION */}
              {photos.length > 0 && (
                <Fade in timeout={1200}>
                  <Card
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.7),
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${theme.palette.divider}`,
                      p: 3,
                    }}
                  >
                    <SectionHeader
                      icon={<PhotoLibrary fontSize="small" />}
                      title="Photos"
                      count={photos.length}
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
                            borderRadius: 2,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            '&:hover': {
                              '& img': { transform: 'scale(1.1)' },
                              '& .overlay': { opacity: 1 },
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
                                'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
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
                                sx={{ color: '#fff', fontWeight: 500 }}
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
                  <Card
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.7),
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${theme.palette.divider}`,
                      p: 3,
                    }}
                  >
                    <SectionHeader
                      icon={<PlayArrow fontSize="small" />}
                      title="Videos"
                    />
                    {videos.map((video) => (
                      <Box key={video.id}>
                        <Box
                          sx={{
                            position: 'relative',
                            paddingTop: '56.25%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: '#000',
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
                  <Card
                    id="events"
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.7),
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${theme.palette.divider}`,
                      p: 3,
                      position: { lg: 'sticky' },
                      top: { lg: 24 },
                    }}
                  >
                    <SectionHeader
                      icon={<CalendarMonth fontSize="small" />}
                      title="Upcoming Shows"
                      count={upcomingEvents.length}
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
                            sx={{
                              display: 'flex',
                              gap: 2,
                              p: 2,
                              borderRadius: 2,
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.5
                              ),
                              border: `1px solid ${theme.palette.divider}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.05
                                ),
                                borderColor: alpha(
                                  theme.palette.primary.main,
                                  0.3
                                ),
                                transform: 'translateX(4px)',
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
                                background:
                                  'linear-gradient(135deg, rgba(88, 101, 242, 0.15), rgba(235, 69, 158, 0.1))',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  color: 'primary.main',
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
                                {event.venue}
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
                                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                  sx={{
                                    mt: 1,
                                    p: 0,
                                    minWidth: 'auto',
                                    fontSize: '0.75rem',
                                    color: 'secondary.main',
                                    '&:hover': {
                                      bgcolor: 'transparent',
                                      textDecoration: 'underline',
                                    },
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
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
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
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.divider}`,
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
                background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
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
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                zIndex: 1,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
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
                  borderRadius: 3,
                }}
              />
            )}
            {photos[selectedPhotoIndex]?.caption && (
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  mt: 2,
                  color: '#fff',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
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
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Previous
              </Button>
              <Typography
                variant="body2"
                color="#fff"
                sx={{ minWidth: 60, textAlign: 'center' }}
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
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Dialog>

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
                snackbar.severity === 'success' ? 'success.main' : 'error.main',
              color: '#fff',
              '& .MuiAlert-icon': { color: '#fff' },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
