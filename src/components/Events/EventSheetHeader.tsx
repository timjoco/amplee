'use client';

import AttendanceBar from '@/components/Events/AttendanceBar';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import NextLink from 'next/link';

type EventLite = {
  title: string;
  type: 'show' | 'practice' | string;
  location?: string | null;
  is_booked?: boolean | null;
};

type TabKey = 'chat' | 'setlist' | 'notes' | 'files';

export default function EventSheetHeader({
  backHref = '/dashboard',
  event,
  startsAtLabel,
  eventId,
  tab,
  onTabChange,
  rightActions,
  attendanceBar,
  sx,
}: {
  backHref?: string;
  event: EventLite;
  startsAtLabel: string;
  eventId: string;
  tab: TabKey;
  onTabChange: (next: TabKey) => void;
  rightActions?: React.ReactNode;
  attendanceBar?: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 'env(safe-area-inset-top, 0px)',
        zIndex: (t) => t.zIndex.appBar + 1,
        px: { xs: 2, md: 3 },
        py: { xs: 1.5, md: 2 },
        background:
          'linear-gradient(180deg, rgba(11,10,16,0.98), rgba(11,10,16,0.94))',
        ...sx,
      }}
    >
      {/* Top row */}
      <Box sx={{ minWidth: 0, mb: 1.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ mt: 0.5, flexWrap: 'wrap' }}
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
              '& .MuiTouchRipple-root .MuiTouchRipple-child': {
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
              },
            }}
          >
            <ArrowBackIosIcon />
          </IconButton>

          <Typography
            variant="h5"
            fontWeight={800}
            noWrap
            title={event.title}
            sx={{ mr: 0.5 }}
          >
            {event.title}
          </Typography>

          {typeof event.is_booked === 'boolean' && (
            <Chip
              size="small"
              label={event.is_booked ? 'Booked' : 'Unconfirmed'}
              color={event.is_booked ? 'success' : 'warning'}
            />
          )}

          {!!rightActions && <Box sx={{ ml: 'auto' }}>{rightActions}</Box>}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ mt: 0.5, flexWrap: 'wrap' }}
        >
          <Typography
            variant="body2"
            sx={{ opacity: 0.72, mt: 0.25 }}
            suppressHydrationWarning
          >
            {event.type} · {startsAtLabel}
            {event.location ? ` · ${event.location}` : ''}
          </Typography>
        </Stack>
        <Stack>{attendanceBar ?? <AttendanceBar eventId={eventId} />}</Stack>
      </Box>

      <Tabs
        value={tab}
        onChange={(_e, v) => onTabChange(v)}
        textColor="inherit"
        indicatorColor="primary"
        sx={{ mt: 1, mb: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Tab label="Chat" value="chat" />
        <Tab label="Setlist" value="setlist" />
        <Tab label="Notes" value="notes" />
        <Tab label="Files" value="files" />
      </Tabs>
    </Box>
  );
}
