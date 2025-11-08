/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Slide,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { useRouter } from 'next/navigation';
import { forwardRef, useEffect, useState } from 'react';
import BandAvatarCard from './BandAvatarCard';
import BandBasicsCard from './BandBasicsCard';
import DangerZone from './DangerZone';

const blurActive = () =>
  (document.activeElement as HTMLElement | null)?.blur?.();

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref
) {
  return <Slide direction="up" ref={ref} timeout={220} {...props} />;
});

type Props = {
  bandId: string;
  bandName: string;
  avatarPath?: string;
  isAdmin?: boolean;
};

type Section = 'profile' | 'danger';

export default function BandSettingsDialog({
  bandId,
  bandName,
  avatarPath,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const handleClose = () => {
    blurActive();
    setOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // tokens
  const BG = '#0B0A10';
  const SURFACE = '#101117';
  const SURFACE_ALT = '#0E0F15';
  const BORDER = 'rgba(255,255,255,0.10)';
  const TEXT = 'rgba(255,255,255,0.96)';
  const TEXT_DIM = 'rgba(255,255,255,0.72)';
  const ROW_Y = 2;
  const GAP_Y = 2;

  const isDesktop = useMediaQuery('(min-width:900px)', { noSsr: true });
  const [selected, setSelected] = useState<Section>('profile');

  const ProfileSection = (
    <Box id="profile" sx={{ py: ROW_Y }}>
      <Typography
        variant="h6"
        sx={{ color: TEXT, fontWeight: 800, letterSpacing: 0.2, mb: 0.75 }}
      >
        Band Profile
      </Typography>

      <Typography variant="body2" sx={{ color: TEXT_DIM, mb: 1.5 }}>
        Update your band’s public info. Changes save instantly.
      </Typography>

      <Stack spacing={GAP_Y}>
        <BandBasicsCard bandId={bandId} initialName={bandName} />

        <BandAvatarCard
          bandId={bandId}
          bandName={bandName}
          initialPath={avatarPath}
          compact
        />
      </Stack>
    </Box>
  );

  const DangerSection = (
    <Box id="danger" sx={{ py: ROW_Y }}>
      <Typography
        variant="h6"
        sx={{ color: TEXT, fontWeight: 800, letterSpacing: 0.2, mb: 0.75 }}
      >
        Danger Zone
      </Typography>

      <Typography variant="body2" sx={{ color: TEXT_DIM, mb: 1.5 }}>
        {isAdmin
          ? 'Leave or delete the band. Deleting is permanent.'
          : 'Leave the band.'}
      </Typography>

      <Stack spacing={GAP_Y}>
        <DangerZone bandId={bandId} bandName={bandName} canDelete={!!isAdmin} />
      </Stack>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      TransitionProps={{
        onExit: blurActive,
        onExited: () => {
          router.push(`/bands/${bandId}`);
        },
      }}
      fullScreen
      disableRestoreFocus
      disableAutoFocus
      disableEnforceFocus
      BackdropProps={{
        sx: { backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0,0,0,0.7)' },
      }}
      PaperProps={{
        sx: { bgcolor: BG, color: 'common.white' },
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          right: 12,
          top: 12,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: TEXT_DIM,
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={handleClose}
          autoFocus={false}
          sx={{
            color: TEXT,
            bgcolor: 'rgba(255,255,255,0.06)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          minHeight: '100%',
        }}
      >
        {/* Left rail (desktop only) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            bgcolor: SURFACE_ALT,
            borderRight: `1px solid ${BORDER}`,
            py: 2,
            px: 1.5,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: TEXT_DIM,
              px: 1,
              letterSpacing: 1,
              display: 'block',
              mb: 1.25,
              textTransform: 'uppercase',
            }}
          >
            {bandName}
          </Typography>

          <Stack spacing={0.5}>
            {(['profile', 'danger'] as Section[]).map((s) => {
              const active = selected === s;
              return (
                <Button
                  key={s}
                  onClick={() => setSelected(s)}
                  fullWidth
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: active ? TEXT : TEXT_DIM,
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.5,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    bgcolor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.06)',
                      color: TEXT,
                    },
                  }}
                >
                  {s === 'profile' ? 'Band Profile' : 'Danger Zone'}
                </Button>
              );
            })}
          </Stack>
        </Box>

        <Box
          sx={{
            bgcolor: SURFACE,
            minHeight: '100%',
            px: { xs: 2.5, md: 3 },
            py: { xs: 2, md: 3 },
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 10 },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 8,
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            },
            '& .MuiCard-root': {
              background: 'transparent',
              boxShadow: 'none',
              border: 0,
            },
            '& .MuiCardHeader-root': { px: 0 },
            '& .MuiCardContent-root': { px: 0 },
            '& .MuiFormLabel-root': { color: TEXT_DIM },
            '& .MuiInputBase-root': { color: TEXT, background: 'transparent' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.18)',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
              {
                borderColor: 'rgba(255,255,255,0.26)',
              },
            '& .MuiButton-root': {
              textTransform: 'none',
              fontWeight: 700,
              letterSpacing: 0.2,
              borderRadius: 10,
            },
          }}
        >
          {isDesktop ? (
            selected === 'profile' ? (
              ProfileSection
            ) : (
              DangerSection
            )
          ) : (
            <>
              {ProfileSection}
              <Divider sx={{ borderColor: BORDER }} />
              {DangerSection}
              <Divider sx={{ borderColor: BORDER }} />
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
