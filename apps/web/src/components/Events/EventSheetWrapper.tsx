'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';
import FullEventSheet from './EventSheet';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string;
  location: string | null;
  is_booked?: boolean;
  cnt_members?: number;
  cnt_accepted?: number;
};

type Props = {
  bandId: string;
  eventId: string;
  onBack: () => void;
};

export default function EventSheetWrapper({ bandId, eventId, onBack }: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: eventErr } = await sb
        .from('events')
        .select('id, band_id, title, type, starts_at, location, is_booked')
        .eq('id', eventId)
        .maybeSingle();

      if (eventErr) throw eventErr;
      if (!data) throw new Error('Event not found');

      setEvent(data as EventRow);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load event';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sb, eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading event...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            mb: 3,
            pb: 2,
            borderBottom: (t) =>
              `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
          }}
        >
          <IconButton
            onClick={onBack}
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Back to Events
          </Typography>
        </Stack>

        <Box
          sx={{
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: (t) => `1px solid ${alpha(t.palette.error.main, 0.3)}`,
          }}
        >
          <Typography color="error">{error || 'Event not found'}</Typography>
        </Box>
      </Box>
    );
  }

  // Render the full EventSheet but override its positioning to work within BandSheet
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Full event sheet in embedded mode */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <FullEventSheet
          eventId={eventId}
          bandId={bandId}
          initialEvent={event}
          onBack={onBack}
        />
      </Box>
    </Box>
  );
}
