// SingleRSVPButton.tsx
'use client';

import { NeonIconButton } from '@/components/ui/NeonIconButton';
import CheckIcon from '@mui/icons-material/Check';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { useState } from 'react';

type AttStatus = 'accepted' | 'declined' | 'pending';

export function SingleRSVPButton({
  status,
  saving,
  onChange,
  sizePx = 18,
  iconSizePx = 11,
}: {
  status: AttStatus;
  saving?: boolean;
  onChange: (next: AttStatus) => void;
  sizePx?: number;
  iconSizePx?: number;
}) {
  const [, setAnchorEl] = useState<null | HTMLElement>(null);

  const isAccepted = status === 'accepted';
  const isDeclined = status === 'declined';

  const label = isAccepted ? 'Accepted' : isDeclined ? 'Declined' : "I'm in";

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <NeonIconButton
        title={label}
        colorKey="success" // on-brand purple; use 'success' if you prefer green
        selected={isAccepted}
        disabled={saving}
        onClick={() => onChange(isAccepted ? 'pending' : 'accepted')}
        muted
        sizePx={sizePx}
        iconSizePx={iconSizePx}
      >
        <CheckIcon />
      </NeonIconButton>

      {/* Overflow menu for Decline / Undo Decline */}
      <Tooltip title="More" arrow>
        <span>
          <IconButton
            aria-label="More RSVP options"
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={saving}
            sx={{
              width: sizePx,
              height: sizePx,
              borderRadius: '50%',
            }}
          ></IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
