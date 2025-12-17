import SiteFooter from '@/components/Footers/SiteFooter';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getDeviceType(ua: string): 'ios' | 'android' | 'desktop' {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export default async function DownloadPage() {
  const ios = process.env.NEXT_PUBLIC_IOS_STORE_URL || '';
  const android = process.env.NEXT_PUBLIC_ANDROID_STORE_URL || '';

  // Detect device and redirect mobile users directly to their app store
  const h = await headers();
  const ua = h.get('user-agent') ?? '';
  const device = getDeviceType(ua);

  if (device === 'ios' && ios) {
    redirect(ios);
  }
  if (device === 'android' && android) {
    redirect(android);
  }

  return (
    <Box
      sx={{
        bgcolor: '#0B0A0F',
        color: '#E8E6F0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          py: { xs: 6, md: 0 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 3, sm: 4 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 4, md: 5, lg: 6 },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            {/* Left side: Logo + Copy */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: 3,
                textAlign: { xs: 'center', sm: 'left' },
              }}
            >
              {/* Logo */}
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '24px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.35)',
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                  },
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Amplee"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>

              {/* Text content */}
              <Stack spacing={1}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    fontSize: { md: '2.5rem', lg: '3rem' },
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                  }}
                >
                  Get Amplee
                </Typography>
                <Typography
                  sx={{
                    color: '#A78BFA',
                    fontSize: { md: '1.125rem', lg: '1.25rem' },
                    fontWeight: 600,
                    fontStyle: 'italic',
                  }}
                >
                  Simplify the chaos. Amplify the music.
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(232, 230, 240, 0.55)',
                    fontSize: '0.9375rem',
                    maxWidth: 340,
                    pt: 0.5,
                  }}
                >
                  Your band&apos;s new home for gigs, setlists, and everything
                  in between.
                </Typography>
              </Stack>
            </Box>

            {/* Right side: Download CTAs */}
            <Stack
              spacing={2}
              sx={{
                width: '100%',
                maxWidth: { xs: 320, md: 280 },
              }}
            >
              {!!ios && (
                <Button
                  href={ios}
                  variant="contained"
                  size="large"
                  disableElevation
                  sx={{
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '14px',
                    textTransform: 'none',
                    bgcolor: '#8B5CF6',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#7C3AED',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  Download for iPhone
                </Button>
              )}
              {!!android && (
                <Button
                  href={android}
                  variant="contained"
                  size="large"
                  disableElevation
                  sx={{
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '14px',
                    textTransform: 'none',
                    bgcolor: '#1E1B2E',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#C4B5FD',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#252238',
                      borderColor: '#8B5CF6',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  Download for Android
                </Button>
              )}

              {/* Support link */}
              <Typography
                sx={{
                  color: 'rgba(232, 230, 240, 0.4)',
                  fontSize: '0.8125rem',
                  textAlign: 'center',
                  pt: 1,
                  '& a': {
                    color: '#8B5CF6',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'color 0.15s ease',
                    '&:hover': {
                      color: '#A78BFA',
                    },
                  },
                }}
              >
                Need help? <a href="/support">Get support</a>
              </Typography>
            </Stack>
          </Box>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}
