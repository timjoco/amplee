/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GroupsIcon from '@mui/icons-material/Groups';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';

import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  keyframes,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useState } from 'react';

// Amplee Purple Palette
const AMPLEE_PURPLE = '#A855F7';
const AMPLEE_PURPLE_DARK = '#9333EA';
const AMPLEE_PURPLE_LIGHT = '#C084FC';
const AMPLEE_VIOLET = '#7C3AED';
const BG_DARK = '#0A0A0F';
const BG_CARD = 'rgba(20, 16, 32, 0.6)';
const BORDER = 'rgba(168, 85, 247, 0.15)';
const BORDER_HOVER = 'rgba(168, 85, 247, 0.35)';
const SUBTEXT = 'rgba(237, 235, 255, 0.7)';
const TEXT_PRIMARY = '#F5F3FF';

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`;

// Starfield component
const Starfield = () => {
  const stars = React.useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {stars.map((star) => (
        <Box
          key={star.id}
          sx={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            bgcolor: star.size > 2 ? AMPLEE_PURPLE_LIGHT : 'white',
            animation: `${twinkle} ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            boxShadow:
              star.size > 2
                ? `0 0 ${star.size * 2}px ${alpha(AMPLEE_PURPLE, 0.5)}`
                : 'none',
          }}
        />
      ))}
    </Box>
  );
};

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    instrument: '',
    bands: '',
    painPoint: '',
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: any) => {
    setFormData({ ...formData, bands: e.target.value });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = formData.email.trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) {
      setErr('Please enter a valid email.');
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: v,
          name: formData.name.trim(),
          instrument: formData.instrument.trim(),
          bands: formData.bands,
          pain_point: formData.painPoint.trim(),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Something went wrong.');
      }
      setOk("You're on the list—see you soon 🤘");
      setFormData({
        email: '',
        name: '',
        instrument: '',
        bands: '',
        painPoint: '',
      });
    } catch (e: any) {
      setErr(e?.message || 'Failed to join the list.');
    } finally {
      setBusy(false);
    }
  }

  const inputStyles = {
    bgcolor: 'rgba(10, 10, 15, 0.7)',
    backdropFilter: 'blur(10px)',
    color: TEXT_PRIMARY,
    borderRadius: 2,
    '& .MuiInputBase-input': {
      py: 1.5,
      color: TEXT_PRIMARY,
      '&::placeholder': { color: SUBTEXT, opacity: 1 },
    },
    '& fieldset': {
      borderColor: BORDER,
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': { borderColor: BORDER_HOVER },
    '&.Mui-focused fieldset': {
      borderColor: AMPLEE_PURPLE,
      boxShadow: `0 0 20px ${alpha(AMPLEE_PURPLE, 0.15)}`,
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: BG_DARK,
        color: TEXT_PRIMARY,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Starfield Background */}
      <Starfield />

      {/* Gradient Orbs */}
      <Box
        sx={{
          position: 'absolute',
          width: '60vw',
          height: '60vw',
          maxWidth: 800,
          maxHeight: 800,
          top: '-20%',
          left: '-10%',
          background: `radial-gradient(circle, ${alpha(
            AMPLEE_PURPLE,
            0.15
          )} 0%, transparent 70%)`,
          animation: `${pulse} 8s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '50vw',
          height: '50vw',
          maxWidth: 600,
          maxHeight: 600,
          bottom: '-15%',
          right: '-5%',
          background: `radial-gradient(circle, ${alpha(
            AMPLEE_VIOLET,
            0.12
          )} 0%, transparent 70%)`,
          animation: `${pulse} 10s ease-in-out infinite`,
          animationDelay: '2s',
          pointerEvents: 'none',
        }}
      />

      <Container
        maxWidth="md"
        sx={{ py: { xs: 4, md: 8 }, position: 'relative', zIndex: 1 }}
      >
        {/* Main Card with Glass Effect */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            p: { xs: 3, sm: 4, md: 6 },
            border: `1px solid ${BORDER}`,
            background: BG_CARD,
            backdropFilter: 'blur(20px)',
            boxShadow: `
              0 0 0 1px ${alpha(AMPLEE_PURPLE, 0.05)},
              0 20px 50px ${alpha('#000', 0.5)},
              0 0 100px ${alpha(AMPLEE_PURPLE, 0.1)}
            `,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${alpha(
                AMPLEE_PURPLE_LIGHT,
                0.5
              )}, transparent)`,
            },
          }}
        >
          <Stack spacing={4} alignItems="center" textAlign="center">
            {/* Logo with Beta Tag */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                component="img"
                src="/logo.png"
                alt="Amplee"
                sx={{
                  height: { xs: 48, sm: 56, md: 64 },
                  width: 'auto',
                  filter: `drop-shadow(0 0 20px ${alpha(AMPLEE_PURPLE, 0.4)})`,
                }}
              />
              <Typography
                component="span"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  bgcolor: alpha(AMPLEE_PURPLE, 0.2),
                  border: `1px solid ${alpha(AMPLEE_PURPLE, 0.4)}`,
                  boxShadow: `0 0 20px ${alpha(AMPLEE_PURPLE, 0.15)}`,
                }}
              >
                Beta
              </Typography>
            </Stack>

            {/* Headline with Gradient */}
            <Typography
              variant="h1"
              fontWeight={900}
              sx={{
                background: `linear-gradient(135deg, ${AMPLEE_PURPLE_LIGHT} 0%, ${TEXT_PRIMARY} 50%, ${AMPLEE_PURPLE} 100%)`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
                lineHeight: 1.1,
                animation: `${shimmer} 8s linear infinite`,
              }}
            >
              Simplify the chaos.
              <br />
              Amplify the music.
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h6"
              sx={{
                color: SUBTEXT,
                maxWidth: 520,
                fontWeight: 400,
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.125rem' },
              }}
            >
              Join the Amplee beta and help shape the all-in-one hub for bands—
              event chat, roster roles, and clean setlists.
            </Typography>

            {/* Form */}
            <Box
              component="form"
              onSubmit={onSubmit}
              sx={{ width: '100%', maxWidth: 480, mt: 2 }}
            >
              <Stack
                spacing={2.5}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: 3,
                  border: `1px solid ${alpha(AMPLEE_PURPLE, 0.1)}`,
                  background: `linear-gradient(180deg, ${alpha(
                    '#0A0A0F',
                    0.8
                  )} 0%, ${alpha('#0A0A0F', 0.6)} 100%)`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Email - Required */}
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  placeholder="you@bandmail.com"
                  label="Email *"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={busy}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon
                          sx={{ color: AMPLEE_PURPLE_LIGHT, opacity: 0.8 }}
                        />
                      </InputAdornment>
                    ),
                    sx: inputStyles,
                  }}
                  InputLabelProps={{ sx: { color: SUBTEXT } }}
                />

                {/* Name */}
                <TextField
                  fullWidth
                  name="name"
                  placeholder="Your name"
                  label="Name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={busy}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon
                          sx={{ color: AMPLEE_PURPLE_LIGHT, opacity: 0.8 }}
                        />
                      </InputAdornment>
                    ),
                    sx: inputStyles,
                  }}
                  InputLabelProps={{ sx: { color: SUBTEXT } }}
                />

                {/* Instrument */}
                <TextField
                  fullWidth
                  name="instrument"
                  placeholder="Guitar, drums, vocals..."
                  label="What instrument(s) do you play?"
                  value={formData.instrument}
                  onChange={handleChange}
                  disabled={busy}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MusicNoteIcon
                          sx={{ color: AMPLEE_PURPLE_LIGHT, opacity: 0.8 }}
                        />
                      </InputAdornment>
                    ),
                    sx: inputStyles,
                  }}
                  InputLabelProps={{ sx: { color: SUBTEXT } }}
                />

                {/* Bands Dropdown */}
                <FormControl fullWidth>
                  <InputLabel sx={{ color: SUBTEXT }}>
                    How many bands are you in?
                  </InputLabel>
                  <Select
                    name="bands"
                    value={formData.bands}
                    onChange={handleSelectChange}
                    disabled={busy}
                    label="How many bands are you in?"
                    startAdornment={
                      <InputAdornment position="start">
                        <GroupsIcon
                          sx={{ color: AMPLEE_PURPLE_LIGHT, opacity: 0.8 }}
                        />
                      </InputAdornment>
                    }
                    sx={{
                      ...inputStyles,
                      '& .MuiSelect-select': { py: 1.5 },
                      '& .MuiSelect-icon': { color: SUBTEXT },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: '#14101F',
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${BORDER}`,
                          boxShadow: `0 10px 40px ${alpha('#000', 0.5)}`,
                          '& .MuiMenuItem-root': {
                            color: TEXT_PRIMARY,
                            '&:hover': { bgcolor: alpha(AMPLEE_PURPLE, 0.15) },
                            '&.Mui-selected': {
                              bgcolor: alpha(AMPLEE_PURPLE, 0.25),
                              '&:hover': { bgcolor: alpha(AMPLEE_PURPLE, 0.3) },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="">Select one...</MenuItem>
                    <MenuItem value="1">1 band</MenuItem>
                    <MenuItem value="2-3">2-3 bands</MenuItem>
                    <MenuItem value="4+">4+ bands</MenuItem>
                    <MenuItem value="0">Not currently in a band</MenuItem>
                  </Select>
                </FormControl>

                {/* Pain Point */}
                <TextField
                  fullWidth
                  name="painPoint"
                  placeholder="Scheduling conflicts, lost setlists, group chat chaos..."
                  label="What's your biggest headache managing your band?"
                  value={formData.painPoint}
                  onChange={handleChange}
                  disabled={busy}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment
                        position="start"
                        sx={{ alignSelf: 'flex-start', mt: 1.5 }}
                      >
                        <HelpOutlineIcon
                          sx={{ color: AMPLEE_PURPLE_LIGHT, opacity: 0.8 }}
                        />
                      </InputAdornment>
                    ),
                    sx: inputStyles,
                  }}
                  InputLabelProps={{ sx: { color: SUBTEXT } }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={busy}
                  sx={{
                    py: 1.75,
                    borderRadius: 2,
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: 0.5,
                    background: `linear-gradient(135deg, ${AMPLEE_PURPLE} 0%, ${AMPLEE_VIOLET} 100%)`,
                    boxShadow: `
                      0 4px 15px ${alpha(AMPLEE_PURPLE, 0.4)},
                      0 0 40px ${alpha(AMPLEE_PURPLE, 0.2)}
                    `,
                    border: `1px solid ${alpha(AMPLEE_PURPLE_LIGHT, 0.3)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${alpha(
                        '#fff',
                        0.2
                      )}, transparent)`,
                      transition: 'left 0.5s ease',
                    },
                    '&:hover': {
                      background: `linear-gradient(135deg, ${AMPLEE_PURPLE_DARK} 0%, ${AMPLEE_VIOLET} 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `
                        0 8px 25px ${alpha(AMPLEE_PURPLE, 0.5)},
                        0 0 60px ${alpha(AMPLEE_PURPLE, 0.3)}
                      `,
                      '&::before': {
                        left: '100%',
                      },
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    transition: 'all 0.3s ease',
                    '&.Mui-disabled': {
                      background: alpha(AMPLEE_PURPLE, 0.3),
                      color: alpha('#fff', 0.5),
                    },
                  }}
                >
                  {busy ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Join the Waitlist 🎸'
                  )}
                </Button>
              </Stack>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 2,
                  color: SUBTEXT,
                  opacity: 0.7,
                }}
              >
                No spam, ever. Just Amplee updates and your invite when it's
                ready.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>

      {/* Success Snackbar */}
      <Snackbar
        open={!!ok}
        onClose={() => setOk(null)}
        autoHideDuration={4000}
        message={
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleRoundedIcon fontSize="small" />
            <span>{ok}</span>
          </Stack>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            background: `linear-gradient(135deg, #22c55e 0%, #16a34a 100%)`,
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: `0 10px 40px ${alpha('#22c55e', 0.3)}`,
          },
        }}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!err}
        onClose={() => setErr(null)}
        autoHideDuration={4500}
        message={err ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            background: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`,
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: `0 10px 40px ${alpha('#ef4444', 0.3)}`,
          },
        }}
      />
    </Box>
  );
}
