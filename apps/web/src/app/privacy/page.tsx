export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import LegalHeader from '@/components/Legal/LegalHeader';
import { Box, Container, Stack, Typography } from '@mui/material';

export const metadata = { title: 'Privacy Policy • Amplee' };

export default function PrivacyPage() {
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
      <Box sx={{ flex: 1, py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Stack spacing={3}>
            <LegalHeader title="Privacy" />

            <Box
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: '18px',
                border: '1px solid rgba(139, 92, 246, 0.16)',
                background:
                  'linear-gradient(145deg, rgba(20, 18, 28, 0.85), rgba(10, 8, 15, 0.92))',
                lineHeight: 1.75,
              }}
            >
              {/* ---- paste your privacy policy body here (same content you already have) ---- */}
              <Typography paragraph>
                Amplee (“we”, “us”, or “our”) operates the Amplee mobile and web
                applications (the “Service”). This Privacy Policy explains how
                we collect, use, disclose, and safeguard your information when
                you use Amplee.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                1. Information We Collect
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 2 }}>
                a. Information You Provide
              </Typography>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Profile photo or avatar</li>
                <li>Band and event information you create</li>
                <li>
                  Messages, files, setlists, notes, and other content you upload
                </li>
                <li>Invitations you send or receive</li>
              </ul>

              <Typography sx={{ fontWeight: 700, mt: 2 }}>
                b. Automatically Collected Information
              </Typography>
              <ul>
                <li>Device information (device type, OS, app version)</li>
                <li>Log data (IP address, timestamps, error logs)</li>
                <li>Usage data (features used, screens visited)</li>
              </ul>

              <Typography sx={{ fontWeight: 700, mt: 2 }}>
                c. User-Generated Content
              </Typography>
              <Typography paragraph>
                Amplee is a collaboration platform. Content you create
                (messages, files, events, band details) is visible to other
                users you explicitly invite or grant access to.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                2. How We Use Your Information
              </Typography>
              <ul>
                <li>Provide and operate the Service</li>
                <li>Authenticate users and manage accounts</li>
                <li>Enable collaboration between band members</li>
                <li>
                  Send invitations, notifications, and service-related messages
                </li>
                <li>Improve performance, reliability, and user experience</li>
                <li>Detect and prevent abuse, fraud, or security issues</li>
                <li>Comply with legal obligations</li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                3. Contact Us
              </Typography>
              <Typography paragraph>
                Questions? Email{' '}
                <a href="mailto:hello.amplee@gmail.com">
                  hello.amplee@gmail.com
                </a>
                .
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}
