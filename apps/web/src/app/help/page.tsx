export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import { Box, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';

export const metadata = {
  title: 'Help Center • Amplee',
  description: 'Learn how to use Amplee to organize your band',
};

const colors = {
  bg: {
    primary: '#0a0a0f',
    secondary: '#101018',
    tertiary: '#1a1a25',
  },
  text: {
    primary: '#E8E6F0',
    secondary: '#9CA3AF',
    muted: '#5a5a6a',
  },
  // Metroid Fusion inspired
  pink: {
    main: '#ff6eb4',
    light: '#ff9fcf',
    glow: 'rgba(255, 110, 180, 0.4)',
  },
  green: {
    main: '#39ff85',
    light: '#7affab',
    glow: 'rgba(57, 255, 133, 0.4)',
  },
  accent: {
    green: '#39ff85',
    pink: '#ff6eb4',
    blue: '#38bdf8',
    yellow: '#f59e0b',
  },
};

// Map nodes - position them like a metroidvania map
const nodes = [
  {
    id: 'bands',
    title: 'Bands',
    subtitle: 'Start here',
    href: '/help/bands',
    icon: <GroupsIcon sx={{ fontSize: 32 }} />,
    color: colors.pink.main,
    available: true,
    x: 50, // percentage from left
    y: 25, // percentage from top
    connections: ['events', 'proposals'],
  },
  {
    id: 'events',
    title: 'Events',
    subtitle: 'Shows & practices',
    href: '/help/events',
    icon: <CalendarTodayIcon sx={{ fontSize: 32 }} />,
    color: colors.green.main,
    available: false,
    x: 25,
    y: 50,
    connections: ['setlists', 'rollcall'],
  },
  {
    id: 'proposals',
    title: 'Proposals',
    subtitle: 'Vote on gigs',
    href: '/help/proposals',
    icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
    color: colors.green.main,
    available: true,
    x: 75,
    y: 50,
    connections: [],
  },
  {
    id: 'setlists',
    title: 'Setlists',
    subtitle: 'Songs & order',
    href: '/help/setlists',
    icon: <LibraryMusicIcon sx={{ fontSize: 32 }} />,
    color: colors.pink.main,
    available: false,
    x: 15,
    y: 78,
    connections: [],
  },
  {
    id: 'rollcall',
    title: 'Roll Call',
    subtitle: 'Who\'s in?',
    href: '/help/roll-call',
    icon: <PeopleIcon sx={{ fontSize: 32 }} />,
    color: colors.pink.main,
    available: false,
    x: 45,
    y: 78,
    connections: [],
  },
];

export default function HelpCenterPage() {
  return (
    <Box
      sx={{
        bgcolor: colors.bg.primary,
        color: colors.text.primary,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Map Area */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          // Grid background - Metroid Fusion style
          backgroundImage: `
            linear-gradient(rgba(255, 110, 180, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57, 255, 133, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      >
        {/* Fog/atmosphere effect - Metroid Fusion style */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 50% 20%, rgba(255, 110, 180, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 70%, rgba(57, 255, 133, 0.08) 0%, transparent 45%),
              radial-gradient(ellipse at 80% 60%, rgba(57, 255, 133, 0.06) 0%, transparent 40%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Title */}
        <Box
          sx={{
            textAlign: 'center',
            pt: { xs: 4, md: 6 },
            pb: { xs: 2, md: 3 },
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '0.75rem', md: '0.85rem' },
              fontWeight: 700,
              color: colors.pink.main,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              mb: 1,
            }}
          >
            Help Center
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '2.75rem' },
              color: colors.text.primary,
              letterSpacing: '-0.02em',
            }}
          >
            Choose Your Path
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: colors.text.secondary,
              mt: 1,
            }}
          >
            Click a node to explore
          </Typography>
        </Box>

        {/* Map Container */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              position: 'relative',
              height: { xs: '500px', md: '550px' },
              mt: { xs: 2, md: 4 },
            }}
          >
            {/* Connection Lines - SVG */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.pink.main} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={colors.pink.main} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.green.main} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={colors.green.main} stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Bands -> Events */}
              <line
                x1="50%"
                y1="25%"
                x2="25%"
                y2="50%"
                stroke="url(#pinkGradient)"
                strokeWidth="3"
                strokeDasharray="6 6"
                filter="url(#glow)"
              />
              {/* Bands -> Proposals */}
              <line
                x1="50%"
                y1="25%"
                x2="75%"
                y2="50%"
                stroke="url(#pinkGradient)"
                strokeWidth="3"
                strokeDasharray="6 6"
                filter="url(#glow)"
              />
              {/* Events -> Setlists */}
              <line
                x1="25%"
                y1="50%"
                x2="15%"
                y2="78%"
                stroke={colors.green.main}
                strokeWidth="2"
                strokeDasharray="4 6"
                opacity="0.25"
              />
              {/* Events -> Roll Call */}
              <line
                x1="25%"
                y1="50%"
                x2="45%"
                y2="78%"
                stroke={colors.green.main}
                strokeWidth="2"
                strokeDasharray="4 6"
                opacity="0.25"
              />
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <MapNode key={node.id} {...node} />
            ))}
          </Box>
        </Container>

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: 16, md: 24 },
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 3,
            bgcolor: 'rgba(10, 10, 15, 0.95)',
            border: `1px solid ${colors.pink.main}30`,
            borderRadius: 1,
            px: 3,
            py: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '2px',
                bgcolor: colors.pink.main,
                boxShadow: `0 0 10px ${colors.pink.glow}`,
              }}
            />
            <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
              Unlocked
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '2px',
                bgcolor: colors.green.main,
                opacity: 0.4,
              }}
            />
            <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
              Locked
            </Typography>
          </Stack>
        </Box>
      </Box>

      <SiteFooter />
    </Box>
  );
}

function MapNode({
  id,
  title,
  subtitle,
  href,
  icon,
  color,
  available,
  x,
  y,
}: {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
  x: number;
  y: number;
  connections?: string[];
}) {
  const nodeContent = (
    <Box
      sx={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        cursor: available ? 'pointer' : 'default',
        transition: 'transform 0.2s ease',
        '&:hover': available
          ? {
              transform: 'translate(-50%, -50%) scale(1.08)',
            }
          : {},
      }}
    >
      {/* Glow ring for available nodes */}
      {available && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.5, transform: 'translate(-50%, -50%) scale(1)' },
              '50%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1)' },
            },
          }}
        />
      )}

      {/* Node circle */}
      <Box
        sx={{
          width: { xs: 70, md: 80 },
          height: { xs: 70, md: 80 },
          borderRadius: '50%',
          bgcolor: available ? colors.bg.secondary : colors.bg.tertiary,
          border: `3px solid ${available ? color : colors.text.muted}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: available
            ? `0 0 20px ${color}40, inset 0 0 20px ${color}10`
            : 'none',
          opacity: available ? 1 : 0.5,
          mx: 'auto',
        }}
      >
        <Box sx={{ color: available ? color : colors.text.muted }}>
          {available ? icon : <LockIcon sx={{ fontSize: 28 }} />}
        </Box>
      </Box>

      {/* Label */}
      <Box sx={{ mt: 1.5 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            color: available ? colors.text.primary : colors.text.muted,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '0.75rem', md: '0.8rem' },
            color: available ? colors.text.secondary : colors.text.muted,
            opacity: available ? 1 : 0.7,
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );

  if (!available) {
    return nodeContent;
  }

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {nodeContent}
    </Link>
  );
}
