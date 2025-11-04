/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ForumIcon from '@mui/icons-material/Forum';
import GroupsIcon from '@mui/icons-material/Groups';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendIcon from '@mui/icons-material/Send';

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';

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
              BETA ACCESS
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
              Simplify the chaos. Amplify the music.
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

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard
              icon={<ForumIcon />}
              title="Your bands virtual green room to help stay on top of your communication"
              caption="Message per-event so details never get lost. Pinned notes keep the plan clear."
            >
              <PreviewChat />
            </FeatureCard>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard
              icon={<GroupsIcon />}
              title="Roster roles that match real bands"
              caption="Mark Admin/Member and add loose roles like guitar, singer, or photographer."
            >
              <PreviewRoster />
            </FeatureCard>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FeatureCard
              icon={<LibraryMusicIcon />}
              title="Setlists you can actually use"
              caption="Fast reordering and a clean stage-ready view."
            >
              <PreviewSetlist />
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
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={(t) => ({
        borderRadius: 2,
        p: 2,
        border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      })}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={() => ({
              width: 28,
              height: 28,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${alpha('#FFFFFF', 0.14)}`,
              bgcolor: alpha('#FFFFFF', 0.04),
              flexShrink: 0,
            })}
          >
            {icon}
          </Box>
          <Typography fontWeight={900}>{title}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: SUBTEXT }}>
          {caption}
        </Typography>
      </Stack>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
    </Paper>
  );
}

/* ------------------------------ Mini Previews ------------------------------ */

function PreviewChat() {
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

  const COMPOSER_H = 44;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        bgcolor: '#11131A',
        border: '1px solid rgba(255,255,255,0.10)',
        height: 260,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          p: 1.25,
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
        border: `1px solid rgba(255,255,255,0.10)`,
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

function PreviewSetlist() {
  return (
    <Box
      sx={{
        borderRadius: 1.5,
        p: 1,
        bgcolor: '#11131A',
        border: `1px solid ${BORDER}`,
      }}
    >
      <Stack spacing={0.5}>
        {[
          'Hot Open Water',
          'Meadowlark and the Blackbird',
          'Drop That Weight',
          'One Key',
          'Head In On My Own',
          'Sweet Times',
        ].map((song, i) => (
          <Stack
            key={song}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              py: 0.5,
              borderBottom: `1px solid ${alpha('#fff', 0.06)}`,
              '&:last-of-type': { borderBottom: 'none' },
            }}
          >
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: 0.75,
                bgcolor: alpha(BLURPLE, 0.22),
                border: `1px solid ${alpha(BLURPLE, 0.45)}`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {i + 1}
            </Box>
            <Typography noWrap fontWeight={700} fontSize={13}>
              {song}
            </Typography>
            <Box sx={{ ml: 'auto', opacity: 0.7, fontSize: 12 }}>3:24</Box>
          </Stack>
        ))}
      </Stack>
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
