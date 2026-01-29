export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
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
  title: 'Profile & Settings • Amplee Help Center',
  description: 'Learn how to manage your profile, availability, and account settings in Amplee',
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
    red: '#ef4444',
    teal: '#14b8a6',
  },
};

export default function ProfileSettingsHelpPage() {
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
              label="YOUR ACCOUNT"
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
              Profile & Settings
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Manage your profile, set your availability, get help, and control your account settings.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* Edit Profile */}
            <HelpSection
              icon={<EditIcon sx={{ fontSize: 28, color: colors.purple.main }} />}
              title="Edit Profile"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Your profile is how your bandmates see you in Amplee. You can customize:
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <SettingCard
                  title="Profile Photo"
                  description="Tap your avatar to upload a new photo. This appears next to your name in chats, roll calls, and member lists."
                  color={colors.purple.main}
                />
                <SettingCard
                  title="Display Name"
                  description="The name your bandmates see. Use your real name, nickname, or stage name—whatever works for your band."
                  color={colors.accent.blue}
                />
                <SettingCard
                  title="Location"
                  description="Optionally add your city. This can help when coordinating travel for shows or finding nearby bandmates."
                  color={colors.accent.green}
                />
              </Stack>

              <Box
                sx={{
                  bgcolor: colors.purple.lighter,
                  borderLeft: `4px solid ${colors.purple.main}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  How to edit your profile
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Tap the <strong style={{ color: colors.text.primary }}>Profile</strong> tab at the bottom of the app, then tap your name or photo to make changes.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* My Availability */}
            <HelpSection
              icon={<CalendarMonthIcon sx={{ fontSize: 28, color: colors.accent.teal }} />}
              title="My Availability"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Let your band know when you're free (or busy) so they can book smarter. Your availability is visible to all your bands.
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <SettingCard
                  title="Set Available Dates"
                  description="Mark dates green when you're free for gigs or practice. Your bandmates can see this when planning events."
                  color={colors.accent.green}
                />
                <SettingCard
                  title="Block Off Dates"
                  description="Mark dates red when you're unavailable—vacations, other commitments, or just need a break."
                  color={colors.accent.red}
                />
              </Stack>

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
                  Learn more about availability
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  For detailed info on how availability works across your bands, check out our{' '}
                  <Link href="/help/availability" style={{ color: colors.purple.main, fontWeight: 600 }}>
                    Availability help guide
                  </Link>.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Support */}
            <HelpSection
              icon={<HelpOutlineIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Support"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                The Support section in your profile is your hub for getting help and sharing feedback.
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <SettingCard
                  title="Help Center"
                  description="Browse guides and tutorials for all Amplee features—bands, events, proposals, and more."
                  color={colors.accent.blue}
                />
                <SettingCard
                  title="Contact Us"
                  description="Reach out directly if you're stuck, found a bug, or have questions. We're here to help."
                  color={colors.purple.main}
                />
                <SettingCard
                  title="Feedback"
                  description="Share your thoughts on Amplee! Report bugs, suggest features, or just let us know what you think. Your feedback shapes what we build next."
                  color={colors.accent.yellow}
                />
              </Stack>

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
                  We read every submission
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Feedback submitted through the app goes directly to our team. Whether it's a bug report, feature idea, or general comment—we appreciate it all.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Account */}
            <HelpSection
              icon={<ManageAccountsIcon sx={{ fontSize: 28, color: colors.accent.pink }} />}
              title="Account"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Manage your account settings and data.
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <SettingCard
                  title="Log Out"
                  description="Sign out of Amplee on this device. You'll need to verify your email again to sign back in. Found at the bottom of your Profile page."
                  color={colors.text.muted}
                />
              </Stack>

              <Box
                sx={{
                  p: 3,
                  bgcolor: colors.accent.red + '08',
                  border: `1px solid ${colors.accent.red}30`,
                  borderRadius: 3,
                  mt: 3,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: colors.accent.red + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <DeleteOutlineIcon sx={{ color: colors.accent.red }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: colors.accent.red, fontSize: { xs: '1rem', md: '1.1rem' }, mb: 0.5 }}>
                      Delete Account
                    </Typography>
                    <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.6 }}>
                      Permanently delete your account and all associated data. This removes your profile, band memberships, messages, uploaded files, and everything else. <strong style={{ color: colors.text.primary }}>This cannot be undone.</strong>
                    </Typography>
                    <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.6, mt: 1.5 }}>
                      Found in <strong style={{ color: colors.text.primary }}>Profile</strong> → <strong style={{ color: colors.text.primary }}>Support</strong> → <strong style={{ color: colors.text.primary }}>Account</strong> → <strong style={{ color: colors.text.primary }}>Delete My Account</strong>.
                    </Typography>
                  </Box>
                </Stack>
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
                title="Account & Login"
                description="Creating an account and signing in"
                href="/help/account"
                color={colors.purple.main}
              />
              <RelatedCard
                title="Availability"
                description="Setting your schedule for your bands"
                href="/help/availability"
                color={colors.accent.teal}
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
              Need more help?
            </Typography>
            <Typography sx={{ color: colors.text.secondary, mb: 3, fontSize: { xs: '1rem', md: '1.1rem' } }}>
              Reach out and we'll get you sorted.
            </Typography>
            <Button
              href="mailto:hello.amplee@gmail.com?subject=Help%20with%20Profile%20Settings"
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

function SettingCard({ title, description, color }: { title: string; description: string; color: string }) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: color,
              }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1rem', md: '1.1rem' }, mb: 0.5 }}>
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
