'use client';

import { Box, Chip, Typography } from '@mui/material';
import type { BandThemeStyle } from './useBandPublicTheme';

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  count?: number;
  themeStyle?: BandThemeStyle;
};

export function SectionHeader({
  icon,
  title,
  count,
  themeStyle = 'cosmic',
}: SectionHeaderProps) {
  const getIconBoxStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          background: 'transparent',
          border: '1px solid #00FF00',
          borderRadius: '4px',
          color: '#00FF00',
          boxShadow: '0 0 10px rgba(0, 255, 0, 0.2)',
        };
      case 'blocky':
        return {
          background: '#FFFFFF',
          border: '2px solid #0a0a0a',
          borderRadius: '4px',
          color: '#FF2E6C',
          boxShadow: '3px 3px 0px #0a0a0a',
        };
      case 'modest':
        return {
          background: '#f5f5f5',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          color: '#525252',
        };
      case 'modest-dark':
        return {
          background: '#333333',
          border: '1px solid #404040',
          borderRadius: '8px',
          color: '#a3a3a3',
        };
      case 'cosmic-light':
        return {
          background:
            'linear-gradient(135deg, rgba(88, 101, 242, 0.15), rgba(235, 69, 158, 0.15))',
          borderRadius: '10px',
          color: '#5865F2',
        };
      case 'sakura':
        return {
          background: 'rgba(244, 114, 182, 0.15)',
          borderRadius: '12px',
          color: '#EC4899',
        };
      case 'cosmic':
      default:
        return {
          background:
            'linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(235, 69, 158, 0.2))',
          borderRadius: '10px',
          color: 'primary.main',
        };
    }
  };

  const getChipStyle = () => {
    switch (themeStyle) {
      case 'matrix':
        return {
          bgcolor: 'transparent',
          border: '1px solid #00FF00',
          color: '#00FF00',
        };
      case 'blocky':
        return {
          bgcolor: '#FF2E6C',
          border: '2px solid #0a0a0a',
          color: '#FFFFFF',
          boxShadow: '2px 2px 0px #0a0a0a',
          borderRadius: '4px',
        };
      case 'modest':
        return {
          bgcolor: '#f5f5f5',
          border: '1px solid #e5e5e5',
          color: '#525252',
        };
      case 'modest-dark':
        return {
          bgcolor: '#333333',
          border: '1px solid #404040',
          color: '#a3a3a3',
        };
      case 'cosmic-light':
        return {
          bgcolor: 'rgba(88, 101, 242, 0.1)',
          color: '#5865F2',
        };
      case 'sakura':
        return {
          bgcolor: 'rgba(244, 114, 182, 0.15)',
          color: '#EC4899',
        };
      case 'cosmic':
      default:
        return {
          bgcolor: 'rgba(88, 101, 242, 0.15)',
          color: 'primary.main',
        };
    }
  };

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
          ...getIconBoxStyle(),
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
          ...(themeStyle === 'matrix' && {
            textShadow: '0 0 8px rgba(0, 255, 0, 0.3)',
          }),
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
            ...getChipStyle(),
          }}
        />
      )}
    </Box>
  );
}
