export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Library • Amplee Help Center',
  description: 'Learn how to manage songs and build setlists in Amplee',
};

const colors = {
  bg: {
    primary: '#FAFAFA',
    secondary: '#FFFFFF',
    tertiary: '#F3F4F6',
  },
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    muted: '#9CA3AF',
  },
  purple: {
    main: '#8B5CF6',
    light: '#A78BFA',
    lighter: '#EDE9FE',
    dark: '#7C3AED',
  },
  pink: {
    main: '#f472b6',
    light: '#f9a8d4',
    lighter: '#FCE7F3',
  },
  accent: {
    green: '#34d399',
    pink: '#f472b6',
    blue: '#38bdf8',
    yellow: '#f59e0b',
  },
};

export default function LibraryHelpPage() {
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
      {/* Header */}
      <Box
        sx={{
          bgcolor: colors.bg.secondary,
          borderBottom: `1px solid ${colors.bg.tertiary}`,
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Button
              component={Link}
              href="/help"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: colors.text.secondary,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': {
                  bgcolor: colors.bg.tertiary,
                },
              }}
            >
              Help Center
            </Button>
            <Image
              src="/logo.png"
              alt="Amplee"
              width={40}
              height={40}
              style={{ borderRadius: 10 }}
            />
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, py: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg">
          {/* Page Header */}
          <Stack spacing={2.5} sx={{ mb: { xs: 5, md: 7 } }}>
            <Chip
              label="MUSIC"
              sx={{
                bgcolor: colors.pink.lighter,
                color: colors.pink.main,
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '1px',
                alignSelf: 'flex-start',
                py: 2,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                letterSpacing: '-0.02em',
                color: colors.text.primary,
              }}
            >
              Library
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Your band's song collection and setlists, all in one place. Add songs once, use them everywhere.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* What is the Library */}
            <HelpSection
              icon={<LibraryMusicIcon sx={{ fontSize: 28, color: colors.pink.main }} />}
              title="What is the Library?"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                The <strong style={{ color: colors.text.primary }}>Library</strong> is where your band stores all its music. It has two main parts:
              </Typography>
              <Stack spacing={3} sx={{ mt: 3 }}>
                <FeatureCard
                  icon={<MusicNoteIcon sx={{ fontSize: 24 }} />}
                  title="Songs"
                  description="Your band's full repertoire. Every song you know or are learning lives here—with key, tempo, notes, and reference links."
                  color={colors.pink.main}
                />
                <FeatureCard
                  icon={<QueueMusicIcon sx={{ fontSize: 24 }} />}
                  title="Setlists"
                  description="Ordered collections of songs for specific events. Build a setlist once, or reuse and tweak it for future shows."
                  color={colors.accent.blue}
                />
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Add a song to your library once, then drag it into any setlist. Update the song details and it updates everywhere.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Songs */}
            <HelpSection
              icon={<MusicNoteIcon sx={{ fontSize: 28, color: colors.pink.main }} />}
              title="Songs"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Your song library is the master list of everything your band plays. Each song can include:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 2, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                <li><strong style={{ color: colors.text.primary }}>Title & Artist</strong> — The basics</li>
                <li><strong style={{ color: colors.text.primary }}>Key & Tempo</strong> — Quick reference for the band</li>
                <li><strong style={{ color: colors.text.primary }}>Notes</strong> — Arrangement details, cues, or anything the band needs to remember</li>
                <li><strong style={{ color: colors.text.primary }}>Links</strong> — Reference recordings, chord charts, or lyric sheets</li>
              </Box>

              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontWeight: 600, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Adding a song:
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <StepItem number={1}>
                  Go to your band's <strong style={{ color: colors.text.primary }}>Library</strong> tab
                </StepItem>
                <StepItem number={2}>
                  Tap the <strong style={{ color: colors.text.primary }}>+</strong> button
                </StepItem>
                <StepItem number={3}>
                  Enter the song details and tap <strong style={{ color: colors.text.primary }}>Save</strong>
                </StepItem>
              </Stack>

              <Box
                sx={{
                  bgcolor: colors.pink.lighter,
                  borderLeft: `4px solid ${colors.pink.main}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  Songs are shared across the band
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  When you add or update a song, everyone in the band sees the changes. No more "which version of the chart are you looking at?"
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Setlists */}
            <HelpSection
              icon={<QueueMusicIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Setlists"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                A <strong style={{ color: colors.text.primary }}>setlist</strong> is an ordered list of songs for a specific event. Build it in advance, tweak it at soundcheck, and everyone sees the same list on stage.
              </Typography>

              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontWeight: 600, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Building a setlist:
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <StepItem number={1}>
                  Open an event and go to the <strong style={{ color: colors.text.primary }}>Setlist</strong> section
                </StepItem>
                <StepItem number={2}>
                  Tap <strong style={{ color: colors.text.primary }}>Add Songs</strong> to pick from your library
                </StepItem>
                <StepItem number={3}>
                  <strong style={{ color: colors.text.primary }}>Drag to reorder</strong> — put songs in the order you'll play them
                </StepItem>
                <StepItem number={4}>
                  Add <strong style={{ color: colors.text.primary }}>set breaks</strong> if you're playing multiple sets
                </StepItem>
              </Stack>

              <Box
                sx={{
                  bgcolor: colors.accent.blue + '15',
                  borderLeft: `4px solid ${colors.accent.blue}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  Live updates
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Reorder the setlist on one phone and it updates on everyone else's instantly. Great for last-minute changes at the gig.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Event Setlists vs Library */}
            <HelpSection
              icon={<PlaylistPlayIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="How it all connects"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Here's how the pieces fit together:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 2, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1.5 } }}>
                <li>
                  <strong style={{ color: colors.text.primary }}>Library → Songs</strong> — Your master song database. Add songs here once.
                </li>
                <li>
                  <strong style={{ color: colors.text.primary }}>Event → Setlist</strong> — Each event has its own setlist, built from your library songs.
                </li>
                <li>
                  <strong style={{ color: colors.text.primary }}>Update once, update everywhere</strong> — Change a song's key in the library and it updates in every setlist that uses it.
                </li>
              </Box>

              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Think of the library as your ingredients and setlists as your recipes. You can use the same song in dozens of different setlists.
              </Typography>
            </HelpSection>
          </Stack>

          {/* Related Articles */}
          <Box sx={{ mt: 8 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: colors.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 3,
              }}
            >
              Related Articles
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <RelatedCard
                title="Events"
                description="Managing shows and practices"
                href="/help/events"
                color={colors.accent.green}
              />
              <RelatedCard
                title="Bands"
                description="Setting up your band"
                href="/help/bands"
                color={colors.purple.main}
              />
            </Stack>
          </Box>

          {/* Still need help */}
          <Box
            sx={{
              mt: 8,
              p: { xs: 4, md: 5 },
              bgcolor: colors.bg.secondary,
              borderRadius: 4,
              border: `1px solid ${colors.bg.tertiary}`,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 700, color: colors.text.primary, mb: 1.5, fontSize: { xs: '1.15rem', md: '1.35rem' } }}>
              Still have questions?
            </Typography>
            <Typography sx={{ color: colors.text.secondary, mb: 3, fontSize: { xs: '1rem', md: '1.1rem' } }}>
              We're here to help you get the most out of your library.
            </Typography>
            <Button
              href="mailto:support@amplee.app?subject=Help%20with%20Library"
              variant="contained"
              size="large"
              sx={{
                bgcolor: colors.purple.main,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': { bgcolor: colors.purple.dark },
              }}
            >
              Contact Support
            </Button>
          </Box>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}

function HelpSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            bgcolor: colors.bg.tertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '1.85rem' },
            color: colors.text.primary,
          }}
        >
          {title}
        </Typography>
      </Stack>
      <Box sx={{ pl: { xs: 0, md: 8.5 } }}>{children}</Box>
    </Box>
  );
}

function StepItem({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2.5} alignItems="flex-start">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: colors.pink.lighter,
          color: colors.pink.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          flexShrink: 0,
        }}
      >
        {number}
      </Box>
      <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, pt: 0.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
        {children}
      </Typography>
    </Stack>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1.05rem', md: '1.15rem' }, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.6 }}>
              {description}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RelatedCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Card
      component={Link}
      href={href}
      elevation={0}
      sx={{
        flex: 1,
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 3,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: color,
            mb: 2,
          }}
        />
        <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
          {title}
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, mt: 0.75 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
