export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
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
  title: 'Events • Amplee Help Center',
  description: 'Learn how to create and manage events in Amplee',
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
  green: {
    main: '#34d399',
    light: '#6ee7b7',
    lighter: '#D1FAE5',
  },
  accent: {
    green: '#34d399',
    pink: '#f472b6',
    blue: '#38bdf8',
    yellow: '#f59e0b',
  },
};

export default function EventsHelpPage() {
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
              label="SCHEDULING"
              sx={{
                bgcolor: colors.green.lighter,
                color: colors.green.main,
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
              Events
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Shows, practices, rehearsals—events are the core of Amplee. Each one has everything your band needs in one place.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* What is an Event */}
            <HelpSection
              icon={<CalendarTodayIcon sx={{ fontSize: 28, color: colors.green.main }} />}
              title="What is an event?"
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 4, md: 6 }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    An <strong style={{ color: colors.text.primary }}>event</strong> is a confirmed date on your band's calendar—a show, practice, rehearsal, recording session, or anything else that needs coordination.
                  </Typography>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    Every event comes with:
                  </Typography>
                  <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 1.5, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                    <li><strong style={{ color: colors.text.primary }}>Chat</strong> — Discuss details without clogging up your group text</li>
                    <li><strong style={{ color: colors.text.primary }}>Details</strong> — Venue, time, and event info all in one spot</li>
                    <li><strong style={{ color: colors.text.primary }}>Roll Call</strong> — See who's confirmed, who's out</li>
                    <li><strong style={{ color: colors.text.primary }}>Setlist</strong> — Build and share the song order</li>
                    <li><strong style={{ color: colors.text.primary }}>Notes</strong> — Load-in time, parking info, anything the band needs to know</li>
                    <li><strong style={{ color: colors.text.primary }}>Files</strong> — Attach stage plots, contracts, or reference tracks</li>
                  </Box>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 3, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    No more digging through old texts to find when load-in is or what songs you're playing.
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
                      src="/images/event-sheet-demo.mp4"
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

            {/* Why Event-Based Chat */}
            <HelpSection
              icon={<ForumOutlinedIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Why every event has its own chat"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                You might notice there's <strong style={{ color: colors.text.primary }}>no group chat</strong> in Amplee—and that's intentional.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                We've all been there: you're scrolling through hundreds of messages in a group chat trying to find the load-in time for Saturday's gig, but it's buried under memes, side conversations, and debates about the setlist for a completely different show.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                In Amplee, <strong style={{ color: colors.text.primary }}>every conversation is tied to a specific event</strong>. When you're talking about the Friday night show, that conversation stays with the Friday night show—along with its setlist, roll call, notes, and files.
              </Typography>

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
                  Nothing gets lost
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Six months from now, if you need to remember what you discussed about a gig, just open that event. The whole conversation is right there, in context, with all the details that matter.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Creating an Event */}
            <HelpSection
              icon={<CheckCircleIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Creating an event"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Band admins can create events in two ways:
              </Typography>

              <Stack spacing={4} sx={{ mt: 4 }}>
                {/* Method 1 */}
                <Box>
                  <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1.05rem', md: '1.15rem' }, mb: 2 }}>
                    Option 1: Create directly
                  </Typography>
                  <Stack spacing={2}>
                    <StepItem number={1}>
                      Go to your band's <strong style={{ color: colors.text.primary }}>Events</strong> tab
                    </StepItem>
                    <StepItem number={2}>
                      Tap the <strong style={{ color: colors.text.primary }}>+</strong> button
                    </StepItem>
                    <StepItem number={3}>
                      Fill in the <strong style={{ color: colors.text.primary }}>date, time, venue, and details</strong>
                    </StepItem>
                    <StepItem number={4}>
                      Tap <strong style={{ color: colors.text.primary }}>Create</strong> — your band gets notified
                    </StepItem>
                  </Stack>
                </Box>

                {/* Method 2 */}
                <Box>
                  <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1.05rem', md: '1.15rem' }, mb: 2 }}>
                    Option 2: Convert from a proposal
                  </Typography>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    If you used a <Link href="/help/proposals" style={{ color: colors.purple.main, fontWeight: 600 }}>proposal</Link> to gauge interest first, you can convert it to an event once everyone votes Yes. All the details carry over automatically.
                  </Typography>
                </Box>
              </Stack>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Event Features */}
            <HelpSection
              icon={<QueueMusicIcon sx={{ fontSize: 28, color: colors.accent.pink }} />}
              title="What's inside an event"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mb: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Tap into any event to see everything organized in one place:
              </Typography>

              <Stack spacing={3}>
                <FeatureCard
                  icon={<ForumOutlinedIcon sx={{ fontSize: 24 }} />}
                  title="Chat"
                  description="A dedicated conversation for this event only. Coordinate logistics, share files, ask questions—without cluttering your main group chat."
                  color={colors.accent.blue}
                />
                <FeatureCard
                  icon={<InfoOutlinedIcon sx={{ fontSize: 24 }} />}
                  title="Details"
                  description="Venue name, address, date, time—all the basics in one place. Tap the address to open maps and get directions."
                  color={colors.purple.main}
                />
                <FeatureCard
                  icon={<PeopleOutlinedIcon sx={{ fontSize: 24 }} />}
                  title="Roll Call"
                  description="Everyone marks themselves as In, Out, or Maybe. At a glance, you know who's confirmed and who you're still waiting on."
                  color={colors.green.main}
                />
                <FeatureCard
                  icon={<QueueMusicIcon sx={{ fontSize: 24 }} />}
                  title="Setlist"
                  description="Build your song order from your band's library. Drag to reorder, add notes, and everyone sees the same list on stage."
                  color={colors.accent.pink}
                />
                <FeatureCard
                  icon={<DescriptionOutlinedIcon sx={{ fontSize: 24 }} />}
                  title="Notes"
                  description="Add important info like load-in time, parking instructions, dress code, or anything else the band needs to know before arriving."
                  color={colors.green.main}
                />
                <FeatureCard
                  icon={<FolderOutlinedIcon sx={{ fontSize: 24 }} />}
                  title="Files"
                  description="Attach stage plots, contracts, reference tracks, or any documents. Everything lives with the event so nothing gets lost in email."
                  color={colors.green.main}
                />
              </Stack>

              <Box
                sx={{
                  bgcolor: colors.green.lighter,
                  borderLeft: `4px solid ${colors.green.main}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  Everything stays with the event
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  After the gig, you can look back at any event to see what setlist you played, what was discussed, and who was there. Great for tracking what worked.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Event Types */}
            <HelpSection
              icon={<CalendarTodayIcon sx={{ fontSize: 28, color: colors.accent.yellow }} />}
              title="Shows vs. practices"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                When creating an event, you can mark it as a <strong style={{ color: colors.text.primary }}>show</strong> or a <strong style={{ color: colors.text.primary }}>practice</strong>:
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 3 }}>
                <EventTypeCard
                  type="Show"
                  description="A gig, performance, or public event. These typically have a venue, load-in time, and a polished setlist."
                  color={colors.purple.main}
                  bgColor={colors.purple.lighter}
                />
                <EventTypeCard
                  type="Practice"
                  description="A rehearsal or jam session. More casual, might be at someone's house or your usual practice space."
                  color={colors.green.main}
                  bgColor={colors.green.lighter}
                />
              </Stack>

              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Both types have the same features—chat, roll call, setlist. The label just helps your band quickly see what kind of commitment each date is.
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
                title="Proposals"
                description="Float gigs before committing"
                href="/help/proposals"
                color={colors.accent.yellow}
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
              We're here to help you get the most out of events.
            </Typography>
            <Button
              href="mailto:support@amplee.app?subject=Help%20with%20Events"
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
          bgcolor: colors.green.lighter,
          color: colors.green.main,
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

function EventTypeCard({
  type,
  description,
  color,
  bgColor,
}: {
  type: string;
  description: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
        <Chip
          label={type}
          sx={{
            bgcolor: bgColor,
            color: color,
            fontWeight: 700,
            fontSize: '0.875rem',
            mb: 2,
            py: 2,
          }}
        />
        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.6 }}>
          {description}
        </Typography>
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
