'use client';

import type { SpecialEffect } from '@/themes/publicPageThemes';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM ANIMATED BACKGROUNDS
// Special effects for premium theme subscribers
// ═══════════════════════════════════════════════════════════════════════════

export function SynthwaveBackground() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {/* Grid floor */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '-50%',
          right: '-50%',
          height: '60%',
          background: `
            linear-gradient(to bottom, transparent 0%, rgba(255, 0, 128, 0.1) 100%),
            repeating-linear-gradient(
              90deg,
              rgba(255, 0, 128, 0.3) 0px,
              rgba(255, 0, 128, 0.3) 1px,
              transparent 1px,
              transparent 80px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(255, 0, 128, 0.3) 0px,
              rgba(255, 0, 128, 0.3) 1px,
              transparent 1px,
              transparent 40px
            )
          `,
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center top',
          '@keyframes gridScroll': {
            '0%': {
              transform: 'perspective(500px) rotateX(60deg) translateY(0)',
            },
            '100%': {
              transform: 'perspective(500px) rotateX(60deg) translateY(40px)',
            },
          },
          animation: 'gridScroll 20s linear infinite',
        }}
      />
      {/* Sun */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '35%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            'linear-gradient(180deg, #ff6b6b 0%, #ffa500 30%, #ff0080 70%, #8b5cf6 100%)',
          filter: 'blur(2px)',
          opacity: 0.8,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg, transparent 0px, transparent 8px, rgba(0,0,0,0.3) 8px, rgba(0,0,0,0.3) 12px)',
            borderRadius: '50%',
          }}
        />
      </Box>
    </Box>
  );
}

export function NeonCityBackground() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {/* Animated neon lines */}
      {[...Array(5)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: `${10 + i * 20}%`,
            top: 0,
            width: 2,
            height: '100%',
            background: `linear-gradient(180deg, transparent, ${
              i % 2 === 0 ? '#00ffff' : '#ff00ff'
            }, transparent)`,
            opacity: 0.3,
            '@keyframes neonPulse': {
              '0%, 100%': { opacity: 0.2 },
              '50%': { opacity: 0.6 },
            },
            animation: `neonPulse ${3 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      {/* City silhouette */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `
            linear-gradient(90deg, 
              transparent 0%, 
              #000 5%, #000 8%, transparent 8%, transparent 12%,
              #000 12%, #000 18%, transparent 18%, transparent 22%,
              #000 22%, #000 35%, transparent 35%, transparent 40%,
              #000 40%, #000 48%, transparent 48%, transparent 55%,
              #000 55%, #000 65%, transparent 65%, transparent 70%,
              #000 70%, #000 78%, transparent 78%, transparent 85%,
              #000 85%, #000 95%, transparent 95%
            )
          `,
          filter: 'drop-shadow(0 -10px 20px rgba(0, 255, 255, 0.3))',
        }}
      />
    </Box>
  );
}

export function HolographicBackground() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '-50%',
          background: `
            conic-gradient(from 0deg at 50% 50%, 
              rgba(255,0,0,0.1), rgba(255,128,0,0.1), rgba(255,255,0,0.1), 
              rgba(0,255,0,0.1), rgba(0,255,255,0.1), rgba(0,128,255,0.1), 
              rgba(128,0,255,0.1), rgba(255,0,128,0.1), rgba(255,0,0,0.1)
            )
          `,
          '@keyframes holoSpin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
          },
          animation: 'holoSpin 30s linear infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          '@keyframes holoPulse': {
            '0%, 100%': { opacity: 0.5 },
            '50%': { opacity: 1 },
          },
          animation: 'holoPulse 8s ease-in-out infinite',
        }}
      />
    </Box>
  );
}

export function AuroraBackground() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {[...Array(3)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: `${10 + i * 15}%`,
            left: '-20%',
            right: '-20%',
            height: 200,
            background: `linear-gradient(90deg, 
              transparent, 
              ${
                [
                  'rgba(34,197,94,0.3)',
                  'rgba(59,130,246,0.3)',
                  'rgba(168,85,247,0.3)',
                ][i]
              }, 
              ${
                [
                  'rgba(59,130,246,0.3)',
                  'rgba(168,85,247,0.3)',
                  'rgba(34,197,94,0.3)',
                ][i]
              }, 
              transparent
            )`,
            filter: 'blur(60px)',
            transform: `translateX(${i * 10}%)`,
            '@keyframes auroraWave': {
              '0%, 100%': { transform: 'translateX(-20%)', opacity: 0.6 },
              '50%': { transform: 'translateX(20%)', opacity: 1 },
            },
            animation: `auroraWave ${15 + i * 5}s ease-in-out infinite`,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
    </Box>
  );
}

export function VaporwaveBackground() {
  // Generate random but stable positions
  const shapes = [
    { left: 15, top: 20, size: 60, type: 0 },
    { left: 75, top: 35, size: 80, type: 1 },
    { left: 45, top: 60, size: 50, type: 2 },
    { left: 25, top: 75, size: 70, type: 0 },
    { left: 85, top: 15, size: 55, type: 1 },
    { left: 55, top: 85, size: 65, type: 2 },
    { left: 10, top: 50, size: 45, type: 0 },
    { left: 65, top: 45, size: 75, type: 1 },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {/* Floating geometric shapes */}
      {shapes.map((shape, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            width: shape.size,
            height: shape.size,
            border: `2px solid rgba(${
              i % 2 === 0 ? '251,146,60' : '244,114,182'
            },0.4)`,
            borderRadius:
              shape.type === 0 ? '50%' : shape.type === 1 ? '0%' : '20%',
            '@keyframes vaporFloat': {
              '0%, 100%': {
                transform: 'translate(0, 0) rotate(0deg)',
                opacity: 0.3,
              },
              '50%': {
                transform: 'translate(20px, -30px) rotate(180deg)',
                opacity: 0.6,
              },
            },
            animation: `vaporFloat ${10 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
      {/* Gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(192, 132, 252, 0.2) 0%, transparent 70%)',
        }}
      />
    </Box>
  );
}

export function GlitchBackground() {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const triggerGlitch = () => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    };

    const interval = setInterval(() => {
      triggerGlitch();
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      {/* Scan lines */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)',
          pointerEvents: 'none',
        }}
      />
      {/* Matrix glow effect */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(0,255,65,0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 70%, rgba(0,255,65,0.1) 0%, transparent 40%)
          `,
        }}
      />
      {/* Glitch overlay */}
      {glitch && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, transparent, rgba(255,0,64,0.1), transparent, rgba(0,255,65,0.1), transparent)',
            transform: `translateX(${Math.random() * 10 - 5}px)`,
          }}
        />
      )}
    </Box>
  );
}

// Main component that renders the appropriate background
interface ThemeBackgroundProps {
  effect: SpecialEffect;
}

export function ThemeBackground({ effect }: ThemeBackgroundProps) {
  switch (effect) {
    case 'synthwave':
      return <SynthwaveBackground />;
    case 'neonCity':
      return <NeonCityBackground />;
    case 'holographic':
      return <HolographicBackground />;
    case 'aurora':
      return <AuroraBackground />;
    case 'vaporwave':
      return <VaporwaveBackground />;
    case 'glitch':
      return <GlitchBackground />;
    default:
      return null;
  }
}
