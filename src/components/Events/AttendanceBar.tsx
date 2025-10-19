'use client';

import { useAttendance } from '@/hooks/useAttendance';
import { Box, Button, Stack, Typography } from '@mui/material';

export default function AttendanceBar({ eventId }: { eventId: string }) {
  const { mine, counts, saving, error, update } = useAttendance(eventId);

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

      <Box sx={{ flex: 1 }} />

      <Button
        size="small"
        variant={mine === 'accepted' ? 'contained' : 'outlined'}
        onClick={() => update('accepted')}
        disabled={saving}
      >
        Accept
      </Button>

      <Button
        size="small"
        variant={mine === 'declined' ? 'contained' : 'outlined'}
        onClick={() => update('declined')}
        disabled={saving}
      >
        Decline
      </Button>

      {error && (
        <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
