export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = { title: 'Support • Amplee' };

export default function SupportPage() {
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
          <Stack spacing={3} alignItems="center" textAlign="center">
            {/* Logo and Title */}
            <Box>
              <Image
                src="/logo.png"
                alt="Amplee"
                width={48}
                height={48}
                priority
                style={{ borderRadius: 12, marginBottom: 12 }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  letterSpacing: -1,
                  fontSize: { xs: '2.1rem', md: '2.75rem' },
                  background:
                    'linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Support
              </Typography>
            </Box>
            <Typography
              sx={{ color: 'rgba(232, 230, 240, 0.75)', maxWidth: 720 }}
            >
              Need help with invites, login, or something acting weird? Hit us
              up and we'll get you back to rehearsal-ready.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ pt: 1 }}
            >
              <Button
                href="mailto:hello.amplee@gmail.com?subject=Amplee%20Support%20Request"
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 800,
                  borderRadius: '12px',
                  textTransform: 'none',
                  bgcolor: '#8B5CF6',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
                  '&:hover': { bgcolor: '#7C3AED' },
                }}
              >
                Email Support
              </Button>

              <Button
                href="/help"
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  borderColor: 'rgba(139, 92, 246, 0.5)',
                  color: '#C4B5FD',
                  '&:hover': {
                    borderColor: '#8B5CF6',
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                  },
                }}
              >
                Help Center
              </Button>
            </Stack>

            {/* App Store Link */}
            <Box sx={{ pt: 2 }}>
              <Button
                href="https://apps.apple.com/us/app/amplee/id6756085566"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="large"
                sx={{
                  px: 3,
                  py: 1.5,
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                Download on App Store
              </Button>
            </Box>
          </Stack>

          <Stack spacing={2.5} sx={{ mt: { xs: 5, md: 7 } }}>
            <SupportCard
              title="Common issues"
              items={[
                {
                  q: "I didn't get my 6 digit one time passcode",
                  a: 'Check spam/junk, then try again. If you use iCloud Hide My Email, try a direct inbox. If it still doesn’t arrive, email support with the address you used.',
                },
                {
                  q: 'Invite link opens in browser instead of the app',
                  a: 'This is expected in alpha until we finish universal/app links. For now, open the invite link on the same phone where Amplee is installed.',
                },
                {
                  q: 'I joined a band but I can’t see anything / it says I have no access',
                  a: 'Ask a band admin to confirm your membership/invite status. If it still looks wrong, email support with your email + the band name.',
                },
                {
                  q: 'Chat isn’t updating unless I reopen the app',
                  a: 'In alpha, real-time updates work best while the app is open. If you background the app, your connection may pause. Reopen the app to refresh.',
                },
                {
                  q: 'I’m not getting notifications',
                  a: 'Push notifications aren’t included in the current alpha yet. You’ll see new messages and updates when the app is open. Notifications are coming in a future release.',
                },
                {
                  q: 'Upload/photo/file failed',
                  a: 'Try switching networks (Wi-Fi vs cellular) and retry. If it keeps failing, email support with what you tried to upload and the screen you were on.',
                },
                {
                  q: 'Something is loading forever / spinning',
                  a: 'Force close and reopen the app. If it continues, email support with what screen you were on and (if possible) a screenshot.',
                },
              ]}
            />

            <SupportCard
              title="Contact"
              items={[
                {
                  q: 'Email',
                  a: 'hello.amplee@gmail.com',
                },
                {
                  q: 'What to include',
                  a: 'Your email, device (iPhone/Android + model), and what you were trying to do. Screenshots help a lot.',
                },
              ]}
            />

            <Box id="delete-account">
              <Card
                elevation={0}
                sx={{
                  borderRadius: '18px',
                  border: '1px solid rgba(139, 92, 246, 0.16)',
                  background:
                    'linear-gradient(145deg, rgba(20, 18, 28, 0.85), rgba(10, 8, 15, 0.92))',
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900, mb: 2, color: '#FFFFFF' }}
                  >
                    Delete Account
                  </Typography>

                  <Stack spacing={2}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#C4B5FD' }}>
                        How to delete your account
                      </Typography>
                      <Typography sx={{ color: 'rgba(232, 230, 240, 0.75)', mt: 0.5 }}>
                        Open Amplee → Profile → Support → Account → Delete My Account. Your account and all associated data will be permanently deleted immediately.
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#C4B5FD' }}>
                        What gets deleted
                      </Typography>
                      <Typography sx={{ color: 'rgba(232, 230, 240, 0.75)', mt: 0.5 }}>
                        Your profile, avatar, email, band memberships, chat messages, uploaded files, notes, availability dates, and all other personal data.
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#C4B5FD' }}>
                        Can I undo this?
                      </Typography>
                      <Typography sx={{ color: 'rgba(232, 230, 240, 0.75)', mt: 0.5 }}>
                        No. Account deletion is permanent and cannot be undone.
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#C4B5FD' }}>
                        Learn more
                      </Typography>
                      <Typography sx={{ color: 'rgba(232, 230, 240, 0.75)', mt: 0.5 }}>
                        See our{' '}
                        <Link href="/help/profile-settings" style={{ color: '#A78BFA', fontWeight: 600 }}>
                          Profile & Settings guide
                        </Link>{' '}
                        for more details on managing your account.
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}

function SupportCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ q: string; a: string }>;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '18px',
        border: '1px solid rgba(139, 92, 246, 0.16)',
        background:
          'linear-gradient(145deg, rgba(20, 18, 28, 0.85), rgba(10, 8, 15, 0.92))',
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 900, mb: 2, color: '#FFFFFF' }}
        >
          {title}
        </Typography>

        <Stack spacing={2}>
          {items.map((it) => (
            <Box key={it.q}>
              <Typography sx={{ fontWeight: 800, color: '#C4B5FD' }}>
                {it.q}
              </Typography>
              <Typography sx={{ color: 'rgba(232, 230, 240, 0.75)', mt: 0.5 }}>
                {it.a}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
