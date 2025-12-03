'use client';

import type { BandPageTheme } from '@/themes/publicPageThemes';
import { Box, Typography } from '@mui/material';

// ═══════════════════════════════════════════════════════════════════════════
// UPCOMING SHOWS SECTION
// Displays band's upcoming events
// ═══════════════════════════════════════════════════════════════════════════

export interface PublicShow {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  venue?: string | null;
  city?: string | null;
  ticket_url?: string | null;
}

interface UpcomingShowsSectionProps {
  shows: PublicShow[];
  theme: BandPageTheme;
  dark: boolean;
}

function formatShowDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return { month, day };
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

export function UpcomingShowsSection({
  shows,
  theme,
  dark,
}: UpcomingShowsSectionProps) {
  if (shows.length === 0) return null;

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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
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
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CalendarIcon /> Upcoming Shows
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: theme.followButtonBorder,
            fontWeight: 600,
          }}
        >
          {shows.length} show{shows.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {shows.slice(0, 5).map((show) => {
          const dateParts = formatShowDate(show.starts_at);
          const locationText =
            show.venue && show.city
              ? `${show.venue} · ${show.city}`
              : show.location || 'Venue TBA';

          return (
            <Box
              key={show.id}
              component={show.ticket_url ? 'a' : 'div'}
              href={show.ticket_url || undefined}
              target={show.ticket_url ? '_blank' : undefined}
              rel={show.ticket_url ? 'noopener noreferrer' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: 2,
                background: theme.commentBg,
                borderRadius: 1.5,
                border: `1px solid ${theme.borderColor}`,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: dark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.04)',
                  transform: 'translateX(4px)',
                  borderColor: theme.followButtonBorder,
                },
              }}
            >
              {/* Date Badge */}
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 1.5,
                  background: theme.avatarGlow,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: dark
                    ? '0 4px 20px rgba(0,0,0,0.4)'
                    : '0 4px 15px rgba(0,0,0,0.15)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {dateParts?.month || 'TBA'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {dateParts?.day ?? '?'}
                </Typography>
              </Box>

              {/* Show Details */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: theme.mainTextColor,
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
                    fontSize: 13,
                    color: theme.secondaryTextColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <LocationIcon /> {locationText}
                </Typography>
              </Box>

              {/* Arrow */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
                style={{ color: theme.secondaryTextColor, flexShrink: 0 }}
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
