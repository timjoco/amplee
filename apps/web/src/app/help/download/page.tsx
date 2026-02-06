export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import AppleIcon from '@mui/icons-material/Apple';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabletIcon from '@mui/icons-material/Tablet';
import {
  Box,
  Button,
  Container,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Download Amplee • Help Center',
  description: 'Learn how to download Amplee on iOS, Android, iPad, and tablets',
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

export default function DownloadHelpPage() {
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
              Download Amplee
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Get Amplee on your phone or tablet. Available for iPhone, iPad, Android phones, and Android tablets.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* Apple / iOS */}
            <HelpSection
              icon={<AppleIcon sx={{ fontSize: 28, color: colors.text.primary }} />}
              title="iPhone & iPad"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Amplee is available on the <strong style={{ color: colors.text.primary }}>App Store</strong> for iPhone and iPad.
              </Typography>
              <Stack spacing={2} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Open the <strong style={{ color: colors.text.primary }}>App Store</strong> on your device
                </StepItem>
                <StepItem number={2}>
                  Search for <strong style={{ color: colors.text.primary }}>"Amplee"</strong>
                </StepItem>
                <StepItem number={3}>
                  Tap <strong style={{ color: colors.text.primary }}>Get</strong> to download
                </StepItem>
              </Stack>

              <Box
                component="a"
                href="https://apps.apple.com/us/app/amplee/id6756085566"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'inline-block',
                  mt: 4,
                  bgcolor: colors.text.primary,
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: colors.text.secondary,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Download on App Store
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Android */}
            <HelpSection
              icon={<PhoneAndroidIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="Android phones & tablets"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Amplee for Android is currently in <strong style={{ color: colors.text.primary }}>closed testing</strong>. To get access, you'll need to be added to our tester list.
              </Typography>

              <Stack spacing={2} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Email us at <strong style={{ color: colors.text.primary }}>hello.amplee@gmail.com</strong> with the subject "Android Access"
                </StepItem>
                <StepItem number={2}>
                  Include the <strong style={{ color: colors.text.primary }}>Gmail address</strong> you use on your Android device
                </StepItem>
                <StepItem number={3}>
                  We'll add you to our tester list and send you a link to download from the Play Store
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
                  Why closed testing?
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  We're still polishing the Android experience. Closed testing lets us work closely with early users to squash bugs and improve the app before a wider release.
                </Typography>
              </Box>

              <Box
                component="a"
                href="mailto:hello.amplee@gmail.com?subject=Android%20Access"
                sx={{
                  display: 'inline-block',
                  mt: 4,
                  bgcolor: colors.accent.green,
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 0.9,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Request Android Access
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Tablets */}
            <HelpSection
              icon={<TabletIcon sx={{ fontSize: 28, color: colors.blue.main }} />}
              title="iPad & Android tablets"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Amplee works great on tablets. Whether you have an <strong style={{ color: colors.text.primary }}>iPad</strong> or an <strong style={{ color: colors.text.primary }}>Android tablet</strong>, you'll get the full Amplee experience with a layout optimized for larger screens.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Just follow the same download steps as above for your device type (App Store for iPad, closed testing for Android tablets).
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Web */}
            <HelpSection
              icon={<ComputerIcon sx={{ fontSize: 28, color: colors.purple.main }} />}
              title="Web access"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                <strong style={{ color: colors.text.primary }}>Web access is not available yet</strong>, but we're working on it.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                For now, Amplee is a mobile-first app. We're focused on making the phone and tablet experience great before expanding to desktop browsers.
              </Typography>

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
                  Want to be notified when web is ready?
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Drop us a line at <strong style={{ color: colors.text.primary }}>hello.amplee@gmail.com</strong> and we'll let you know when you can access Amplee from your computer.
                </Typography>
              </Box>
            </HelpSection>
          </Stack>

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
              Having trouble downloading?
            </Typography>
            <Typography sx={{ color: colors.text.secondary, mb: 3, fontSize: { xs: '1rem', md: '1.1rem' } }}>
              We're here to help you get set up.
            </Typography>
            <Button
              href="mailto:hello.amplee@gmail.com?subject=Help%20downloading%20Amplee"
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
