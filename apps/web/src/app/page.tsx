export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PeopleIcon from '@mui/icons-material/People';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../lib/supabaseServer';

// Amplee Color System - Discord inspired, flat, bold
const colors = {
  bg: {
    primary: '#0C0A12',
    secondary: '#13111A',
    tertiary: '#1A1723',
    accent: '#231F2E',
  },
  purple: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    muted: '#6D28D9',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B4B0C2',
    muted: '#6B6880',
  },
  accent: {
    green: '#34d399',    // Events
    pink: '#f472b6',     // Songs/Setlists
    blue: '#38bdf8',     // Roster/Roll Call
    yellow: '#f59e0b',   // Proposals
    red: '#EF4444',
  },
};

export default async function HomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return (
    <Box
      sx={{
        bgcolor: colors.bg.primary,
        color: colors.text.primary,
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundSize: '24px 24px',
      }}
    >
      <Hero />
      <ChaosMeter />
      <ShowcaseSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FinalCTA />
      <SiteFooter />
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
        minHeight: { xs: 'auto', md: '95vh' },
        display: 'flex',
        alignItems: 'center',
        pt: { xs: 10, sm: 12, md: 8 },
        pb: { xs: 6, sm: 8, md: 0 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 4, sm: 6, md: 4 }} alignItems="center">
          {/* Left: Main headline */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={{ xs: 3, sm: 4 }}>
              {/* Main headline with animated reveal */}
              <Box
                sx={{
                  animation: 'fadeUp 0.8s ease-out 0.2s both',
                  '@keyframes fadeUp': {
                    from: { opacity: 0, transform: 'translateY(40px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: '"Clash Display", "Manrope", sans-serif',
                    fontWeight: 800,
                    fontSize: {
                      xs: '2.25rem',
                      sm: '3rem',
                      md: '4rem',
                      lg: '5rem',
                      xl: '6rem',
                    },
                    lineHeight: { xs: 1, sm: 0.95 },
                    letterSpacing: '-0.03em',
                    color: colors.text.primary,
                  }}
                >
                  Simplify
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: '"Clash Display", "Manrope", sans-serif',
                    fontWeight: 800,
                    fontSize: {
                      xs: '2.25rem',
                      sm: '3rem',
                      md: '4rem',
                      lg: '5rem',
                      xl: '6rem',
                    },
                    lineHeight: { xs: 1, sm: 0.95 },
                    letterSpacing: '-0.03em',
                    color: colors.text.muted,
                  }}
                >
                  the chaos.
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: '"Clash Display", "Manrope", sans-serif',
                    fontWeight: 800,
                    fontSize: {
                      xs: '2.25rem',
                      sm: '3rem',
                      md: '4rem',
                      lg: '5rem',
                      xl: '6rem',
                    },
                    lineHeight: { xs: 1, sm: 0.95 },
                    letterSpacing: '-0.03em',
                    color: colors.purple.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  Amplify
                  <VolumeUpIcon
                    sx={{
                      fontSize: {
                        xs: '1.5rem',
                        sm: '2rem',
                        md: '3rem',
                        lg: '4rem',
                      },
                      animation: 'wiggle 2s ease-in-out infinite',
                      '@keyframes wiggle': {
                        '0%, 100%': { transform: 'rotate(-5deg)' },
                        '50%': { transform: 'rotate(5deg)' },
                      },
                    }}
                  />
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: '"Clash Display", "Manrope", sans-serif',
                    fontWeight: 800,
                    fontSize: {
                      xs: '2.25rem',
                      sm: '3rem',
                      md: '4rem',
                      lg: '5rem',
                      xl: '6rem',
                    },
                    lineHeight: { xs: 1, sm: 0.95 },
                    letterSpacing: '-0.03em',
                    color: colors.purple.light,
                  }}
                >
                  the music.
                </Typography>
              </Box>

              {/* Subheadline */}
              <Typography
                sx={{
                  maxWidth: { xs: '100%', sm: 480, md: 540 },
                  color: colors.text.secondary,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  animation: 'fadeUp 0.8s ease-out 0.4s both',
                }}
              >
                The all-in-one hub for bands who are done with the group chat
                madness. Events, setlists, RSVPs — organized. Finally.
              </Typography>

              {/* CTA Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  animation: 'fadeUp 0.8s ease-out 0.6s both',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <Button
                  href="https://apps.apple.com/us/app/amplee/id6756085566"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  size="large"
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.5, sm: 2 },
                    fontWeight: 700,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    bgcolor: colors.purple.main,
                    color: '#FFFFFF',
                    border: 'none',
                    boxShadow: 'none',
                    width: { xs: '100%', sm: 'auto' },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: colors.purple.dark,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${colors.purple.main}40`,
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  Download for iOS
                </Button>
                <Button
                  href="#how-it-works"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.5, sm: 2 },
                    fontWeight: 700,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    borderWidth: '2px',
                    borderColor: colors.bg.tertiary,
                    color: colors.text.secondary,
                    bgcolor: colors.bg.secondary,
                    width: { xs: '100%', sm: 'auto' },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: colors.purple.main,
                      bgcolor: colors.bg.tertiary,
                      color: colors.text.primary,
                    },
                  }}
                >
                  See how it works
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {/* Right: App mockup */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                animation: 'slideLeft 0.8s ease-out 0.4s both',
                '@keyframes slideLeft': {
                  from: { opacity: 0, transform: 'translateX(60px)' },
                  to: { opacity: 1, transform: 'translateX(0)' },
                },
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <AppMockup />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Scroll indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          animation: 'fadeUp 0.8s ease-out 1s both',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: colors.text.muted,
            letterSpacing: '2px',
          }}
        >
          SCROLL
        </Typography>
        <KeyboardArrowDownIcon
          sx={{
            color: colors.text.muted,
            animation: 'bobbing 2s ease-in-out infinite',
            '@keyframes bobbing': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(8px)' },
            },
          }}
        />
      </Box>
    </Box>
  );
}

