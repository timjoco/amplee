'use client';

import type { BandPageTheme } from '@/themes/publicPageThemes';
import { Box, Typography } from '@mui/material';

// ═══════════════════════════════════════════════════════════════════════════
// STREAMING & SOCIAL LINK ICONS
// ═══════════════════════════════════════════════════════════════════════════

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function AppleMusicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function BandcampIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function SoundCloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.276c-.009.06-.052.1-.1.1-.05 0-.093-.04-.1-.1l-.191 1.025.191.979c.007.058.05.098.1.098.048 0 .091-.04.1-.098l.215-.979-.215-1.025zm1.79-1.275c-.057 0-.104.052-.11.114l-.204 2.058.204 2.01c.006.063.053.112.11.112.054 0 .1-.05.107-.112l.234-2.01-.234-2.058c-.007-.063-.053-.114-.107-.114zM21.38 12.615c-.347 0-.678.062-.983.176-.204-2.308-2.145-4.126-4.53-4.126-.555 0-1.094.102-1.594.29-.187.07-.237.14-.238.28v8.17c.001.143.104.263.244.28h7.101c1.447 0 2.62-1.136 2.62-2.535s-1.173-2.535-2.62-2.535z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}

// Helper to get the right icon for a link type
function getLinkIcon(type: string | null | undefined) {
  const key = (type || '').toLowerCase();

  switch (key) {
    case 'spotify':
      return <SpotifyIcon />;
    case 'apple':
    case 'applemusic':
    case 'apple_music':
      return <AppleMusicIcon />;
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
    case 'facebook':
      return <FacebookIcon />;
    case 'tiktok':
      return <TikTokIcon />;
    case 'soundcloud':
      return <SoundCloudIcon />;
    default:
      return <LinkIcon />;
  }
}

// Streaming links section component
interface StreamingLink {
  url: string;
  type: string | null;
  label?: string | null;
}

interface StreamingLinksSectionProps {
  links: StreamingLink[];
  theme: BandPageTheme;
  dark: boolean;
}

export function StreamingLinksSection({
  links,
  theme,
  dark,
}: StreamingLinksSectionProps) {
  if (links.length === 0) return null;

  return (
    <Box
      sx={{
        background: theme.showBg,
        backdropFilter: 'blur(20px)',
        borderRadius: 2.5,
        border: `1px solid ${theme.borderColor}`,
        padding: 2.5,
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: theme.secondaryTextColor,
          margin: 0,
          mb: 2,
        }}
      >
        Listen & Follow
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {links.map((link, idx) => (
          <Box
            key={`${link.url}-${idx}`}
            component="a"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              width: 56,
              height: 56,
              borderRadius: 1.75,
              background: theme.followButtonBg,
              border: `1px solid ${theme.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.followButtonTextColor,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px) scale(1.05)',
                background: theme.followButtonBorder,
                boxShadow: dark
                  ? '0 10px 30px rgba(0,0,0,0.5)'
                  : '0 10px 25px rgba(0,0,0,0.15)',
              },
            }}
          >
            {getLinkIcon(link.type)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
