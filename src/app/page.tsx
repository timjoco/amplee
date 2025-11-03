export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { supabaseServer } from '@/lib/supabaseServer';
import InstagramIcon from '@mui/icons-material/Instagram';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import Image from 'next/image';
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
        minHeight: { xs: 520, md: 680 }, // taller, feels hero-y
        display: 'flex',
        alignItems: 'center', // vertical center
        pb: { xs: 8, md: 12 },
        pt: { xs: 10, md: 12 },
      }}
    >
      {/* neon blobs */}
      <Blob color="#A88BFF" size={320} x={-120} y={-80} />
      <Blob color="#5ED0FF" size={240} x={'calc(100% - 160px)'} y={120} />
      <Blob color="#FF7AE6" size={180} x={160} y={440} />

      <Container maxWidth="lg">
        <Grid
          container
          spacing={6}
          justifyContent="center" // horizontal center
          alignItems="center"
        >
          <Grid
            size={{ xs: 12, md: 10, lg: 8 }} // narrower column, centered
            sx={{
              mx: 'auto',
              textAlign: 'center', // center on desktop too
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Stack spacing={3} sx={{ alignItems: 'center' }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.5rem' },
                  color: 'common.white',
                }}
              >
                Simplify the chaos.
                <br />
                Amplify the music.
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  maxWidth: 680,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                All your band’s moving parts — in one place, finally.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  pt: 3,
                  width: '100%',
                  justifyContent: 'center', // center buttons
                }}
              >
                <Button
                  href="/login"
                  variant="contained"
                  size="large"
                  color="primary"
                  sx={{ px: 6, py: 2, fontWeight: 600, borderRadius: 3 }}
                >
                  Get Started
                </Button>

                <Button
                  href="/how-it-works"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 6,
                    py: 2,
                    fontWeight: 600,
                    borderRadius: 3,
                    bgcolor: 'common.white',
                    color: '#0f0e16',
                    '&:hover': { bgcolor: '#eae8ff' },
                  }}
                >
                  How It Works
                </Button>
              </Stack>
            </Stack>
          </Grid>
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
        <FeatureRow
          title="Bring your band together in one place"
          desc="The chaos of gigs, group chats, and calendars can drown out the fun. Amplee pulls it all together — keeping your band in sync, inspired, and ready to make music."
          bg="linear-gradient(180deg, rgba(255,255,255,.06), rgba(21,18,34,1))"
          border="1px solid rgba(255,255,255,0.08)"
        />
        <FeatureRow
          title="The Green Room"
          chipStyle={{ bgcolor: '#9B87F5', color: '#191525', fontWeight: 700 }}
          desc="Every gig gets its own Green Room — a private space for your band to chat, share setlists, and get in sync before showtime. The Green Room gives your band a shared space to coordinate, laugh, and lock in before the curtain rises."
          bg="linear-gradient(180deg, rgba(155,135,245,.16), rgba(21,18,34,1))"
          border="1px solid rgba(155,135,245,0.40)"
        />
        <FeatureRow
          title="Plan Less. Play More"
          desc="Rehearsals, gigs, sound checks, travel plans — it’s a lot to juggle. Amplee keeps every detail in sync so your band can spend less time organizing and more time playing."
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
  const FEATURE_TITLE_FS = { xs: '2rem', md: '2.5rem', lg: '3rem' };
  const FEATURE_DESC_FS = { xs: '1.05rem', md: '1.2rem', lg: '1.3rem' };
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
            minHeight: { xs: 520, md: 620 },
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
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{ fontSize: FEATURE_TITLE_FS, lineHeight: 1.1 }}
                >
                  {title}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  color: '#CFC9FF',
                  fontSize: FEATURE_DESC_FS,
                  lineHeight: { xs: 1.5, md: 1.6 },
                }}
              >
                {desc}
              </Typography>
            </Stack>
          </Grid>

          {/* Visual column */}
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
            ></Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- FOOTER ----------------------------- */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Typography
      component="a"
      href={href}
      sx={{
        display: 'inline-block',
        color: 'rgba(255,255,255,0.92)',
        textDecoration: 'none',
        fontSize: { xs: 14, md: 15 },
        py: 0.5,
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {children}
    </Typography>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <Stack spacing={1}>
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 700,
          letterSpacing: 0.3,
          mb: 0.75,
        }}
      >
        {title}
      </Typography>
      <Stack spacing={0.5}>
        {items.map((it) => (
          <FooterLink key={it.label} href={it.href}>
            {it.label}
          </FooterLink>
        ))}
      </Stack>
    </Stack>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  const product = [
    { label: 'Download', href: '/download' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Status', href: '/status' },
  ];
  const company = [
    { label: 'About', href: '/about' },
    { label: 'Brand', href: '/brand' },
  ];
  const resources = [
    { label: 'Support', href: '/support' },
    { label: 'Blog', href: '/blog' },
  ];
  const policies = [
    { label: 'Terms', href: '/terms' },

    { label: 'Company Information', href: '/company' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        color: '#EDEBFF',
        // Amplee gradient: subtle purple glows + deep purple→black sweep
        background: `
      radial-gradient(1000px 420px at -10% -20%, rgba(155,135,245,0.18), rgba(155,135,245,0) 60%),
      radial-gradient(800px 360px at 110% 10%, rgba(255,122,230,0.12), rgba(255,122,230,0) 60%),
      linear-gradient(180deg, #151224 0%, #0f0e16 42%, #0B0A10 100%)
    `,
        pt: { xs: 6, md: 8 },
        pb: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Image
                    src="/logo.png"
                    alt="Amplee logo"
                    width={36}
                    height={36}
                    priority
                    style={{ borderRadius: 8 }}
                  />
                </Link>
              </Stack>

              <Stack spacing={1}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Socials
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <IconButton
                    component="a"
                    href="https://instagram.com/amplee.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'white', '&:hover': { color: '#E0E0FF' } }}
                    aria-label="Instagram"
                  >
                    <InstagramIcon />
                  </IconButton>
                </Stack>
              </Stack>

              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                © {year} Amplee
              </Typography>
            </Stack>
          </Grid>

          {/* LINK COLUMNS */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={{ xs: 4, md: 6 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FooterColumn title="Product" items={product} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FooterColumn title="Company" items={company} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FooterColumn title="Resources" items={resources} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FooterColumn title="Policies" items={policies} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
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

/* ---------------------------- UPGRADE YOUR GEAR TO GO HERE---------------------------- */
