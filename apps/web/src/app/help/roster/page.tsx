export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
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
  title: 'Roster • Amplee Help Center',
  description: 'Learn how to create and manage different lineups for your band',
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
  blue: {
    main: '#38bdf8',
    light: '#7dd3fc',
    lighter: '#E0F2FE',
  },
  accent: {
    green: '#34d399',
    pink: '#f472b6',
    blue: '#38bdf8',
    yellow: '#f59e0b',
  },
};

export default function RosterHelpPage() {
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
              label="LINEUPS"
              sx={{
                bgcolor: colors.blue.lighter,
                color: colors.blue.main,
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
              Roster
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Create different lineups for your band and invite the right people to each event. Only see the events you're actually part of.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* What is the Roster */}
            <HelpSection
              icon={<PeopleOutlinedIcon sx={{ fontSize: 28, color: colors.blue.main }} />}
              title="What is the Roster?"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Your band might have different configurations for different situations. Maybe you play acoustic trio gigs, full band shows, and everything in between. The <strong style={{ color: colors.text.primary }}>Roster</strong> lets you save these different lineups and quickly invite the right people to each event.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Think of it as saved presets for your band's lineup:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 2, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                <li><strong style={{ color: colors.text.primary }}>"Full Band"</strong> — Everyone in the band</li>
                <li><strong style={{ color: colors.text.primary }}>"Acoustic Trio"</strong> — Just vocals, guitar, and keys</li>
                <li><strong style={{ color: colors.text.primary }}>"Core + Horns"</strong> — The rhythm section plus your horn players</li>
              </Box>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 3, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                When you create an event, pick a lineup and those people get invited automatically.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Creating Lineups */}
            <HelpSection
              icon={<PlaylistAddCheckIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="Creating lineups"
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 4, md: 6 }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    Admins can create and manage lineups for the band:
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 3 }}>
                    <StepItem number={1}>
                      Go to your band's <strong style={{ color: colors.text.primary }}>Roster</strong> section
                    </StepItem>
                    <StepItem number={2}>
                      Tap <strong style={{ color: colors.text.primary }}>Create Lineup</strong>
                    </StepItem>
                    <StepItem number={3}>
                      Give it a name (e.g., "Acoustic Set")
                    </StepItem>
                    <StepItem number={4}>
                      Select which band members are part of this lineup
                    </StepItem>
                    <StepItem number={5}>
                      Save — now you can use this lineup when creating events
                    </StepItem>
                  </Stack>

                  <Box
                    sx={{
                      bgcolor: colors.accent.green + '15',
                      borderLeft: `4px solid ${colors.accent.green}`,
                      borderRadius: '0 12px 12px 0',
                      p: 3,
                      mt: 4,
                    }}
                  >
                    <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                      Lineups are flexible
                    </Typography>
                    <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                      You can always add or remove people from a specific event after creating it. Lineups are just a quick starting point.
                    </Typography>
                  </Box>
                </Box>

                {/* Video Demo */}
                <Box
                  sx={{
                    width: { xs: 260, md: 280 },
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '32px',
                      overflow: 'hidden',
                      bgcolor: '#000',
                      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
                      border: '10px solid #1a1a1a',
                      aspectRatio: '9 / 19.5',
                    }}
                  >
                    <Box
                      component="video"
                      src="/images/support/saving-rosters.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Inviting to Events */}
            <HelpSection
              icon={<PersonAddIcon sx={{ fontSize: 28, color: colors.purple.main }} />}
              title="Inviting people to events"
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 4, md: 6 }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    When you create an event, you choose who to invite:
                  </Typography>
                  <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 2, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                    <li><strong style={{ color: colors.text.primary }}>Pick a saved lineup</strong> — Invite your "Acoustic Trio" or "Full Band" with one tap</li>
                    <li><strong style={{ color: colors.text.primary }}>Select individuals</strong> — Handpick specific people for this event</li>
                    <li><strong style={{ color: colors.text.primary }}>Mix and match</strong> — Start with a lineup and add or remove people</li>
                  </Box>

                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    Only the people you invite will see the event. Everyone else in the band won't be bothered with events that don't involve them.
                  </Typography>
                </Box>

                {/* Video Demo */}
                <Box
                  sx={{
                    width: { xs: 260, md: 280 },
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '32px',
                      overflow: 'hidden',
                      bgcolor: '#000',
                      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
                      border: '10px solid #1a1a1a',
                      aspectRatio: '9 / 19.5',
                    }}
                  >
                    <Box
                      component="video"
                      src="/images/support/event-with-roster.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Your Home Feed */}
            <HelpSection
              icon={<GroupsIcon sx={{ fontSize: 28, color: colors.accent.yellow }} />}
              title="Your personalized home feed"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Here's the key benefit: <strong style={{ color: colors.text.primary }}>you only see events you're invited to</strong>.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Your home page shows your upcoming events across all your bands. If you're not on the roster for a particular gig, it won't clutter your feed. You'll only see what's relevant to you.
              </Typography>

              <Box
                sx={{
                  bgcolor: colors.blue.lighter,
                  borderLeft: `4px solid ${colors.blue.main}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  Great for big bands and crews
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  If your band has 15 members but most gigs only need 5, the other 10 won't see events they're not part of. No noise, no confusion.
                </Typography>
              </Box>

              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                This works great for:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 2, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                <li>Bands with rotating members</li>
                <li>Big bands with different configurations</li>
                <li>Bands with crew members who only come to certain gigs</li>
                <li>Musicians who play in multiple bands</li>
              </Box>
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
                description="Creating shows and practices"
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
              We're here to help you get the most out of your roster.
            </Typography>
            <Button
              href="mailto:support@amplee.app?subject=Help%20with%20Roster"
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
          bgcolor: colors.blue.lighter,
          color: colors.blue.main,
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