/* ---------------------- APP MOCKUP ---------------------- */
function AppMockup() {
  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: { xs: 280, sm: 320, md: 340 },
        width: '100%',
        mx: 'auto',
      }}
    >
      {/* Phone frame */}
      <Box
        sx={{
          bgcolor: colors.bg.secondary,
          borderRadius: { xs: '28px', sm: '36px', md: '40px' },
          border: {
            xs: `3px solid ${colors.bg.tertiary}`,
            sm: `4px solid ${colors.bg.tertiary}`,
          },
          overflow: 'hidden',
          boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px ${colors.bg.accent}`,
          p: { xs: 0.5, sm: 0.75, md: 1 },
        }}
      >
        {/* Demo video */}
        <Box
          component="video"
          src="/images/event-sheet-demo.mp4"
          autoPlay
          muted
          loop
          playsInline
          sx={{
            width: '100%',
            height: 'auto',
            borderRadius: { xs: '24px', sm: '28px', md: '32px' },
            display: 'block',
          }}
        />
      </Box>
    </Box>
  );
}

/* ---------------------- CHAOS METER ---------------------- */
function ChaosMeter() {
  const problems = [
    { text: '"Is someone picking up Jeramy?"' },
    { text: '"What\'s the address for the show?"' },
    { text: '"Where can I find recordings?"' },
    { text: '"Wait, what time is load-in?"' },
    { text: '"Can everyone text if you\'re available?"' },
    { text: '"Does anyone have the setlist?"' },
    { text: '"The show time has changed - please acknowledge ASAP!!"' },
    { text: '"How does that new song go?"' },
    {
      text: '"Can we do a last minute practice next week? Please reply YES asap!!"',
    },
    { text: '"We have practice today? I completely missed that message..."' },
    { text: '"Is there a playlist anywhere?"' },
  ];

  return (
    <Box
      sx={{
        py: { xs: 2, sm: 3 },
        borderTop: `1px solid ${colors.bg.tertiary}`,
        borderBottom: `1px solid ${colors.bg.tertiary}`,
        bgcolor: colors.bg.secondary,
        overflow: 'hidden',
      }}
    >
      {/* Scrolling marquee */}
      <Box
        sx={{
          display: 'flex',
          animation: 'marquee 40s linear infinite',
          '@keyframes marquee': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
          '&:hover': {
            animationPlayState: 'paused',
          },
        }}
      >
        {[...problems, ...problems, ...problems, ...problems].map(
          (problem, i) => (
            <Stack
              key={i}
              direction="row"
              alignItems="center"
              spacing={{ xs: 1, sm: 1.5 }}
              sx={{
                px: { xs: 2, sm: 3, md: 4 },
                whiteSpace: 'nowrap',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  fontWeight: 600,
                  color: colors.accent.red,
                  fontStyle: 'italic',
                }}
              >
                {problem.text}
              </Typography>
              <Box
                sx={{
                  width: { xs: 4, sm: 6 },
                  height: { xs: 4, sm: 6 },
                  borderRadius: '50%',
                  bgcolor: colors.text.muted,
                }}
              />
            </Stack>
          )
        )}
      </Box>
    </Box>
  );
}

/* -------------------------- SHOWCASE -------------------------- */
function ShowcaseSection() {
  const solutions = [
    {
      icon: <CalendarTodayIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
      title: 'Every gig gets its own space',
      desc: 'Chat, details, setlist, and files—all organized per event, not buried in the main thread.',
      color: colors.accent.green,
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
      title: 'Proposals let the band decide together',
      desc: "Float potential gigs, everyone votes. No more \"did you see my text?\" drama.",
      color: colors.accent.yellow,
    },
    {
      icon: <LibraryMusicIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
      title: 'Setlists that actually stay updated',
      desc: 'Build it once, share it everywhere. Keys, notes, and special cues included.',
      color: colors.accent.pink,
    },
    {
      icon: <PeopleIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />,
      title: "Roll Call shows who's in at a glance",
      desc: "See confirmations instantly. Know when you need a sub before it's too late.",
      color: colors.accent.blue,
    },
  ];

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, sm: 10, md: 14 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Section header */}
        <Stack
          spacing={{ xs: 2, sm: 3 }}
          sx={{ textAlign: 'center', mb: { xs: 5, sm: 6, md: 10 } }}
          alignItems="center"
        >
          <Chip
            label="THE AMPLEE WAY"
            sx={{
              bgcolor: colors.bg.secondary,
              color: colors.purple.main,
              fontWeight: 700,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              letterSpacing: '1.5px',
              border: `2px solid ${colors.bg.tertiary}`,
              py: { xs: 1.5, sm: 2 },
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Clash Display", "Manrope", sans-serif',
              fontWeight: 800,
              fontSize: {
                xs: '1.75rem',
                sm: '2.25rem',
                md: '3rem',
                lg: '4rem',
              },
              letterSpacing: '-0.02em',
              color: colors.text.primary,
              maxWidth: 800,
              px: { xs: 1, sm: 0 },
            }}
          >
            One place.
            <br />
            <Box component="span" sx={{ color: colors.text.muted }}>
              Zero "I didn't see that."
            </Box>
          </Typography>
        </Stack>

        {/* Solution cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {solutions.map((solution, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: colors.bg.secondary,
                  borderRadius: { xs: '16px', sm: '20px' },
                  border: `2px solid ${colors.bg.tertiary}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: solution.color,
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    '& .icon-box': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                  '&:active': {
                    borderColor: solution.color,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                  <Stack spacing={{ xs: 2, sm: 2.5 }}>
                    <Box
                      className="icon-box"
                      sx={{
                        width: { xs: 48, sm: 56, md: 64 },
                        height: { xs: 48, sm: 56, md: 64 },
                        borderRadius: { xs: '12px', sm: '16px' },
                        bgcolor: `${solution.color}15`,
                        color: solution.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      {solution.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: colors.text.primary,
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                      }}
                    >
                      {solution.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: colors.text.secondary,
                        fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                        lineHeight: 1.6,
                      }}
                    >
                      {solution.desc}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

/* ---------------------------- FEATURES ---------------------------- */
function FeaturesSection() {
  const features = [
    {
      icon: <CalendarTodayIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      title: 'Events',
      tag: 'Shows & practices',
      desc: "All your gigs and rehearsals in one place. Load-in times, venues, and automatic reminders.",
      color: colors.accent.green,
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      title: 'Proposals',
      tag: 'Vote on gigs',
      desc: "Float potential shows to the band. Everyone votes, no one gets left out of the decision.",
      color: colors.accent.yellow,
    },
    {
      icon: <LibraryMusicIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      title: 'Songs & Setlists',
      tag: 'Your library',
      desc: 'Build your setlist once, share it with everyone. Keys, tempo, notes—all in one place.',
      color: colors.accent.pink,
    },
    {
      icon: <PeopleIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      title: 'Roll Call',
      tag: "Who's in?",
      desc: "See confirmations at a glance. Know who's coming, who needs a sub, and who's ghosting.",
      color: colors.accent.blue,
    },
  ];

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, sm: 10, md: 14 },
        bgcolor: colors.bg.secondary,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack
          spacing={{ xs: 2, sm: 3 }}
          sx={{ textAlign: 'center', mb: { xs: 5, sm: 6, md: 10 } }}
          alignItems="center"
        >
          <Chip
            label="FEATURES"
            sx={{
              bgcolor: colors.bg.tertiary,
              color: colors.purple.main,
              fontWeight: 700,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              letterSpacing: '1.5px',
              border: `2px solid ${colors.bg.accent}`,
              py: { xs: 1.5, sm: 2 },
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Clash Display", "Manrope", sans-serif',
              fontWeight: 800,
              fontSize: {
                xs: '1.75rem',
                sm: '2.25rem',
                md: '3rem',
                lg: '4rem',
              },
              letterSpacing: '-0.02em',
              color: colors.text.primary,
              px: { xs: 1, sm: 0 },
            }}
          >
            Everything you need.
            <br />
            <Box component="span" sx={{ color: colors.text.muted }}>
              Nothing you don't.
            </Box>
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {features.map((feature, idx) => (
            <Grid key={idx} size={{ xs: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: colors.bg.tertiary,
                  borderRadius: { xs: '14px', sm: '20px' },
                  border: `2px solid transparent`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: feature.color,
                    transform: { xs: 'none', sm: 'translateY(-8px)' },
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                  <Stack spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                    <Box
                      sx={{
                        width: { xs: 44, sm: 50, md: 56 },
                        height: { xs: 44, sm: 50, md: 56 },
                        borderRadius: { xs: '10px', sm: '14px' },
                        bgcolor: `${feature.color}20`,
                        color: feature.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box>
                      <Chip
                        label={feature.tag}
                        size="small"
                        sx={{
                          bgcolor: colors.bg.accent,
                          color: colors.text.secondary,
                          fontSize: {
                            xs: '0.55rem',
                            sm: '0.6rem',
                            md: '0.65rem',
                          },
                          height: { xs: 18, sm: 20, md: 22 },
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          mb: { xs: 1, md: 1.5 },
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: colors.text.primary,
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                          mb: { xs: 0.5, md: 1 },
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: colors.text.secondary,
                          fontSize: {
                            xs: '0.75rem',
                            sm: '0.85rem',
                            md: '0.9rem',
                          },
                          lineHeight: 1.6,
                          display: { xs: 'none', sm: 'block' },
                        }}
                      >
                        {feature.desc}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

/* -------------------------- HOW IT WORKS -------------------------- */
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Create your band',
      desc: 'Set up in 60 seconds. Add members, upload a photo, done.',
      color: colors.purple.main,
    },
    {
      step: '02',
      title: 'Add your events',
      desc: 'Drop in gig details. Each show gets its own chat and setlist automatically.',
      color: colors.accent.green,
    },
    {
      step: '03',
      title: 'Build your setlist',
      desc: 'Create once, share everywhere. Notes, keys, and cues included.',
      color: colors.accent.pink,
    },
    {
      step: '04',
      title: 'Show up ready',
      desc: 'Everyone knows the plan. No surprises. Just music.',
      color: colors.accent.blue,
    },
  ];

  return (
    <Box
      component="section"
      id="how-it-works"
      sx={{
        py: { xs: 8, sm: 10, md: 14 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack
          spacing={{ xs: 2, sm: 3 }}
          sx={{ textAlign: 'center', mb: { xs: 5, sm: 6, md: 10 } }}
          alignItems="center"
        >
          <Chip
            label="HOW IT WORKS"
            sx={{
              bgcolor: colors.bg.secondary,
              color: colors.purple.main,
              fontWeight: 700,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              letterSpacing: '1.5px',
              border: `2px solid ${colors.bg.tertiary}`,
              py: { xs: 1.5, sm: 2 },
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Clash Display", "Manrope", sans-serif',
              fontWeight: 800,
              fontSize: {
                xs: '1.75rem',
                sm: '2.25rem',
                md: '3rem',
                lg: '4rem',
              },
              letterSpacing: '-0.02em',
              color: colors.text.primary,
            }}
          >
            From booking to encore
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, sm: 3 },
            position: 'relative',
          }}
        >
          {/* Connecting line - desktop only */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'absolute',
              top: 36,
              left: '12%',
              right: '12%',
              height: 3,
              bgcolor: colors.bg.tertiary,
              zIndex: 0,
            }}
          />

          {/* Connecting line - mobile/tablet vertical */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'absolute',
              top: 36,
              bottom: 36,
              left: 35,
              width: 3,
              bgcolor: colors.bg.tertiary,
              zIndex: 0,
            }}
          />

          {steps.map((step, idx) => (
            <Box
              key={idx}
              sx={{
                flex: { md: 1 },
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Stack
                direction={{ xs: 'row', md: 'column' }}
                spacing={{ xs: 2.5, sm: 3, md: 2.5 }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                textAlign={{ xs: 'left', md: 'center' }}
              >
                <Box
                  sx={{
                    width: { xs: 56, sm: 64, md: 72 },
                    height: { xs: 56, sm: 64, md: 72 },
                    minWidth: { xs: 56, sm: 64, md: 72 },
                    borderRadius: { xs: '14px', sm: '18px', md: '20px' },
                    bgcolor: colors.bg.secondary,
                    border: `3px solid ${step.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: step.color,
                      transform: 'scale(1.1)',
                      '& .step-text': {
                        color: '#FFF',
                      },
                    },
                  }}
                >
                  <Typography
                    className="step-text"
                    sx={{
                      fontFamily: '"Clash Display", "Manrope", sans-serif',
                      fontWeight: 800,
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                      color: step.color,
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {step.step}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: colors.text.primary,
                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                      mb: { xs: 0.5, md: 1 },
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: colors.text.secondary,
                      fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
                      lineHeight: 1.6,
                      maxWidth: { xs: '100%', md: 240 },
                    }}
                  >
                    {step.desc}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

/* ---------------------------- FINAL CTA ---------------------------- */
function FinalCTA() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, sm: 10, md: 14 },
        bgcolor: colors.bg.secondary,
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            bgcolor: colors.bg.tertiary,
            borderRadius: { xs: '20px', sm: '28px', md: '32px' },
            border: `3px solid ${colors.purple.main}`,
            p: { xs: 3, sm: 5, md: 8 },
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Stack
            spacing={{ xs: 3, md: 4 }}
            alignItems="center"
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Clash Display", "Manrope", sans-serif',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                letterSpacing: '-0.02em',
                color: colors.text.primary,
                textAlign: 'center',
                width: '100%',
              }}
            >
              Ready to stop the chaos?
            </Typography>
            <Typography
              sx={{
                maxWidth: 480,
                color: colors.text.secondary,
                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
                lineHeight: 1.6,
                px: { xs: 1, sm: 0 },
              }}
            >
              Join the bands who've ditched the spreadsheets and group chat
              madness. Start your next show with Amplee.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                href="https://apps.apple.com/us/app/amplee/id6756085566"
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                size="large"
                sx={{
                  px: { xs: 4, sm: 5 },
                  py: { xs: 1.5, sm: 2 },
                  fontWeight: 700,
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                  bgcolor: colors.purple.main,
                  boxShadow: 'none',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    bgcolor: colors.purple.dark,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${colors.purple.main}40`,
                  },
                }}
              >
                Download for iOS
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
