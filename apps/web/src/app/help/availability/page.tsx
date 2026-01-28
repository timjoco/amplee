export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RepeatIcon from '@mui/icons-material/Repeat';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
  title: 'Availability • Amplee Help Center',
  description: 'Learn how to set and view availability for your band in Amplee',
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
    teal: '#14b8a6',
  },
};

export default function AvailabilityHelpPage() {
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
                bgcolor: colors.accent.teal + '20',
                color: colors.accent.teal,
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
              Availability
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Let your bands know when you're free. Set it once from your profile and it syncs everywhere.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* What is Availability */}
            <HelpSection
              icon={<CalendarMonthIcon sx={{ fontSize: 28, color: colors.accent.teal }} />}
              title="What is availability?"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                <strong style={{ color: colors.text.primary }}>Availability</strong> lets you mark when you're busy so your bands know not to book those times. Set it once in your profile and it automatically shows up in every band you're part of.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                There are three ways to mark your availability:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 1.5, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                <li><strong style={{ color: colors.text.primary }}>Recurring rules</strong> — Block out the same day every week (e.g., "No Mondays")</li>
                <li><strong style={{ color: colors.text.primary }}>All-day blocks</strong> — Mark an entire day as unavailable</li>
                <li><strong style={{ color: colors.text.primary }}>Time blocks</strong> — Block out specific hours on a day</li>
              </Box>
              <Box
                sx={{
                  bgcolor: colors.accent.teal + '15',
                  borderLeft: `4px solid ${colors.accent.teal}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  Set it once, use it everywhere
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Your availability is tied to your profile, not individual bands. If you're in three bands, all three will automatically see when you're unavailable.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Recurring Rules */}
            <HelpSection
              icon={<RepeatIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="Recurring rules"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Got a day job that keeps you busy every weekday? A standing commitment on Tuesdays? Set up a recurring rule so you don't have to block the same day over and over:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Go to <strong style={{ color: colors.text.primary }}>Settings → Availability</strong>
                </StepItem>
                <StepItem number={2}>
                  Tap <strong style={{ color: colors.text.primary }}>Add Rule</strong>
                </StepItem>
                <StepItem number={3}>
                  Choose the <strong style={{ color: colors.text.primary }}>day(s) of the week</strong> you're unavailable
                </StepItem>
                <StepItem number={4}>
                  Optionally set <strong style={{ color: colors.text.primary }}>specific hours</strong> (or leave it as all day)
                </StepItem>
              </Stack>
              <Box
                sx={{
                  bgcolor: colors.purple.lighter,
                  borderRadius: 3,
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.purple.dark, fontWeight: 600, fontSize: { xs: '1rem', md: '1.075rem' } }}>
                  Example: 9-to-5 job
                </Typography>
                <Typography sx={{ color: colors.purple.main, fontSize: { xs: '0.95rem', md: '1rem' }, mt: 1, lineHeight: 1.6 }}>
                  Set a rule for Monday through Friday, 9am to 5pm. Your bands will see you're only available for evening and weekend gigs.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* One-time Blocks */}
            <HelpSection
              icon={<EventBusyIcon sx={{ fontSize: 28, color: colors.accent.pink }} />}
              title="Blocking specific days"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                For one-off conflicts like vacations, weddings, or that dentist appointment, block out specific dates:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Go to <strong style={{ color: colors.text.primary }}>Settings → Availability</strong>
                </StepItem>
                <StepItem number={2}>
                  Tap the <strong style={{ color: colors.text.primary }}>date</strong> you want to block
                </StepItem>
                <StepItem number={3}>
                  Choose <strong style={{ color: colors.text.primary }}>All Day</strong> or set specific hours
                </StepItem>
                <StepItem number={4}>
                  Add an optional <strong style={{ color: colors.text.primary }}>note</strong> (e.g., "family wedding")
                </StepItem>
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Tap the date again to remove the block if your plans change.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Time Blocks */}
            <HelpSection
              icon={<ScheduleIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Blocking specific hours"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Sometimes you're only busy for part of a day. Block out specific time ranges to let your band know you could still make an evening gig even if the afternoon doesn't work:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <BlockTypeCard
                  title="Morning block"
                  example="8am – 12pm"
                  description="Available for afternoon and evening"
                />
                <BlockTypeCard
                  title="Afternoon block"
                  example="12pm – 6pm"
                  description="Available for morning and evening"
                />
                <BlockTypeCard
                  title="Evening block"
                  example="6pm – 11pm"
                  description="Available for daytime only"
                />
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Time blocks give your band more flexibility when scheduling—they can work around your commitments instead of writing off the whole day.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Viewing Band Availability */}
            <HelpSection
              icon={<VisibilityIcon sx={{ fontSize: 28, color: colors.accent.yellow }} />}
              title="Viewing band availability"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                When you're in a band, you can see everyone's combined availability at a glance:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <AvailabilityIndicator
                  color={colors.accent.green}
                  label="Everyone's free"
                  description="All band members are available on this date"
                />
                <AvailabilityIndicator
                  color={colors.accent.yellow}
                  label="Some conflicts"
                  description="One or more members have time blocked"
                />
                <AvailabilityIndicator
                  color="#ef4444"
                  label="Major conflicts"
                  description="Multiple members are unavailable"
                />
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Tap any date to see exactly who's free, who's busy, and what times might still work.
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
                description="Float gigs for the band to vote on"
                href="/help/proposals"
                color={colors.accent.yellow}
              />
              <RelatedCard
                title="Public Profile"
                description="Set up your name and photo"
                href="/help/profile"
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
              We're here to help you coordinate your schedule.
            </Typography>
            <Button
              href="mailto:support@amplee.app?subject=Help%20with%20Availability"
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
          bgcolor: colors.accent.teal + '20',
          color: colors.accent.teal,
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

function AvailabilityIndicator({
  color,
  label,
  description,
}: {
  color: string;
  label: string;
  description: string;
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
        }}
      >
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: color,
          }}
        />
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

function BlockTypeCard({
  title,
  example,
  description,
}: {
  title: string;
  example: string;
  description: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: '1rem' }}>
              {title}
            </Typography>
            <Typography sx={{ color: colors.text.secondary, fontSize: '0.9rem', mt: 0.25 }}>
              {description}
            </Typography>
          </Box>
          <Chip
            label={example}
            size="small"
            sx={{
              bgcolor: colors.accent.blue + '15',
              color: colors.accent.blue,
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          />
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
