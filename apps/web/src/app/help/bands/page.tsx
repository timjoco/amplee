export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import LinkIcon from '@mui/icons-material/Link';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';
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
  title: 'Bands • Amplee Help Center',
  description: 'Learn how to create and manage bands in Amplee',
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

export default function BandsHelpPage() {
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
              label="GETTING STARTED"
              sx={{
                bgcolor: colors.purple.lighter,
                color: colors.purple.main,
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
              Bands
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Everything in Amplee revolves around your band. Here's how to create one and get your crew on board.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* What is a Band */}
            <HelpSection
              icon={<GroupsIcon sx={{ fontSize: 28, color: colors.purple.main }} />}
              title="What is a band?"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                A <strong style={{ color: colors.text.primary }}>band</strong> is your shared workspace in Amplee. It's where you and your bandmates organize everything—events, setlists, proposals, and more.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Each band has its own:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 1.5, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                <li><strong style={{ color: colors.text.primary }}>Events</strong> — Shows and practices with their own chat, setlist, and roll call</li>
                <li><strong style={{ color: colors.text.primary }}>Proposals</strong> — Potential gigs the band can vote on</li>
                <li><strong style={{ color: colors.text.primary }}>Song Library</strong> — Your band's repertoire</li>
                <li><strong style={{ color: colors.text.primary }}>Members</strong> — Everyone in the band with their roles and availability</li>
              </Box>
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
                  A "band" is just a container
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Invite anyone who's part of your crew—your sound engineer, manager, guitar tech, booking agent, whoever. Once they're in the band, you can easily add them to events without hunting down contact info every time.
                </Typography>
              </Box>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                You can be in multiple bands at once. Each one is completely separate—your jazz trio won't see your cover band's stuff.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Creating a Band */}
            <HelpSection
              icon={<PersonAddIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="Creating a band"
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 4, md: 6 }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                {/* Steps */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    Setting up a new band takes about 60 seconds:
                  </Typography>
                  <Stack spacing={2.5} sx={{ mt: 3 }}>
                    <StepItem number={1}>
                      Tap the <strong style={{ color: colors.text.primary }}>+</strong> button on your bands list
                    </StepItem>
                    <StepItem number={2}>
                      Enter your <strong style={{ color: colors.text.primary }}>band name</strong>
                    </StepItem>
                    <StepItem number={3}>
                      Add a <strong style={{ color: colors.text.primary }}>photo</strong> (optional but recommended)
                    </StepItem>
                    <StepItem number={4}>
                      Tap <strong style={{ color: colors.text.primary }}>Create</strong> — you're done!
                    </StepItem>
                  </Stack>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 3, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    You'll automatically be the <strong style={{ color: colors.text.primary }}>admin</strong> of any band you create.
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
                      src="/images/support/create-band.mp4"
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

            {/* Inviting Members */}
            <HelpSection
              icon={<LinkIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Inviting members"
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 4, md: 6 }}
                alignItems={{ xs: 'center', md: 'flex-start' }}
              >
                {/* Steps */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                    Get your bandmates in by sharing an invite link:
                  </Typography>
                  <Stack spacing={2.5} sx={{ mt: 3 }}>
                    <StepItem number={1}>
                      Open your band and tap the <strong style={{ color: colors.text.primary }}>invite icon</strong> in the header
                    </StepItem>
                    <StepItem number={2}>
                      Tap <strong style={{ color: colors.text.primary }}>Copy Link</strong> or share directly via text/message
                    </StepItem>
                    <StepItem number={3}>
                      Your bandmate opens the link, signs in, and they're in!
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
                      💡 Tip: Invite links can be used by multiple people
                    </Typography>
                    <Typography sx={{ color: colors.purple.main, fontSize: { xs: '0.95rem', md: '1rem' }, mt: 1, lineHeight: 1.6 }}>
                      Drop a single link in your band's existing group chat and everyone can click it to join.
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
                      src="/images/support/invite-members.mp4"
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

            {/* Roles */}
            <HelpSection
              icon={<SecurityIcon sx={{ fontSize: 28, color: colors.accent.yellow }} />}
              title="Member roles"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Bands have two roles:
              </Typography>
              <Stack spacing={3} sx={{ mt: 3 }}>
                <RoleCard
                  role="Admin"
                  color={colors.purple.main}
                  permissions={[
                    'Create, edit, and delete events',
                    'Create and manage proposals',
                    'Edit band settings and photo',
                    'Invite new members',
                    'Manage member roles',
                    'Remove members from the band',
                  ]}
                />
                <RoleCard
                  role="Member"
                  color={colors.accent.blue}
                  permissions={[
                    'View all events and proposals',
                    'RSVP to events (Roll Call)',
                    'Chat in event discussions',
                    'Vote on proposals',
                    'View and use setlists',
                    'Set personal availability',
                  ]}
                />
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                The person who creates a band is automatically an admin. Admins can promote other members to admin or demote them back to member.
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
                description="Creating shows and practices"
                href="/help/events"
                color={colors.accent.green}
              />
              <RelatedCard
                title="Proposals"
                description="Floating gigs for the band to vote on"
                href="/help/proposals"
                color={colors.accent.yellow}
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
              We're here to help you get your band up and running.
            </Typography>
            <Button
              href="mailto:support@amplee.app?subject=Help%20with%20Bands"
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
          bgcolor: colors.purple.lighter,
          color: colors.purple.main,
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

function RoleCard({
  role,
  color,
  permissions,
}: {
  role: string;
  color: string;
  permissions: string[];
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
        <Chip
          label={role}
          sx={{
            bgcolor: `${color}20`,
            color: color,
            fontWeight: 700,
            fontSize: '0.875rem',
            mb: 2,
            py: 2,
          }}
        />
        <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, m: 0, fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.8, '& li': { mb: 0.75 } }}>
          {permissions.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </Box>
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
