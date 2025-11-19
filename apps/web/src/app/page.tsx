export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import {
  Avatar,
  AvatarGroup,
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

export default async function HomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return (
    <Box sx={{ bgcolor: '#0B0A0F', color: '#E8E6F0', minHeight: '100vh' }}>
      <Hero />
      <SocialProof />
      <FeaturesSection />
      <ShowcaseSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FinalCTA />
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
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15), transparent), linear-gradient(180deg, #0B0A0F 0%, #050308 100%)',
        minHeight: { xs: '85vh', md: '90vh' },
        display: 'flex',
        alignItems: 'center',
        pt: { xs: 8, md: 12 },
        pb: { xs: 6, md: 8 },
      }}
    >
      {/* Floating elements for visual interest */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: { xs: 120, md: 200 },
          height: { xs: 120, md: 200 },
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: { xs: 100, md: 160 },
          height: { xs: 100, md: 160 },
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(94, 208, 255, 0.2), transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />

      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Text column */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              textAlign: { xs: 'center', md: 'left' },
              zIndex: 1,
            }}
          >
            <Stack
              spacing={3}
              sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}
            >
              {/* Badge */}
              <Chip
                icon={<MusicNoteIcon sx={{ fontSize: 16 }} />}
                label="Your Band's Mission Control"
                size="medium"
                sx={{
                  bgcolor: 'rgba(139, 92, 246, 0.15)',
                  color: '#C4B5FD',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(139, 92, 246, 0.25)',
                    transform: 'translateY(-2px)',
                  },
                }}
              />

              {/* Headline */}
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontWeight: 900,
                  letterSpacing: -1.5,
                  fontSize: { xs: '2.75rem', sm: '3.5rem', md: '4.25rem' },
                  background:
                    'linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                  mb: 2,
                }}
              >
                Stop the chaos.
                <br />
                Start the show.
              </Typography>

              {/* Subheadline */}
              <Typography
                variant="h5"
                sx={{
                  maxWidth: 540,
                  color: 'rgba(232, 230, 240, 0.85)',
                  fontWeight: 400,
                  fontSize: { xs: '1.15rem', md: '1.35rem' },
                  lineHeight: 1.5,
                }}
              >
                Amplee is the all-in-one hub for bands who are tired of juggling
                group chats, spreadsheets, and "wait, what time?" texts.
              </Typography>

              {/* CTA Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  pt: 2,
                  width: '100%',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                <Button
                  href="/login"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 4,
                    py: 1.75,
                    fontWeight: 700,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1.05rem',
                    bgcolor: '#8B5CF6',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: '#7C3AED',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(139, 92, 246, 0.45)',
                    },
                  }}
                >
                  Get started free
                </Button>
                <Button
                  href="/waitlist"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.75,
                    fontWeight: 600,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1.05rem',
                    borderColor: 'rgba(139, 92, 246, 0.4)',
                    color: '#C4B5FD',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#8B5CF6',
                      bgcolor: 'rgba(139, 92, 246, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Join beta waitlist
                </Button>
              </Stack>

              {/* Social proof mini */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ pt: 2, opacity: 0.8 }}
              >
                <AvatarGroup
                  max={4}
                  sx={{
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      border: '2px solid #0B0A0F',
                    },
                  }}
                >
                  <Avatar sx={{ bgcolor: '#8B5CF6' }}>A</Avatar>
                  <Avatar sx={{ bgcolor: '#5ECED3' }}>B</Avatar>
                  <Avatar sx={{ bgcolor: '#F59E0B' }}>C</Avatar>
                  <Avatar sx={{ bgcolor: '#EC4899' }}>D</Avatar>
                </AvatarGroup>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(232, 230, 240, 0.7)',
                    fontSize: '0.9rem',
                  }}
                >
                  <strong>200+</strong> bands already vibing
                </Typography>
              </Stack>
            </Stack>
          </Grid>

          {/* App preview column */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
              zIndex: 1,
            }}
          >
            <Card
              sx={{
                maxWidth: 420,
                width: '100%',
                borderRadius: '20px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                background:
                  'linear-gradient(145deg, rgba(20, 18, 28, 0.95), rgba(10, 8, 15, 0.98))',
                boxShadow:
                  '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 28px 80px rgba(139, 92, 246, 0.3)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                    }}
                  >
                    🎸 Tonight's Show
                  </Typography>
                  <Chip
                    label="Live"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ADE80',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 24,
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.6 },
                      },
                    }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(232, 230, 240, 0.6)',
                    mb: 2.5,
                    fontSize: '0.9rem',
                  }}
                >
                  The Riot Room • 8:00 PM
                </Typography>

                {/* Call time card */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    mb: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: '#C4B5FD', mb: 0.5 }}
                      >
                        🕐 Call time: 6:30 PM
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(232, 230, 240, 0.6)' }}
                      >
                        Load-in & sound check
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={-1}>
                      {[1, 2, 3, 4].map((i) => (
                        <Avatar
                          key={i}
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: '0.75rem',
                            bgcolor:
                              i <= 3 ? '#4ADE80' : 'rgba(232, 230, 240, 0.2)',
                            border: '2px solid #14121C',
                          }}
                        >
                          {i <= 3 ? (
                            <CheckCircleIcon sx={{ fontSize: 14 }} />
                          ) : (
                            '?'
                          )}
                        </Avatar>
                      ))}
                    </Stack>
                  </Stack>
                </Box>

                {/* Setlist */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'rgba(30, 27, 43, 0.6)',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      color: 'rgba(232, 230, 240, 0.5)',
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    📋 Setlist
                  </Typography>
                  <Stack spacing={1.2} mt={1.5}>
                    {[
                      { name: 'Intro Jam', tag: '🎵', color: '#8B5CF6' },
                      {
                        name: 'Meadowlark & the Bluebird',
                        tag: '⭐',
                        color: '#F59E0B',
                      },
                      { name: 'Cold Open Water', tag: '🔥', color: '#EF4444' },
                    ].map((song, idx) => (
                      <Stack
                        key={song.name}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          p: 1,
                          borderRadius: '8px',
                          bgcolor: 'rgba(232, 230, 240, 0.03)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(139, 92, 246, 0.1)',
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#E8E6F0',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          {idx + 1}. {song.name}
                        </Typography>
                        <Typography sx={{ fontSize: '1rem' }}>
                          {song.tag}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                {/* Green Room chat preview */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'rgba(30, 27, 43, 0.4)',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      color: 'rgba(232, 230, 240, 0.5)',
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    💬 Green Room
                  </Typography>
                  <Stack spacing={1} mt={1.5}>
                    <Stack direction="row" spacing={1} alignItems="start">
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.7rem',
                          bgcolor: '#8B5CF6',
                        }}
                      >
                        A
                      </Avatar>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: '#C4B5FD', fontWeight: 600 }}
                        >
                          Alex
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(232, 230, 240, 0.8)',
                            fontSize: '0.85rem',
                          }}
                        >
                          I'll bring backup in-ears 🎧
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="start">
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.7rem',
                          bgcolor: '#5ECED3',
                        }}
                      >
                        S
                      </Avatar>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: '#5ECED3', fontWeight: 600 }}
                        >
                          Sam
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(232, 230, 240, 0.8)',
                            fontSize: '0.85rem',
                          }}
                        >
                          Kick drum mic fixed! 🥁
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/* ---------------------- SOCIAL PROOF ---------------------- */
function SocialProof() {
  return (
    <Box
      sx={{
        borderTop: '1px solid rgba(139, 92, 246, 0.1)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
        bgcolor: 'rgba(15, 13, 23, 0.6)',
        backdropFilter: 'blur(10px)',
        py: 3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#8B5CF6', mb: 0.5 }}
            >
              200+
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(232, 230, 240, 0.6)' }}
            >
              Bands using Amplee
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#5ECED3', mb: 0.5 }}
            >
              1,500+
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(232, 230, 240, 0.6)' }}
            >
              Shows coordinated
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#F59E0B', mb: 0.5 }}
            >
              98%
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(232, 230, 240, 0.6)' }}
            >
              Show up on time
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#EC4899', mb: 0.5 }}
            >
              Zero
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(232, 230, 240, 0.6)' }}
            >
              "Wait, what time?" texts
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/* ---------------------------- FEATURES ---------------------------- */
function FeaturesSection() {
  const features = [
    {
      icon: <ChatBubbleIcon sx={{ fontSize: 32 }} />,
      title: 'The Green Room',
      tag: 'Per-show chat',
      desc: 'Every gig gets its own focused chat space. No more scrolling through months of messages to find load-in details.',
      color: '#8B5CF6',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 32 }} />,
      title: 'Roll Call',
      tag: "Who's in?",
      desc: "See confirmations at a glance. Know who's coming, who needs a sub, and who's ghosting before load-in.",
      color: '#5ECED3',
    },
    {
      icon: <MusicNoteIcon sx={{ fontSize: 32 }} />,
      title: 'Setlists & Songs',
      tag: 'Always in sync',
      desc: 'Build your setlist once, share it with everyone. No more "what key is this in?" moments on stage.',
      color: '#F59E0B',
    },
    {
      icon: <CalendarTodayIcon sx={{ fontSize: 32 }} />,
      title: 'Show Calendar',
      tag: 'Never miss a gig',
      desc: "All your shows in one place with automatic reminders. Your band's schedule, always up to date.",
      color: '#EC4899',
    },
  ];

  return (
    <Box
      component="section"
      id="features"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0B0A0F' }}
    >
      <Container maxWidth="lg">
        <Stack
          spacing={2}
          sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}
          alignItems="center"
        >
          <Chip
            label="Features"
            sx={{
              bgcolor: 'rgba(139, 92, 246, 0.15)',
              color: '#C4B5FD',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.5,
              color: '#FFFFFF',
              fontSize: { xs: '2rem', md: '2.75rem' },
            }}
          >
            Everything your band needs.
            <br />
            Nothing you don't.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 680,
              color: 'rgba(232, 230, 240, 0.7)',
              fontSize: '1.1rem',
              lineHeight: 1.7,
            }}
          >
            Built by musicians who got tired of the chaos. Amplee replaces your
            messy stack of tools with one simple, powerful hub.
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {features.map((feature, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  background:
                    'linear-gradient(145deg, rgba(20, 18, 28, 0.8), rgba(10, 8, 15, 0.9))',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: `1px solid ${feature.color}40`,
                    boxShadow: `0 12px 40px ${feature.color}20`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${feature.color}20`,
                        color: feature.color,
                        mb: 1,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box>
                      <Chip
                        label={feature.tag}
                        size="small"
                        sx={{
                          bgcolor: `${feature.color}15`,
                          color: feature.color,
                          fontSize: '0.7rem',
                          height: 22,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          mb: 1.5,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: '#FFFFFF', mb: 1 }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(232, 230, 240, 0.7)',
                          lineHeight: 1.6,
                          fontSize: '0.95rem',
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

/* -------------------------- SHOWCASE -------------------------- */
function ShowcaseSection() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background:
          'linear-gradient(180deg, #0B0A0F 0%, rgba(139, 92, 246, 0.05) 50%, #0B0A0F 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              <Chip
                label="The Problem"
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.15)',
                  color: '#FCA5A5',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  width: 'fit-content',
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                }}
              >
                Tired of the group chat chaos?
              </Typography>
              <Stack spacing={2}>
                {[
                  '❌ Important details buried in 500 unread messages',
                  '❌ "Wait, what time is load-in?" texts at 5 PM',
                  '❌ Setlists in screenshots from 3 months ago',
                  "❌ Half the band doesn't know if they're confirmed",
                ].map((item, idx) => (
                  <Typography
                    key={idx}
                    variant="body1"
                    sx={{
                      color: 'rgba(232, 230, 240, 0.8)',
                      fontSize: '1.05rem',
                      lineHeight: 1.7,
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              <Chip
                label="The Solution"
                sx={{
                  bgcolor: 'rgba(34, 197, 94, 0.15)',
                  color: '#86EFAC',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  width: 'fit-content',
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                }}
              >
                One place. Zero confusion.
              </Typography>
              <Stack spacing={2}>
                {[
                  '✅ Every show has its own Green Room with all the details',
                  '✅ Everyone sees call times, venue info, and updates instantly',
                  '✅ Setlists stored and shared automatically',
                  "✅ Roll call shows who's confirmed at a glance",
                ].map((item, idx) => (
                  <Typography
                    key={idx}
                    variant="body1"
                    sx={{
                      color: 'rgba(232, 230, 240, 0.8)',
                      fontSize: '1.05rem',
                      lineHeight: 1.7,
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/* -------------------------- HOW IT WORKS -------------------------- */
function HowItWorksSection() {
  const steps = [
    {
      step: '1',
      title: 'Create your band',
      desc: "Set up your band profile in 60 seconds. Add members, upload a photo, and you're ready to roll.",
      color: '#8B5CF6',
    },
    {
      step: '2',
      title: 'Add your shows',
      desc: 'Drop in gig details: venue, date, call time. Each show automatically gets its own Green Room.',
      color: '#5ECED3',
    },
    {
      step: '3',
      title: 'Build your setlist',
      desc: 'Create your setlist once, share with everyone. Add notes, keys, and special instructions.',
      color: '#F59E0B',
    },
    {
      step: '4',
      title: 'Show up ready',
      desc: 'Everyone gets reminders, sees the same info, and arrives knowing exactly what to expect.',
      color: '#EC4899',
    },
  ];

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#0B0A0F',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          spacing={2}
          sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}
          alignItems="center"
        >
          <Chip
            label="How it works"
            sx={{
              bgcolor: 'rgba(139, 92, 246, 0.15)',
              color: '#C4B5FD',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.5,
              color: '#FFFFFF',
              fontSize: { xs: '2rem', md: '2.75rem' },
            }}
          >
            From booking to encore
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              color: 'rgba(232, 230, 240, 0.7)',
              fontSize: '1.1rem',
            }}
          >
            Amplee keeps your band in sync through every step of the show.
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {steps.map((step, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: `1px solid ${step.color}30`,
                  background: `linear-gradient(145deg, ${step.color}08, rgba(10, 8, 15, 0.9))`,
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 40px ${step.color}25`,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: 24,
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: step.color,
                    color: '#FFFFFF',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    boxShadow: `0 8px 24px ${step.color}40`,
                  }}
                >
                  {step.step}
                </Box>
                <CardContent sx={{ p: 3, pt: 5 }}>
                  <Stack spacing={1.5}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: '#FFFFFF' }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(232, 230, 240, 0.75)',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                      }}
                    >
                      {step.desc}
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

/* -------------------------- TESTIMONIALS -------------------------- */
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "We went from 'chaos mode' to actually feeling professional. Game changer.",
      author: 'Sarah M.',
      role: 'Lead vocalist, indie rock band',
      avatar: 'S',
      color: '#8B5CF6',
    },
    {
      quote:
        "No more screenshot setlists. Everyone actually knows what we're playing now.",
      author: 'Marcus T.',
      role: 'Guitarist, funk collective',
      avatar: 'M',
      color: '#5ECED3',
    },
    {
      quote:
        'The Green Room feature alone is worth it. Every show has its own space. So clean.',
      author: 'Jenna K.',
      role: 'Drummer, jazz trio',
      avatar: 'J',
      color: '#F59E0B',
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background:
          'linear-gradient(180deg, #0B0A0F 0%, rgba(139, 92, 246, 0.05) 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          spacing={2}
          sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}
          alignItems="center"
        >
          <Chip
            label="Testimonials"
            sx={{
              bgcolor: 'rgba(139, 92, 246, 0.15)',
              color: '#C4B5FD',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              color: '#FFFFFF',
              fontSize: { xs: '2rem', md: '2.75rem' },
            }}
          >
            Loved by bands everywhere
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {testimonials.map((testimonial, idx) => (
            <Grid key={idx} size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  background:
                    'linear-gradient(145deg, rgba(20, 18, 28, 0.8), rgba(10, 8, 15, 0.9))',
                  p: 3,
                }}
              >
                <Stack spacing={2.5}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#E8E6F0',
                      fontSize: '1.05rem',
                      lineHeight: 1.7,
                      fontStyle: 'italic',
                    }}
                  >
                    "{testimonial.quote}"
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: testimonial.color,
                        width: 48,
                        height: 48,
                        fontWeight: 700,
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: '#FFFFFF' }}
                      >
                        {testimonial.author}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(232, 230, 240, 0.6)' }}
                      >
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
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
        py: { xs: 8, md: 12 },
        bgcolor: '#0B0A0F',
      }}
    >
      <Container maxWidth="md">
        <Card
          elevation={0}
          sx={{
            borderRadius: '24px',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            background:
              'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15), transparent 70%), linear-gradient(145deg, rgba(20, 18, 28, 0.95), rgba(10, 8, 15, 0.98))',
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <Stack
            spacing={3}
            alignItems="center"
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: -0.5,
                color: '#FFFFFF',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Ready to stop the chaos?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                maxWidth: 560,
                color: 'rgba(232, 230, 240, 0.8)',
                fontSize: '1.15rem',
                lineHeight: 1.7,
              }}
            >
              Join hundreds of bands who've ditched the spreadsheets and group
              chat madness. Start your next show with Amplee.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ pt: 2 }}
            >
              <Button
                href="/login"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 5,
                  py: 2,
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  bgcolor: '#8B5CF6',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
                  '&:hover': {
                    bgcolor: '#7C3AED',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(139, 92, 246, 0.5)',
                  },
                }}
              >
                Get started free
              </Button>
              <Button
                href="/waitlist"
                variant="outlined"
                size="large"
                sx={{
                  px: 5,
                  py: 2,
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  borderColor: 'rgba(139, 92, 246, 0.5)',
                  color: '#C4B5FD',
                  '&:hover': {
                    borderColor: '#8B5CF6',
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                  },
                }}
              >
                Join the beta
              </Button>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(232, 230, 240, 0.5)',
                fontSize: '0.9rem',
                pt: 1,
              }}
            >
              No credit card required • Free forever for small bands
            </Typography>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
