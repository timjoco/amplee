// components/Public/PublicBandPageClient.tsx
'use client';

import { THEMES, type ThemeName } from '@/themes/publicPageThemes';
import React, { useState } from 'react';

type StreamingLink = {
  url: string;
  type: string | null;
};

type PublicShow = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  venue?: string | null;
  city?: string | null;
  ticket_url?: string | null;
};

interface PublicBandPageClientProps {
  initialTheme: ThemeName;
  band: {
    name: string;
    bio: string | null;
    location: string | null;
    avatarSrc: string | null;
    isPremium: boolean;
    streamingLinks: StreamingLink[];
  };
  shows: PublicShow[];
  onContactSubmit: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
}

// ───────────────────────────── Icons (same as your mock) ────────────────────

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const BandcampIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
  </svg>
);

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

// ───────────────────────── Premium Backgrounds (same as your mock) ──────────
// (I’m not rewriting all of them here to save space, but you can paste your
// SynthwaveBackground, NeonCityBackground, HolographicBackground, AuroraBackground,
// VaporwaveBackground, GlitchBackground exactly as-is above.)

// Helper
const getLinkIcon = (type: string | null) => {
  const key = (type || '').toLowerCase();
  switch (key) {
    case 'spotify':
      return <SpotifyIcon />;
    case 'apple':
    case 'applemusic':
    case 'apple_music':
      return <AppleIcon />;
    case 'instagram':
      return <InstagramIcon />;
    case 'youtube':
    case 'youtube_music':
      return <YouTubeIcon />;
    case 'bandcamp':
      return <BandcampIcon />;
    case 'twitter':
    case 'x':
      return <TwitterIcon />;
    default:
      return <LinkIcon />;
  }
};

function formatShowDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    full: d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
  };
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PublicBandPageClient({
  initialTheme,
  band,
  shows,
  onContactSubmit,
}: PublicBandPageClientProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeName>(initialTheme);
  const [message, setMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const theme = THEMES[activeTheme];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !message.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in your email and message');
      return;
    }

    setStatus('loading');
    const formData = new FormData();
    formData.append('name', contactName);
    formData.append('email', email);
    formData.append('message', message);

    try {
      const res = await onContactSubmit(formData);
      if (res.success) {
        setStatus('success');
        setContactName('');
        setEmail('');
        setMessage('');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Failed to send message');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  const renderBackground = () => {
    const special = (theme as any).special as
      | 'synthwave'
      | 'neonCity'
      | 'holographic'
      | 'aurora'
      | 'vaporwave'
      | 'glitch'
      | null;

    switch (special) {
      // return your actual background components here:
      // case 'synthwave': return <SynthwaveBackground />;
      // ...
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        position: 'relative',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
      }}
    >
      {renderBackground()}

      {/* Noise overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.03,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 720,
          margin: '0 auto',
          padding: '24px 20px',
        }}
      >
        {/* Theme picker toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => setShowThemePicker((v) => !v)}
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 20,
              padding: '8px 20px',
              color: theme.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backdropFilter: 'blur(20px)',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: theme.avatarRing,
              }}
            />
            {theme.name}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              width="16"
              height="16"
              style={{
                transform: showThemePicker ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>

        {/* Theme picker dropdown */}
        {showThemePicker && (
          <div
            style={{
              background: theme.cardBg,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Free themes */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Free Themes
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {Object.entries(THEMES)
                .filter(([_, t]) => !t.premium)
                .map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTheme(key as ThemeName);
                      setShowThemePicker(false);
                    }}
                    style={{
                      background:
                        key === activeTheme
                          ? t.accent
                          : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${
                        key === activeTheme ? t.accent : 'transparent'
                      }`,
                      borderRadius: 10,
                      padding: '10px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: t.avatarRing,
                        margin: '0 auto 6px',
                      }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          key === activeTheme
                            ? t.accent === '#fff'
                              ? '#000'
                              : '#fff'
                            : theme.text,
                      }}
                    >
                      {t.name}
                    </div>
                  </button>
                ))}
            </div>

            {/* Premium themes */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: '#fbbf24' }}>
                <CrownIcon />
              </span>
              Premium Themes
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {Object.entries(THEMES)
                .filter(([_, t]) => t.premium)
                .map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => {
                      // if you want to lock to premium bands:
                      // if (!band.isPremium) return;
                      setActiveTheme(key as ThemeName);
                      setShowThemePicker(false);
                    }}
                    style={{
                      background:
                        key === activeTheme
                          ? t.accent
                          : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${
                        key === activeTheme ? t.accent : 'rgba(251,191,36,0.3)'
                      }`,
                      borderRadius: 10,
                      padding: '10px 8px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      opacity: !band.isPremium && key !== activeTheme ? 0.6 : 1,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        color: '#fbbf24',
                      }}
                    >
                      <CrownIcon />
                    </div>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: t.avatarRing,
                        margin: '0 auto 6px',
                      }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          key === activeTheme
                            ? t.accent === '#fff' ||
                              t.accent === '#00ffff' ||
                              t.accent === '#00ff41'
                              ? '#000'
                              : '#fff'
                            : theme.text,
                      }}
                    >
                      {t.name}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Hero */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                padding: 4,
                background: theme.avatarRing,
                boxShadow: `0 0 40px ${theme.accentGlow}`,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: theme.cardBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontWeight: 900,
                  color: theme.text,
                }}
              >
                {band.avatarSrc ? (
                  // if you want real <Image>, can swap to Next Image in server/client split
                  <img
                    src={band.avatarSrc}
                    alt={band.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  getInitials(band.name)
                )}
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#22c55e',
                border: `3px solid ${theme.cardBg}`,
                boxShadow: '0 0 10px rgba(34,197,94,0.5)',
              }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: theme.text,
                margin: 0,
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              {band.name}
            </h1>
            <p
              style={{
                fontSize: 15,
                color: theme.textMuted,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {band.bio || 'Welcome to our page!'}
            </p>
            {band.location && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 12,
                  padding: '6px 12px',
                  background: `${theme.accent}22`,
                  borderRadius: 20,
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <LocationIcon />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.text,
                  }}
                >
                  {band.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Streaming links */}
        {band.streamingLinks.length > 0 && (
          <div
            style={{
              background: theme.cardBg,
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              border: `1px solid ${theme.cardBorder}`,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: theme.textMuted,
                margin: 0,
                marginBottom: 16,
              }}
            >
              Listen & Follow
            </h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {band.streamingLinks.map((link, idx) => (
                <a
                  key={`${link.url}-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${theme.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.text,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.background = theme.accent;
                    e.currentTarget.style.boxShadow = `0 10px 30px ${theme.accentGlow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {getLinkIcon(link.type)}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming shows */}
        {shows.length > 0 && (
          <div
            style={{
              background: theme.cardBg,
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              border: `1px solid ${theme.cardBorder}`,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: theme.textMuted,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CalendarIcon /> Upcoming Shows
              </h2>
              <span
                style={{
                  fontSize: 12,
                  color: theme.accent,
                  fontWeight: 600,
                }}
              >
                {shows.length} show{shows.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {shows.map((show) => {
                const date = formatShowDate(show.starts_at);
                return (
                  <div
                    key={show.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 16,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 12,
                      border: `1px solid rgba(255,255,255,0.05)`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = theme.cardBorder;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Date badge */}
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${theme.accent}, ${theme.cardBorder})`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 4px 20px ${theme.accentGlow}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: 1,
                          color: 'rgba(255,255,255,0.9)',
                        }}
                      >
                        {date?.month ?? 'TBA'}
                      </span>
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: '#fff',
                          lineHeight: 1,
                        }}
                      >
                        {date?.day ?? '?'}
                      </span>
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: theme.text,
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {show.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.textMuted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <LocationIcon />{' '}
                        {show.venue && show.city
                          ? `${show.venue} · ${show.city}`
                          : show.location || 'Venue TBA'}
                      </div>
                    </div>

                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="20"
                      height="20"
                      style={{ color: theme.textMuted }}
                    >
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact */}
        <div
          style={{
            background: theme.cardBg,
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            border: `1px solid ${theme.cardBorder}`,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              color: theme.textMuted,
              margin: 0,
              marginBottom: 8,
            }}
          >
            ✉️ Contact the Band
          </h2>
          <p
            style={{
              fontSize: 14,
              color: theme.text,
              margin: 0,
              marginBottom: 16,
            }}
          >
            Got a question, booking inquiry, or just want to say hi? Send us a
            message!
          </p>

          {status === 'success' ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: `2px solid ${theme.cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={theme.accent}
                  width="32"
                  height="32"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.text,
                  marginBottom: 4,
                }}
              >
                Message Sent!
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: theme.textMuted,
                }}
              >
                {band.name} will get back to you soon.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: 10,
                      padding: '12px 16px',
                      color: theme.text,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Your email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: 10,
                      padding: '12px 16px',
                      color: theme.text,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
                <textarea
                  placeholder="Your message... *"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${theme.cardBorder}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    color: theme.text,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: 100,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              {status === 'error' && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#ef4444',
                    marginBottom: 12,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: theme.textMuted,
                    margin: 0,
                    opacity: 0.7,
                  }}
                >
                  We typically respond within 48 hours
                </p>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    background: theme.accent,
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 28px',
                    color:
                      theme.accent === '#fff' ||
                      theme.accent === '#00ffff' ||
                      theme.accent === '#00ff41'
                        ? '#000'
                        : '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                    opacity: status === 'loading' ? 0.7 : 1,
                  }}
                >
                  <SendIcon />
                  {status === 'loading' ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            padding: '24px 0',
            borderTop: `1px solid ${theme.cardBorder}`,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: theme.textMuted,
              margin: 0,
            }}
          >
            Powered by{' '}
            <span
              style={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Amplee
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        * {
          box-sizing: border-box;
        }

        input::placeholder, textarea::placeholder {
          color: rgba(148, 163, 184, 0.6);
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}
