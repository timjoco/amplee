/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseIcon from '@mui/icons-material/Close';
import ForumIcon from '@mui/icons-material/Forum';
import GroupsIcon from '@mui/icons-material/Groups';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendIcon from '@mui/icons-material/Send';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import DescriptionIcon from '@mui/icons-material/Description';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, SxProps, Theme } from '@mui/material/styles';
import { useState } from 'react';

import React from 'react';

const BLURPLE = '#5865F2';
const BLURPLE_HOVER = '#4752C4';
const BG = '#0B0B10';
const BORDER = 'rgba(255,255,255,0.10)';
const SUBTEXT = 'rgba(237,235,255,0.75)';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
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
        body: JSON.stringify({ email: v }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Something went wrong.');
      }
      setOk("You're on the list—see you soon 🤘");
      setEmail('');
    } catch (e: any) {
      setErr(e?.message || 'Failed to join the list.');
    } finally {
      setBusy(false);
    }
  }

  const CARD_H = { xs: 'auto', md: 380 }; // pick your height

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: BG,
        color: '#EDEBFF',
        display: 'flex',
        alignItems: 'flex-start',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper
          elevation={0}
          sx={(t) => ({
            borderRadius: 2,
            p: { xs: 3, md: 5 },
            mb: { xs: 4, md: 6 },
            border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          })}
        >
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <Typography
              variant="overline"
              sx={() => ({
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                fontWeight: 900,
                letterSpacing: 1,
                bgcolor: alpha(BLURPLE, 0.18),
                border: `1px solid ${alpha(BLURPLE, 0.35)}`,
              })}
            >
              AMPLEE - BETA ACCESS
            </Typography>

            <Typography
              variant="h2"
              fontWeight={900}
              sx={{
                textAlign: 'center',
                background: 'linear-gradient(90deg, #A855F7 0%, #EDEBFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent',
              }}
            >
              Simplify the chaos - Amplify the music
            </Typography>

            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 780 }}>
              Join the Amplee beta and help shape the all-in-one hub for bands:
              event chat, roster roles, and clean setlists.
            </Typography>

            <Box
              component="form"
              onSubmit={onSubmit}
              sx={{
                width: '100%',
                maxWidth: 720,
                mt: 1,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  border: `1px solid ${BORDER}`,
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.10))',
                }}
              >
                <TextField
                  fullWidth
                  type="email"
                  placeholder="you@bandmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon sx={{ opacity: 0.9 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: '#11131A',
                      color: 'white',
                      borderRadius: 1.5,
                      '& .MuiInputBase-input': { py: 1.25 },
                      '& fieldset': { borderColor: alpha('#FFFFFF', 0.12) },
                      '&:hover fieldset': {
                        borderColor: alpha('#FFFFFF', 0.2),
                      },
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={busy}
                  sx={{
                    flexShrink: 0,
                    minWidth: 160,
                    borderRadius: 1.5,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    '&:hover': { bgcolor: BLURPLE_HOVER },
                  }}
                >
                  {busy ? <CircularProgress size={18} /> : 'Join Waitlist'}
                </Button>
              </Stack>
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 1, color: SUBTEXT }}
              >
                No spam. Amplee updates only.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Grid container spacing={2.5} alignItems="stretch">
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
            <FeatureCard
              icon={<ForumIcon />}
              title="Your band’s digital green room."
              caption=" Every gig gets its own chat — no more lost texts, no more chaos."
              sx={{ height: CARD_H }}
            >
              <PreviewChat />
            </FeatureCard>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
            <FeatureCard
              icon={<GroupsIcon />}
              title="Your band's line up, locked in"
              caption="Assign roles that hit the right note — Admin, Member, or Guest Star. Everyone knows their part."
              sx={{ height: CARD_H }}
            >
              <PreviewRoster />
            </FeatureCard>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
            <FeatureCard
              icon={<DescriptionIcon />}
              title="Setlists you actually want to open."
              caption="Tap a song, get the chords, nail the solp. No PDFs, no panic. Just music that moves."
              sx={{ height: CARD_H }}
            >
              <SetlistPreview />
            </FeatureCard>
          </Grid>
        </Grid>

        {/* Snackbars */}
        <Snackbar
          open={!!ok}
          onClose={() => setOk(null)}
          autoHideDuration={3500}
          message={
            <Stack direction="row" alignItems="center" spacing={1}>
              <CheckCircleRoundedIcon fontSize="small" />
              <span>{ok}</span>
            </Stack>
          }
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
        <Snackbar
          open={!!err}
          onClose={() => setErr(null)}
          autoHideDuration={4500}
          message={err ?? ''}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{ sx: { backgroundColor: '#B00020' } }}
        />
      </Container>
    </Box>
  );
}

