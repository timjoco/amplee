// src/app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { supabaseServer } from '@/lib/supabaseServer';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return (
    <Box sx={{ bgcolor: '#0f0e16', color: '#EDEBFF' }}>
      <Hero />
      <BigFeaturesSection />
      <Footer />
    </Box>
  );
}

/* ----------------------------- HERO ----------------------------- */

function Hero() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(180deg, rgba(126,91,255,.18), rgba(21,18,34,1) 60%)',
        pt: { xs: 10, md: 14 },
        pb: { xs: 8, md: 12 },
      }}
    >
      {/* neon blobs */}
      <Blob color="#A88BFF" size={320} x={-120} y={-80} />
      <Blob color="#5ED0FF" size={240} x={'calc(100% - 160px)'} y={120} />
      <Blob color="#FF7AE6" size={180} x={160} y={440} />

      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid
            size={{ xs: 12, md: 7 }}
            sx={{
              textAlign: { xs: 'center', md: 'left' },
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-start' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack
              spacing={3}
              sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}
            >
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.5rem' },
                  color: 'common.white',
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                Simplify the chaos.
                <br />
                Amplify the music.
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  maxWidth: 600,
                  color: 'rgba(255,255,255,0.85)',
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                All your band’s moving parts — in one place, finally.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  pt: 3,
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  width: '100%',
                }}
              >
                <Button
                  href="/login"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 6,
                    py: 2,
                    fontWeight: 600,
                    borderRadius: 3,
                    bgcolor: '#9B87F5',
                  }}
                >
                  Get Started
                </Button>
                <Button
                  href="#gear"
                  size="large"
                  sx={{
                    px: 6,
                    py: 2,
                    fontWeight: 600,
                    borderRadius: 3,
                    bgcolor: 'white',
                    color: 'black',
                    '&:hover': { bgcolor: '#e0e0e0' },
                  }}
                >
                  Upgrade your band’s gear
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {/* right-hand illustrative card (no external assets needed) */}
        </Grid>
      </Container>
    </Box>
  );
}

/* ---------------------------- FEATURES ---------------------------- */
function BigFeaturesSection() {
  return (
    <Box component="section" id="features" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        {/* CREATE YOUR BAND */}
        <FeatureRow
          title="Bring your band together in one place"
          desc="Create your band profile, invite members, and start managing everything under one roof. Every great show starts with a great lineup — Amplee makes that easy."
          bg="linear-gradient(180deg, rgba(255,255,255,.06), rgba(21,18,34,1))"
          border="1px solid rgba(255,255,255,0.08)"
        />

        {/* GIG CHAT (signature) */}
        <FeatureRow
          title="The Green Room"
          chipStyle={{ bgcolor: '#9B87F5', color: '#191525', fontWeight: 700 }}
          desc="Every gig gets its own Green Room — a private space for your band to chat, share setlists, and get in sync before showtime. The Green Room gives your band a shared space to coordinate, laugh, and lock in before the curtain rises."
          bg="linear-gradient(180deg, rgba(155,135,245,.16), rgba(21,18,34,1))"
          border="1px solid rgba(155,135,245,0.40)"
          reverse
        />

        {/* EVENT MANAGEMENT */}
        <FeatureRow
          title="Event management"
          desc="Manage gigs and rehearsals with ease—basic setlists, notes, and file storage built in so everyone stays on time and in tune."
          bg="linear-gradient(180deg, rgba(255,255,255,.04), rgba(21,18,34,1))"
          border="1px solid rgba(255,255,255,0.08)"
        />
      </Container>
    </Box>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
  bg,
  border,
  reverse = false,
}: {
  icon?: React.ReactNode;
  title: string;
  chip?: string;
  chipStyle?: object;
  desc: string;
  bg: string;
  border: string;
  reverse?: boolean;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        mb: { xs: 4, md: 6 },
        borderRadius: 3,
        background: bg,
        border,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
        <Grid
          container
          spacing={{ xs: 2.5, md: 4 }}
          alignItems="center"
          sx={{
            minHeight: { xs: 520, md: 620 }, // big presence per feature
          }}
        >
          {/* Text column */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              order: reverse ? { xs: 2, md: 1 } : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-start' },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Stack
              spacing={2}
              sx={{
                maxWidth: 560,
                width: '100%',
                alignItems: { xs: 'center', md: 'flex-start' },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {icon}
                <Typography variant="h4" fontWeight={900}>
                  {title}
                </Typography>
              </Stack>

              <Typography
                sx={{ color: '#CFC9FF', fontSize: { xs: 16, md: 18 } }}
              >
                {desc}
              </Typography>
            </Stack>
          </Grid>

          {/* Visual column (placeholder now; drop in image/video later) */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              order: reverse ? { xs: 1, md: 2 } : 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 640,
                aspectRatio: '16 / 9',
                borderRadius: 2.5,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.10)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))',
              }}
            >
              {/* Replace this Box with <FeatureClip .../> or an <Image /> */}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- FOOTER ----------------------------- */

function Footer() {
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ pt: 3 }}
      >
        <Typography sx={{ color: '#CFC9FF' }}>
          © {new Date().getFullYear()} Amplee
        </Typography>
        <Stack direction="row" spacing={3}>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </Stack>
      </Stack>
    </Container>
  );
}

/* ------------------------------ UTIL ------------------------------ */

function Blob({
  color,
  size,
  x,
  y,
}: {
  color: string;
  size: number;
  x: number | string;
  y: number | string;
}) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        opacity: 0.24,
        filter: 'blur(12px)',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ---------------------------- UPGRADE YOUR GEAR ---------------------------- */
