export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
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
  title: 'Proposals • Amplee Help Center',
  description: 'Learn how to create proposals and let your band vote on potential gigs',
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
  accent: {
    green: '#34d399',
    pink: '#f472b6',
    blue: '#38bdf8',
    yellow: '#f59e0b',
  },
};

export default function ProposalsHelpPage() {
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
              label="DECISION MAKING"
              sx={{
                bgcolor: colors.accent.yellow + '20',
                color: colors.accent.yellow,
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
              Proposals
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Float potential gigs to the band and let everyone vote. No more "did anyone see my text?" moments.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* What is a Proposal */}
            <HelpSection
              icon={<AssignmentIcon sx={{ fontSize: 28, color: colors.accent.yellow }} />}
              title="What is a proposal?"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                A <strong style={{ color: colors.text.primary }}>proposal</strong> is a potential gig or event that hasn't been confirmed yet. Instead of texting everyone "hey are you free on the 15th?" and hoping they all respond, you create a proposal and let the band vote.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Proposals include:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 1.5, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                <li><strong style={{ color: colors.text.primary }}>Date & time</strong> — When the gig would happen</li>
                <li><strong style={{ color: colors.text.primary }}>Venue/location</strong> — Where it would be</li>
                <li><strong style={{ color: colors.text.primary }}>Details</strong> — Pay, load-in time, any other info</li>
                <li><strong style={{ color: colors.text.primary }}>Votes</strong> — Yes or No from each member</li>
              </Box>
              <Box
                sx={{
                  bgcolor: colors.accent.yellow + '15',
                  borderLeft: `4px solid ${colors.accent.yellow}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  Why not just create an event?
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Events are for confirmed gigs. Proposals let you gauge interest and check availability before committing. Once the band agrees, you convert the proposal into an official event.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Creating a Proposal */}
            <HelpSection
              icon={<HowToVoteIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="Creating a proposal"
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 4, md: 6 }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                {/* Steps */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    Any band admin can create a proposal:
                  </Typography>
                  <Stack spacing={2.5} sx={{ mt: 3 }}>
                    <StepItem number={1}>
                      Go to your band's <strong style={{ color: colors.text.primary }}>Proposals</strong> tab
                    </StepItem>
                    <StepItem number={2}>
                      Tap the <strong style={{ color: colors.text.primary }}>+</strong> button
                    </StepItem>
                    <StepItem number={3}>
                      Enter the <strong style={{ color: colors.text.primary }}>date, venue, and details</strong>
                    </StepItem>
                    <StepItem number={4}>
                      Tap <strong style={{ color: colors.text.primary }}>Create</strong> — the band gets notified
                    </StepItem>
                  </Stack>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 3, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    Everyone in the band will see the new proposal and can vote.
                  </Typography>
                </Box>

                {/* Video Demo Placeholder */}
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
                      src="/images/support/create-proposal.mp4"
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

            {/* Voting */}
            <HelpSection
              icon={<ThumbsUpDownIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Voting on proposals"
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 4, md: 6 }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                {/* Content */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    When you open a proposal, you'll see two voting options:
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 3 }}>
                    <VoteOption
                      emoji="👍"
                      label="Yes"
                      description="I'm in — this works for me"
                      color={colors.accent.green}
                    />
                    <VoteOption
                      emoji="👎"
                      label="No"
                      description="I can't make this one"
                      color="#ef4444"
                    />
                  </Stack>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 3, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    You can change your vote anytime until the proposal is converted to an event. The proposal shows a live tally so everyone can see where things stand.
                  </Typography>
                </Box>

                {/* Video Demo Placeholder */}
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
                      src="/images/support/vote-proposal.mp4"
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

            {/* Converting to Event */}
            <HelpSection
              icon={<CalendarTodayIcon sx={{ fontSize: 28, color: colors.accent.pink }} />}
              title="Converting to an event"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Once everyone in the band has voted Yes, you can convert the proposal to an event:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Wait for <strong style={{ color: colors.text.primary }}>all band members to vote Yes</strong>
                </StepItem>
                <StepItem number={2}>
                  Open the proposal and tap <strong style={{ color: colors.text.primary }}>Convert to Event</strong>
                </StepItem>
                <StepItem number={3}>
                  The proposal becomes a full event with chat, setlist, roll call, and everything else
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
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1rem', md: '1.075rem' } }}>
                  ✓ Unanimous votes required
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, mt: 1, lineHeight: 1.6 }}>
                  A proposal can only be converted to an event when every band member has voted Yes. This ensures the whole band is on board before committing to a gig.
                </Typography>
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
                title="Bands"
                description="Creating and managing your band"
                href="/help/bands"
                color={colors.purple.main}
              />
              <RelatedCard
                title="Events"
                description="Managing confirmed shows and practices"
                href="/help/events"
                color={colors.accent.green}
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
              We're here to help you get the most out of proposals.
            </Typography>
            <Button
              href="mailto:support@amplee.app?subject=Help%20with%20Proposals"
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
          bgcolor: colors.accent.yellow + '20',
          color: colors.accent.yellow,
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

function VoteOption({
  emoji,
  label,
  description,
  color,
}: {
  emoji: string;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}
      >
        {emoji}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: '1rem' }}>
          {label}
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: '0.9rem' }}>
          {description}
        </Typography>
      </Box>
    </Box>
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
