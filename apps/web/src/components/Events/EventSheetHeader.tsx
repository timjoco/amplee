/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NextLink from 'next/link';
import * as React from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { supabaseBrowser } from '../../lib/supabaseClient';

type EventLite = {
  title: string;
  type: 'show' | 'practice' | string;
  location?: string | null;
  is_booked?: boolean | null;
};

type TabKey = 'chat' | 'roster' | 'setlist' | 'notes' | 'files';

const HEADER_SHELL_SX = (t: any) => ({
  mb: 2,
  bgcolor: 'background.paper',
  borderRadius: 2,
  px: 2,
  py: 1.25,
  border: `1px solid ${alpha(t.palette.primary.main, 0.08)}`,
});

const SUB_TEXT_SX = {
  fontSize: 14,
  lineHeight: 1.4,
  opacity: 0.85,
} as const;

export default function EventSheetHeader({
  backHref = '/dashboard',
  event,
  startsAtLabel,
  eventId,
  tab,
  onTabChange,
  rightActions,
}: {
  backHref?: string;
  event: EventLite;
  startsAtLabel: string;
  eventId: string;
  tab: TabKey;
  onTabChange: (next: TabKey) => void;
  rightActions?: React.ReactNode;
}) {
  function goBackOr(fallback: string) {
    if (typeof window === 'undefined') return;
    if (
      document.referrer &&
      new URL(document.referrer).origin === window.location.origin
    ) {
      window.history.back();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign(fallback);
  }

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 'env(safe-area-inset-top, 0px)',
        zIndex: (t) => t.zIndex.appBar + 2,
      }}
    >
      <Box sx={HEADER_SHELL_SX}>
        <Stack spacing={1}>
          {/* Title row */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            flexWrap="wrap"
          >
            <IconButton
              component={NextLink}
              href={backHref}
              onClick={(e) => {
                e.preventDefault();
                goBackOr(backHref);
              }}
              size="small"
              edge="start"
              aria-label="Back"
              centerRipple
              sx={{
                color: 'text.primary',
                p: 0.5,
                mr: 0.25,
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                  borderRadius: '9999px',
                },
              }}
            >
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>

            <Typography
              component="h1"
              noWrap
              title={event?.title}
              sx={{
                fontWeight: 900,
                lineHeight: 1.05,
                fontSize: 'clamp(19px, 4vw, 35px)', // matches BandTitleMenu scale
                letterSpacing: 0.2,
                mr: 0.5,
                maxWidth: 'min(80vw, 100%)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {event?.title || 'Event'}
            </Typography>

            {typeof event?.is_booked === 'boolean' &&
              (event.is_booked ? (
                <Chip
                  label="Booked"
                  sx={{
                    bgcolor: '#B6FF68',
                    color: '#193A0A',
                    border: '1px solid #CEFF9E',
                    height: 20,
                    fontSize: 11,
                    borderRadius: 8,
                    '& .MuiChip-label': { px: 1 },
                  }}
                  size="small"
                />
              ) : (
                <Chip
                  label="Pending"
                  sx={{
                    bgcolor: '#E879F9',
                    color: '#33043C',
                    border: '1px solid #F0ABFC',
                    height: 20,
                    fontSize: 11,
                    borderRadius: 8,
                    '& .MuiChip-label': { px: 1 },
                  }}
                  size="small"
                />
              ))}
          </Stack>

          {/* Subline + RSVP + right actions */}
          <Stack spacing={0.75}>
            <Typography
              variant="body2"
              sx={SUB_TEXT_SX}
              suppressHydrationWarning
            >
              {event?.type} · {startsAtLabel}
              {event?.location ? ` · ${event.location}` : ''}
            </Typography>

            <InlineRSVPTwoState eventId={eventId} textSx={SUB_TEXT_SX} />

            {rightActions && <Box sx={{ pt: 0.25 }}>{rightActions}</Box>}
          </Stack>
        </Stack>
      </Box>

      <Tabs
        value={tab}
        onChange={(_e, v) => onTabChange(v)}
        textColor="inherit"
        indicatorColor="primary"
        sx={(t) => ({
          mb: 2,
          borderBottom: '1px solid',
          borderColor: alpha(t.palette.primary.main, 0.18),
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: 0.2,
            minHeight: 40,
          },
        })}
      >
        <Tab label="Chat" value="chat" />
        <Tab label="Roster" value="roster" />
        <Tab label="Setlist" value="setlist" />
        <Tab label="Notes" value="notes" />
        <Tab label="Files" value="files" />
      </Tabs>
    </Box>
  );
}