/* ------------------------- Reusable Feature Card ------------------------- */

function FeatureCard({
  icon,
  title,
  caption,
  children,
  sx,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  const base = (t: Theme) => ({
    borderRadius: 2,
    p: 2,
    border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%', // ✅ add this
    minHeight: 0,
  });

  const mergedSx: SxProps<Theme> = Array.isArray(sx)
    ? [base, ...sx]
    : sx
    ? [base, sx]
    : [base];

  return (
    <Paper elevation={0} sx={mergedSx}>
      <Stack spacing={1} sx={{ flexShrink: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${alpha('#FFFFFF', 0.14)}`,
              bgcolor: alpha('#FFFFFF', 0.04),
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography fontWeight={900}>{title}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'rgba(237,235,255,0.75)' }}>
          {caption}
        </Typography>
      </Stack>

      {/* Preview area takes the rest */}
      <Box
        sx={{
          mt: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
          '& > *': {
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            width: '100%',
            height: '100%',
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

function SetlistPreview() {
  const SONGS = [
    {
      id: '1',
      title: 'Blackbird and the Bluejay',
      key: 'G',
      bpm: 92,
      notes:
        'Starts with light drums. Everyone in on first chorus. End on big G with a held crash.',
      chordSheet: `Intro: | G  D/F# | Em  C | (x2)

Verse 1:
G D/F# Em C x2

Pre Chorus
Am C D x1

Chorus:
G D/F# Em C`,
    },
    {
      id: '2',
      title: 'Hot Water',
      key: 'D',
      bpm: 112,
      notes:
        'Guitars palm-mute on verses. Half-time drums in the bridge. Vocal cutoff on last beat.',
      chordSheet: `Intro: | D  A/C# | Bm  G | (x2)

Verse: D  A/C#  Bm  G
Pre:   Em  G  A
Chorus: D  A  Bm  G

Bridge:
Bm G
D A`,
    },
    {
      id: '3',
      title: 'Drop that Weight',
      key: 'A',
      bpm: 98,
      notes:
        'Bass enters on bar 3. Harmonies only on V2 and V3. Tag last chorus.',
      chordSheet: `Intro: | A  E/G# | F#m  D |

Verse: A  E/G#  F#m  D
Pre:   Bm  D  E
Chorus: A  E  F#m  D

Tag: A (hold)`,
    },
  ] as const;

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<(typeof SONGS)[number] | null>(
    null
  );
  const [tab, setTab] = React.useState(0);

  const openSong = (s: (typeof SONGS)[number]) => {
    setActive(s);
    setOpen(true);
  };
  const close = () => setOpen(false);

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        bgcolor: '#11131A',
        border: '1px solid rgba(255,255,255,0.10)',
        height: { xs: 240, md: '100%' },
        width: '100%', // ✅ add
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 1, pb: 0.75, flexShrink: 0 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <MusicNoteIcon sx={{ opacity: 0.9 }} fontSize="small" />
          <Typography variant="subtitle2" fontWeight={900} letterSpacing={0.4}>
            Setlist (Demo)
          </Typography>
        </Stack>
        <Chip
          size="small"
          label={`${SONGS.length} songs`}
          sx={{ height: 20, fontWeight: 800 }}
        />
      </Stack>

      {/* Scrollable song list */}
      <Box sx={{ px: 1, pb: 1, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Stack spacing={0.75}>
          {SONGS.map((s, idx) => (
            <Stack
              key={s.id}
              direction="row"
              alignItems="center"
              spacing={0.5}
              onClick={() => openSong(s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openSong(s)}
              sx={(t) => ({
                p: 0.75,
                borderRadius: 1.25,
                border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
                bgcolor: alpha('#FFFFFF', 0.03),
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': { bgcolor: alpha('#FFFFFF', 0.06) },
              })}
            >
              <Box
                sx={(t) => ({
                  width: 24,
                  height: 24,
                  borderRadius: 0.75,
                  fontSize: 12,
                  fontWeight: 900,
                  display: 'grid',
                  placeItems: 'center',
                  background:
                    'linear-gradient(135deg, rgba(124,58,237,.35), rgba(168,85,247,.25))',
                  border: `1px solid ${alpha(t.palette.primary.main, 0.35)}`,
                })}
              >
                {idx + 1}
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  noWrap
                  sx={{
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    fontSize: { xs: 13, md: 13 },
                  }}
                >
                  {s.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.75, display: 'block', lineHeight: 1.2 }}
                >
                  Key {s.key} · {s.bpm} BPM
                </Typography>
              </Box>

              <IconButton size="small">
                <OpenInNewIcon fontSize="inherit" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Details dialog (same a11y fix: no <h6> inside <h2>) */}
      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: (t) => ({
            borderRadius: 2,
            border: `1px solid ${alpha(t.palette.primary.main, 0.28)}`,
            background:
              'linear-gradient(180deg, rgba(14,14,20,0.95), rgba(14,14,20,0.88))',
          }),
        }}
      >
        <DialogTitle component="div" sx={{ pr: 6 }}>
          <Typography variant="h6" component="h2" fontWeight={900} noWrap>
            {active?.title}
          </Typography>
          {active && (
            <Typography variant="caption" component="p" sx={{ opacity: 0.8 }}>
              Key: {active.key} · {active.bpm} BPM
            </Typography>
          )}
          <IconButton
            onClick={close}
            size="small"
            aria-label="Close"
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="fullWidth"
          sx={{ px: 2, borderBottom: () => `1px solid ${alpha('#fff', 0.08)}` }}
        >
          <Tab
            icon={<DescriptionIcon fontSize="small" />}
            iconPosition="start"
            label="Chord Sheet"
          />
          <Tab
            icon={<OpenInNewIcon fontSize="small" />}
            iconPosition="start"
            label="Notes"
          />
        </Tabs>

        {/* NEW: tab panels */}
        <DialogContent dividers sx={{ p: 0 }}>
          {tab === 0 && active && (
            <Box
              sx={{
                p: 2,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12.5,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
                bgcolor: 'rgba(0,0,0,0.25)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {active.chordSheet}
            </Box>
          )}

          {tab === 1 && active && (
            <Box sx={{ p: 2 }}>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, whiteSpace: 'pre-wrap' }}
              >
                {active.notes}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function PreviewChat() {
  const event = {
    title: 'First Fridays @ Northside Social',
    location: 'North Kansas City, MO',
    when: 'Fri • Nov 8 • 7:00–10:00 PM',
  };

  const people = [
    { id: 'alex', name: 'Alex Rivera' },
    { id: 'maya', name: 'Maya Chen' },
    { id: 'dre', name: 'Dre Collins' },
    { id: 'me', name: 'You' },
  ] as const;

  const byId = Object.fromEntries(people.map((p) => [p.id, p]));

  const msgs: Array<{
    id: string;
    who: (typeof people)[number]['id'];
    text: string;
    at: string;
  }> = [
    {
      id: 'm1',
      who: 'alex',
      text: 'Reminder - load got pushed back to 5:00pm!',
      at: '3:14 PM',
    },
    {
      id: 'm2',
      who: 'dre',
      text: 'Got it, thanks for the heads up.',
      at: '3:15 PM',
    },
    {
      id: 'm3',
      who: 'maya',
      text: 'Alex - are you bring that extra DI Box?',
      at: '3:16 PM',
    },
    {
      id: 'm4',
      who: 'dre',
      text: 'I got the extra box! Also bringing a couple extra power cables.',
      at: '3:17 PM',
    },
    {
      id: 'm5',
      who: 'alex',
      text: 'Sweet, thanks! See you all later!',
      at: '3:19 PM',
    },
  ];

  const HEADER_H = 52; // <- tweak to taste
  const COMPOSER_H = 44;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        bgcolor: '#11131A',
        border: '1px solid rgba(255,255,255,0.10)',
        height: { xs: 240, md: '100%' },
        width: '100%', // ✅ add
        overflow: 'hidden',
      }}
    >
      {/* ----- Event Header (sticky inside preview) ----- */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_H,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#0F1118',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <Stack sx={{ minWidth: 0, flex: 1 }} spacing={0.25}>
          <Typography
            variant="subtitle1"
            component="h3"
            noWrap
            sx={{ fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.1 }}
            title={event.title}
          >
            {event.title}
          </Typography>

          <Typography
            variant="caption"
            component="p"
            noWrap
            sx={{ opacity: 0.8, lineHeight: 1.2 }}
            title={`${event.location} · ${event.when}`}
          >
            {event.location} · {event.when}
          </Typography>
        </Stack>
      </Box>

      {/* ----- Scroll Area (chat messages) ----- */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          p: 1.25,
          pt: `calc(${HEADER_H}px + 8px)`,
          pb: `calc(${COMPOSER_H}px + 12px)`,
          WebkitOverflowScrolling: 'touch',
          scrollbarGutter: 'stable',
        }}
      >
        <Stack spacing={1.0}>
          {msgs.map((m, i) => {
            const who = byId[m.who];
            return (
              <Stack
                key={m.id}
                direction="row"
                spacing={1.0}
                alignItems="flex-start"
              >
                <FakeAvatar name={who.name} seed={i} />
                <Stack sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.75} alignItems="baseline">
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 900, letterSpacing: 0.2 }}
                      noWrap
                      title={who.name}
                    >
                      {who.name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {m.at}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.35 }}
                  >
                    {m.text}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      {/* ----- Composer (bottom) ----- */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: COMPOSER_H,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background:
            'linear-gradient(180deg, rgba(11,10,16,0.92), rgba(11,10,16,0.88))',
          backdropFilter: 'saturate(120%) blur(6px)',
        }}
      >
        <Box
          sx={{
            flex: 1,
            height: 30,
            borderRadius: 1,
            bgcolor: '#0F1218',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            px: 1,
            fontSize: 13,
            color: 'rgba(237,235,255,0.8)',
          }}
        >
          Message the band…
        </Box>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1,
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            fontWeight: 900,
            bgcolor: 'rgba(124,58,237,0.25)',
          }}
        >
          <SendIcon />
        </Box>
      </Box>
    </Box>
  );
}

function PreviewRoster() {
  const people = [
    { name: 'Alex Rivera', title: 'Guitar', title2: 'Vocals', role: 'ADMIN' },
    { name: 'Maya Chen', title: 'Vocals', title2: 'Synth', role: 'MEMBER' },
    { name: 'Dre Collins', title: 'Drums', role: 'MEMBER' },
  ];
  return (
    <Box
      sx={{
        borderRadius: 1.5,
        p: 1,
        bgcolor: '#11131A',
        border: '1px solid rgba(255,255,255,0.10)',
        height: { xs: 240, md: '100%' },
        width: '100%', // ✅ add
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Stack spacing={0.75}>
        {people.map((m, i) => (
          <Stack
            key={m.name}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              py: 0.5,
              borderBottom: `1px solid rgba(255,255,255,0.06)`,
              '&:last-of-type': { borderBottom: 'none' },
            }}
          >
            <FakeAvatar name={m.name} seed={i} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap fontWeight={700} fontSize={13}>
                {m.name}
              </Typography>
              <Typography noWrap fontSize={12} sx={{ opacity: 0.75 }}>
                {m.title2 ? `${m.title}, ${m.title2}` : m.title}
              </Typography>
            </Box>
            <RoleTag label={m.role} />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function FakeAvatar({ name, seed = 0 }: { name: string; seed?: number }) {
  let h = 0;
  const key = `${name}:${seed}`;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;

  const hue = h % 360;
  const hue2 = (hue + 30) % 360;
  const emojis = ['🎸', '🎤', '🥁', '🎧', '🎹', '🤘', '🎶', '🪩'];
  const emoji = emojis[h % emojis.length];

  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `1px solid rgba(255,255,255,0.12)`,
        display: 'grid',
        placeItems: 'center',
        fontSize: 14,
        userSelect: 'none',
        background: `radial-gradient(120% 120% at 20% 15%, hsl(${hue} 80% 65% / .95) 0%, hsl(${hue2} 70% 45% / .95) 55%, hsl(${hue} 80% 30% / .95) 100%)`,
        boxShadow:
          'inset 0 0 12px rgba(0,0,0,.25), 0 1px 0 rgba(255,255,255,.06)',
      }}
      aria-label={`${name} avatar`}
      title={name}
    >
      <span style={{ transform: 'translateY(1px)' }}>{emoji}</span>
    </Box>
  );
}

function RoleTag({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.35,
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 900,
        letterSpacing: 0.5,
        bgcolor: alpha(BLURPLE, 0.18),
        border: `1px solid ${alpha(BLURPLE, 0.35)}`,
        color: '#EDEBFF',
      }}
    >
      {label}
    </Box>
  );
}
