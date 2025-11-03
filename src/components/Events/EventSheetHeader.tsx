'use client';

import { useAttendance } from '@/hooks/useAttendance';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';

type EventLite = {
  title: string;
  type: 'show' | 'practice' | string;
  location?: string | null;
  is_booked?: boolean | null;
};

type TabKey = 'chat' | 'roster' | 'setlist' | 'notes' | 'files';

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
  // unified sub-item text style for details + RSVP text
  const subTextSx = {
    fontSize: 14,
    lineHeight: 1.4,
    opacity: 0.85,
  } as const;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 'env(safe-area-inset-top, 0px)',
        zIndex: (t) => t.zIndex.appBar + 1,
        px: { xs: 2, md: 3 },
        py: { xs: 1.25, md: 1.75 },
        background:
          'linear-gradient(180deg, rgba(11,10,16,0.98), rgba(11,10,16,0.94))',
        borderBottom: '1px solid rgba(155,135,245,0.22)',
        backdropFilter: 'saturate(120%) blur(6px)',
      }}
    >
      {/* Always left-aligned, stacked rows */}
      <Stack spacing={1.0}>
        {/* Row 1: Back + Title + Booked/Unconfirmed */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ flexWrap: 'wrap' }}
        >
          <IconButton
            component={NextLink}
            href={backHref}
            size="small"
            edge="start"
            aria-label="Back"
            centerRipple
            sx={{
              color: 'white',
              p: 0.5,
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
            variant="h5"
            fontWeight={900}
            noWrap
            title={event?.title}
            sx={{ letterSpacing: 0.2, mr: 0.5 }}
          >
            {event?.title || 'Event'}
          </Typography>

          {typeof event?.is_booked === 'boolean' && (
            <Chip
              size="small"
              label={event.is_booked ? 'Booked' : 'Unconfirmed'}
              color={event.is_booked ? 'success' : 'warning'}
              sx={{ height: 20, fontSize: 11, borderRadius: 1 }}
            />
          )}
        </Stack>

        {/* Row 2: Details (same style as RSVP text) */}
        <Typography variant="body2" sx={subTextSx} suppressHydrationWarning>
          {event?.type} · {startsAtLabel}
          {event?.location ? ` · ${event.location}` : ''}
        </Typography>

        {/* Row 3: RSVP (same font sizing; own row on desktop & mobile) */}
        <Box>
          <InlineRSVPTwoState eventId={eventId} textSx={subTextSx} />
        </Box>

        {/* Row 4 (optional): rightActions — still left-aligned on its own row */}
        {rightActions && <Box>{rightActions}</Box>}
      </Stack>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_e, v) => onTabChange(v)}
        textColor="inherit"
        indicatorColor="primary"
        sx={{
          mt: 1,
          mb: 0,
          borderTop: '1px solid rgba(155,135,245,0.22)',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 700,
            letterSpacing: 0.2,
            minHeight: 40,
          },
        }}
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

/* ---------------------- Inline RSVP: Yes / Pending ---------------------- */
function InlineRSVPTwoState({
  eventId,
  textSx,
}: {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textSx?: any; // inherits unified sub text style from parent
}) {
  const { mine, counts, saving, error, update } = useAttendance(eventId);

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
    color: 'success' | 'info';
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
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ px: 0, py: 0 }}
    >
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
          onClick={() => update('accepted')}
          selected={mine === 'accepted'}
          icon={<CheckIcon fontSize="small" />}
          label="Yes"
          color="success"
          aria="RSVP Yes"
        />
        <Pill
          onClick={() => update('pending')}
          selected={mine === 'pending' || mine == null}
          icon={<HourglassEmptyIcon fontSize="small" />}
          label="Pending"
          color="info"
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
  );
}
