import SiteFooter from '@/components/Footers/SiteFooter';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DownloadPage() {
  const ios = process.env.NEXT_PUBLIC_IOS_STORE_URL || '';
  const android = process.env.NEXT_PUBLIC_ANDROID_STORE_URL || '';
  const downloadUrl =
    process.env.NEXT_PUBLIC_DOWNLOAD_URL || 'https://amplee.app/download';

  const qrDataUrl = await QRCode.toDataURL(downloadUrl, {
    margin: 2,
    width: 280,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

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

            {/* Right side: QR Code + Download Links */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2.5,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: '#fff',
                  borderRadius: '20px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Scan to download Amplee"
                  style={{ width: 160, height: 160, display: 'block' }}
                />
              </Box>
              <Typography
                sx={{
                  color: 'rgba(232, 230, 240, 0.5)',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                }}
              >
                Scan with your phone
              </Typography>

              {/* Divider */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: '100%',
                  maxWidth: 220,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    height: '1px',
                    bgcolor: 'rgba(232, 230, 240, 0.15)',
                  }}
                />
                <Typography
                  sx={{
                    color: 'rgba(232, 230, 240, 0.4)',
                    fontSize: '0.75rem',
                  }}
                >
                  or
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: '1px',
                    bgcolor: 'rgba(232, 230, 240, 0.15)',
                  }}
                />
              </Box>

              {/* Download buttons */}
              <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 220 }}>
                {!!ios && (
                  <Button
                    href={ios}
                    variant="contained"
                    size="medium"
                    disableElevation
                    sx={{
                      py: 1.25,
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none',
                      bgcolor: '#8B5CF6',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#7C3AED',
                        transform: 'translateY(-1px)',
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
                    size="medium"
                    disableElevation
                    sx={{
                      py: 1.25,
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none',
                      bgcolor: '#1E1B2E',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#C4B5FD',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#252238',
                        borderColor: '#8B5CF6',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Download for Android
                  </Button>
                )}
              </Stack>

              {/* Support link */}
              <Typography
                sx={{
                  color: 'rgba(232, 230, 240, 0.4)',
                  fontSize: '0.8125rem',
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
            </Box>
          </Box>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}
