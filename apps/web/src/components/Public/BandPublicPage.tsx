'use client';

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
import { useState } from 'react';

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

export interface BandData {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  genres?: string[];
  public_slug?: string;
  embedded_video_url?: string;
  gallery_images?: string[];
  public_theme?: BandThemeStyle;
}

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

  // Derive theme style from band / initialData
  const themeStyle: BandThemeStyle =
    (band?.public_theme as BandThemeStyle) ??
    (initialData?.band?.public_theme as BandThemeStyle) ??
    'cosmic';

  const { theme, themeMode, showAnimatedBackground, getCardStyle } =
    useBandPublicTheme(themeStyle);

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const displayEvents = showAllEvents
    ? upcomingEvents
    : upcomingEvents.slice(0, 3);

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

  const getSocialColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: '#E1306C',
      facebook: '#1877F2',
      twitter: '#1DA1F2',
      x: '#000000',
      website: theme.palette.primary.main,
      site: theme.palette.primary.main,
      linktree: '#43E660',
      homepage: theme.palette.primary.main,
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

    // TODO: wire up actual contact submission
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
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          bgcolor: 'background.default',
        }}
      >
        {showAnimatedBackground && <AnimatedBackground themeMode={themeMode} />}

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
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${alpha('#fff', 0.08)}`,
                borderRadius: '20px',
                p: 3,
                boxShadow:
                  '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
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
                  sx={
                    themeStyle === 'plain'
                      ? {
                          px: 4,
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 700,
                          textTransform: 'none',
                        }
                      : {
                          background:
                            'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '16px',
                          px: 4,
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow:
                            '0 8px 32px rgba(139, 92, 246, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '200%',
                            height: '100%',
                            background:
                              'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'left 0.5s ease',
                          },
                          '&:hover': {
                            transform: 'translateY(-3px) scale(1.02)',
                            boxShadow:
                              '0 12px 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(236, 72, 153, 0.3)',
                            '&::before': {
                              left: '100%',
                            },
                          },
                          '&:active': {
                            transform: 'translateY(-1px) scale(1)',
                          },
                        }
                  }
                >
                  Get in Touch
                </Button>
                {upcomingEvents.length > 0 && (
                  <Button
                    variant={themeStyle === 'plain' ? 'outlined' : 'outlined'}
                    size="large"
                    startIcon={<CalendarMonth />}
                    onClick={() =>
                      document
                        .getElementById('events')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    sx={
                      themeStyle === 'plain'
                        ? {
                            px: 4,
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 700,
                            textTransform: 'none',
                          }
                        : {
                            background: alpha(
                              theme.palette.background.paper,
                              0.3
                            ),
                            backdropFilter: 'blur(12px)',
                            border: `1px solid ${alpha('#34D399', 0.4)}`,
                            borderRadius: '16px',
                            color: '#34D399',
                            px: 4,
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              inset: 0,
                              background:
                                'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, transparent 50%)',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                            },
                            '&:hover': {
                              border: `1px solid ${alpha('#34D399', 0.7)}`,
                              transform: 'translateY(-3px)',
                              boxShadow:
                                '0 8px 32px rgba(52, 211, 153, 0.3), 0 0 50px rgba(52, 211, 153, 0.15)',
                              '&::before': {
                                opacity: 1,
                              },
                            },
                          }
                    }
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
                      ...getCardStyle(),
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
                              background: `linear-gradient(135deg, ${alpha(
                                platformColor,
                                0.15
                              )} 0%, ${alpha(platformColor, 0.05)} 100%)`,
                              backdropFilter: 'blur(12px)',
                              border: `1px solid ${alpha(platformColor, 0.4)}`,
                              borderRadius: '14px',
                              color: platformColor,
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              padding: '10px 20px',
                              textTransform: 'none',
                              position: 'relative',
                              overflow: 'hidden',
                              transition:
                                'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `radial-gradient(circle at 50% 0%, ${alpha(
                                  platformColor,
                                  0.3
                                )} 0%, transparent 70%)`,
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                              },
                              '&:hover': {
                                border: `1px solid ${alpha(
                                  platformColor,
                                  0.7
                                )}`,
                                transform: 'translateY(-3px)',
                                boxShadow: `0 8px 24px ${alpha(
                                  platformColor,
                                  0.35
                                )}, 0 0 40px ${alpha(platformColor, 0.2)}`,
                                '&::before': {
                                  opacity: 1,
                                },
                              },
                              '&:active': {
                                transform: 'translateY(-1px)',
                              },
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
                  <Card
                    sx={{
                      ...getCardStyle(),
                      p: 3,
                    }}
                  >
                    <SectionHeader
                      icon={<Share fontSize="small" />}
                      title="Follow Us"
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        flexWrap: 'wrap',
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
                              background: `linear-gradient(135deg, ${alpha(
                                socialColor,
                                0.12
                              )} 0%, ${alpha(socialColor, 0.04)} 100%)`,
                              backdropFilter: 'blur(12px)',
                              border: `1px solid ${alpha(socialColor, 0.35)}`,
                              borderRadius: '14px',
                              color: socialColor,
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              padding: '10px 18px',
                              textTransform: 'none',
                              position: 'relative',
                              overflow: 'hidden',
                              transition:
                                'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(135deg, ${alpha(
                                  socialColor,
                                  0.2
                                )} 0%, transparent 50%)`,
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                              },
                              '&:hover': {
                                border: `1px solid ${alpha(socialColor, 0.6)}`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 20px ${alpha(
                                  socialColor,
                                  0.3
                                )}, 0 0 30px ${alpha(socialColor, 0.15)}`,
                                color: socialColor,
                                '&::before': {
                                  opacity: 1,
                                },
                              },
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
                  <Card
                    sx={{
                      ...getCardStyle(),
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
                      ...getCardStyle(),
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
                      ...getCardStyle(),
                      p: 3,
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
                                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                  sx={{
                                    mt: 1,
                                    p: '4px 12px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background:
                                      'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)',
                                    border: '1px solid rgba(236, 72, 153, 0.3)',
                                    color: '#EC4899',
                                    textTransform: 'none',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      background:
                                        'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(236, 72, 153, 0.1) 100%)',
                                      border:
                                        '1px solid rgba(236, 72, 153, 0.5)',
                                      boxShadow:
                                        '0 4px 16px rgba(236, 72, 153, 0.25)',
                                      transform: 'translateY(-1px)',
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
              sx={
                themeStyle === 'plain'
                  ? undefined
                  : {
                      background:
                        'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
                    }
              }
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
