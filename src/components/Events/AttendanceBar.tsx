'use client';

import { NeonIconButton } from '@/components/ui/NeonIconButton';
import { useAttendance } from '@/hooks/useAttendance';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Stack, Typography } from '@mui/material';

export default function AttendanceBar({ eventId }: { eventId: string }) {
  const { mine, counts, saving, error, update } = useAttendance(eventId);
  // NOTE: `mine` should be the raw DB enum: 'accepted' | 'pending' | null

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        py: 1,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        mb: 1.5,
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography variant="body2" sx={{ opacity: 0.85 }}>
        Attendance: {counts.accepted}/{counts.total} accepted
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1 }}>
        {/* CONFIRM -> writes 'accepted' */}
        <NeonIconButton
          title="Confirm"
          colorKey="success"
          selected={mine === 'accepted'}
          disabled={saving}
          onClick={() => update('accepted')}
        >
          <CheckIcon />
        </NeonIconButton>

        {/* SET PENDING (replaces old 'decline') -> writes 'pending' */}
        <NeonIconButton
          title="Set Pending"
          colorKey="error"
          selected={mine === 'pending' || mine == null}
          disabled={saving}
          onClick={() => update('pending')}
        >
          <CloseIcon />
        </NeonIconButton>
      </Stack>

      <Box sx={{ flex: 1 }} />

      {error && (
        <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
