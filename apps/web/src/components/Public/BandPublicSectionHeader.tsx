'use client';

import { Box, Chip, Typography } from '@mui/material';

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  count?: number;
};

export function SectionHeader({ icon, title, count }: SectionHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '10px',
          background:
            'linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(235, 69, 158, 0.2))',
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>
      {count !== undefined && (
        <Chip
          label={count}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.75rem',
            fontWeight: 600,
            bgcolor: 'rgba(88, 101, 242, 0.15)',
            color: 'primary.main',
          }}
        />
      )}
    </Box>
  );
}