/* ---------------------- Inline RSVP: Yes / Pending (with confirm) ---------------------- */
function InlineRSVPTwoState({
  eventId,
  textSx,
}: {
  eventId: string;

  textSx?: any;
}) {
  const { mine, counts, saving, error, update } = useAttendance(eventId);

  const [confirm, setConfirm] = React.useState<{
    open: boolean;
    next: 'accepted' | 'pending';
  }>({ open: false, next: 'accepted' });

  const openConfirm = (next: 'accepted' | 'pending') => {
    if (mine === next) return;
    setConfirm({ open: true, next });
  };

  const handleClose = () => setConfirm((c) => ({ ...c, open: false }));

  const sb = React.useMemo(() => supabaseBrowser(), []);
  const handleConfirm = async () => {
    await update(confirm.next);

    const {
      data: { user },
    } = await sb.auth.getUser();
    const userId = user?.id;

    if (userId) {
      window.dispatchEvent(
        new CustomEvent('amplee:rsvp-change', {
          detail: { eventId, userId, next: confirm.next },
        })
      );
    }

    setConfirm((c) => ({ ...c, open: false }));
  };

  const Pill = ({
    onClick,
    selected,
    icon,
    label,
    color,
    aria,
  }: {
    onClick: () => void | Promise<void>;
    selected: boolean;
    icon: React.ReactNode;
    label: string;
    color: 'success' | 'warning';
    aria: string;
  }) => (
    <Button
      onClick={onClick}
      disabled={saving}
      aria-label={aria}
      size="small"
      variant={selected ? 'contained' : 'outlined'}
      color={color}
      sx={{
        minWidth: 36,
        px: 1.25,
        py: 0.25,
        borderRadius: 999,
        lineHeight: 1,
        textTransform: 'none',
        fontWeight: 800,
        borderColor: selected ? 'transparent' : 'rgba(155,135,245,0.24)',
        '& .MuiButton-startIcon': { mr: 0.5 },
      }}
      startIcon={icon}
    >
      <Box sx={{ display: { xs: 'none', md: 'inline' }, ...textSx }}>
        {label}
      </Box>
    </Button>
  );

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="body2"
          sx={{ ...textSx, mr: 0.5, whiteSpace: 'nowrap' }}
        >
          {saving ? (
            'Saving…'
          ) : (
            <>
              Accepted: {counts.accepted}/{counts.total}
            </>
          )}
        </Typography>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Pill
            onClick={() => openConfirm('accepted')}
            selected={mine === 'accepted'}
            icon={<CheckIcon fontSize="small" />}
            label="Yes"
            color="success"
            aria="RSVP Yes"
          />
          <Pill
            onClick={() => openConfirm('pending')}
            selected={mine === 'pending' || mine == null}
            icon={<HourglassEmptyIcon fontSize="small" />}
            label="Pending"
            color="warning"
            aria="Set Pending"
          />
        </Stack>

        {error && (
          <Typography
            variant="body2"
            color="warning.main"
            sx={{ ...textSx, ml: 0.5 }}
          >
            {error}
          </Typography>
        )}
      </Stack>

      {/* Confirm dialog */}
      <Dialog
        open={confirm.open}
        onClose={saving ? undefined : handleClose}
        aria-labelledby="rsvp-confirm-title"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="rsvp-confirm-title" sx={{ fontWeight: 800 }}>
          {confirm.next === 'accepted' ? 'Confirm RSVP' : 'Set as Pending?'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {confirm.next === 'accepted'
              ? 'You’re about to confirm “Yes” for this gig. Notify your band and lock it in?'
              : 'You’re about to set your status to “Pending.” We’ll let the band know you’re unsure.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving} variant="text">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            variant="contained"
            color={confirm.next === 'accepted' ? 'success' : 'warning'}
          >
            {saving
              ? 'Saving…'
              : confirm.next === 'accepted'
              ? 'Confirm Yes'
              : 'Set Pending'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
