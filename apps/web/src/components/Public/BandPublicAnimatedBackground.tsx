'use client';

import { Box } from '@mui/material';

type AnimatedBackgroundProps = {
  themeMode: 'light' | 'dark';
};

export function AnimatedBackground({ themeMode }: AnimatedBackgroundProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        background:
          themeMode === 'dark'
            ? 'radial-gradient(ellipse at 20% 0%, rgba(88, 101, 242, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(235, 69, 158, 0.1) 0%, transparent 50%), #0e0e10'
            : 'radial-gradient(ellipse at 20% 0%, rgba(88, 101, 242, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(235, 69, 158, 0.06) 0%, transparent 50%), #f8f9fa',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            themeMode === 'dark'
              ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
              : 'none',
          opacity: 0.03,
          pointerEvents: 'none',
        },
      }}
    >
      {[...Array(3)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 200, md: 400 },
            height: { xs: 200, md: 400 },
            borderRadius: '50%',
            background:
              i === 0
                ? 'radial-gradient(circle, rgba(88, 101, 242, 0.2) 0%, transparent 70%)'
                : i === 1
                ? 'radial-gradient(circle, rgba(235, 69, 158, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(87, 242, 135, 0.1) 0%, transparent 70%)',
            top: i === 0 ? '-10%' : i === 1 ? '60%' : '30%',
            left: i === 0 ? '60%' : i === 1 ? '-10%' : '80%',
            animation: `float${i} ${20 + i * 5}s ease-in-out infinite`,
            '@keyframes float0': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(-30px, 20px) scale(1.1)' },
            },
            '@keyframes float1': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(20px, -30px) scale(1.05)' },
            },
            '@keyframes float2': {
              '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
              '50%': { transform: 'translate(-20px, -20px) scale(0.95)' },
            },
            filter: 'blur(60px)',
          }}
        />
      ))}
    </Box>
  );
}
