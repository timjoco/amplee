'use client';

import { THEME_OPTIONS, type ThemeName } from '@/themes/publicPageThemes';
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

type Props = {
  themeKey: ThemeName;
};

export function ThemePickerPublicBand({ themeKey }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as ThemeName;

    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (value === 'default') {
      params.delete('theme');
    } else {
      params.set('theme', value);
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 320,
        ml: 'auto',
        mb: 2.5,
      }}
    >
      {/* Label above the bubble */}
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.12,
          textTransform: 'uppercase',
          color: 'rgba(148,163,184,0.95)',
          mb: 0.5,
          textAlign: 'right',
        }}
      >
        Band page theme
      </Typography>

      <TextField
        select
        fullWidth
        size="small"
        value={themeKey}
        onChange={handleChange}
        variant="outlined"
        placeholder="Select theme"
        InputLabelProps={{
          shrink: false,
        }}
        sx={{
          '& .MuiInputBase-root': {
            borderRadius: 999,
            fontSize: 13,
            backgroundColor: 'rgba(15,23,42,0.85)',
            color: '#E5E7EB',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 163, 184, 0.7)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(248, 250, 252, 0.9)',
          },
          '& .MuiSvgIcon-root': {
            color: 'rgba(209,213,219,0.9)',
          },
        }}
      >
        {THEME_OPTIONS.map((opt) => (
          <MenuItem key={opt.key} value={opt.key}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
