'use client';

import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import type { BandThemeStyle } from './useBandPublicTheme';

type AnimatedBackgroundProps = {
  themeMode: 'light' | 'dark';
  themeStyle?: BandThemeStyle;
};

// Sakura petal falling animation
function SakuraPetals() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // 👇 from here on, `ctx` is guaranteed non-null for TypeScript
    const ctx = context;

    let animationId: number;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const resizeCanvas = () => {
      const c = canvasRef.current;
      if (!c) return;
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      c.width = viewportWidth;
      c.height = viewportHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Petal {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * viewportWidth;
        this.y = Math.random() * viewportHeight - viewportHeight;
        this.size = Math.random() * 10 + 5;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 1 + 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.opacity = Math.random() * 0.5 + 0.3;
        const pinks = ['#FFB7C5', '#FFC0CB', '#FFD1DC', '#F9A8D4', '#FBCFE8'];
        this.color = pinks[Math.floor(Math.random() * pinks.length)];
      }

      update() {
        this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.y > viewportHeight + 20) {
          this.y = -20;
          this.x = Math.random() * viewportWidth;
        }
      }

      draw() {
        const c = canvasRef.current;
        if (!c) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          this.size / 2,
          -this.size / 2,
          this.size,
          0,
          this.size / 2,
          this.size / 2
        );
        ctx.bezierCurveTo(
          0,
          this.size / 3,
          -this.size / 4,
          this.size / 4,
          0,
          0
        );
        ctx.fill();

        ctx.restore();
      }
    }

    const petals: Petal[] = [];
    const petalCount = 40;
    for (let i = 0; i < petalCount; i++) {
      petals.push(new Petal());
    }

    const animate = () => {
      const c = canvasRef.current;
      if (!c) return;

      ctx.clearRect(0, 0, c.width, c.height);
      petals.forEach((petal) => {
        petal.update();
        petal.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

// Matrix rain canvas component
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const resizeCanvas = () => {
      const c = canvasRef.current;
      if (!c) return;
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      c.width = viewportWidth;
      c.height = viewportHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars =
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charArray = chars.split('');

    const fontSize = 14;

    // columns depend on current width
    let columns = Math.floor(viewportWidth / fontSize);
    let drops: number[] = [];

    const resetDrops = () => {
      columns = Math.floor(viewportWidth / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
      }
    };

    resetDrops();

    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];

        const intensity = Math.random();
        if (intensity > 0.98) {
          ctx.fillStyle = '#FFFFFF';
        } else if (intensity > 0.9) {
          ctx.fillStyle = '#00FF00';
        } else {
          ctx.fillStyle = `rgba(0, ${
            150 + Math.floor(Math.random() * 105)
          }, 0, ${0.5 + Math.random() * 0.5})`;
        }

        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > c.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = window.setInterval(draw, 50);

    // Also recalc columns on resize
    const resizeHandler = () => {
      resizeCanvas();
      resetDrops();
    };
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}

// Cosmic floating orbs (original style)
function CosmicOrbs({ themeMode }: { themeMode: 'light' | 'dark' }) {
  return (
    <>
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
    </>
  );
}

export function AnimatedBackground({
  themeMode,
  themeStyle = 'cosmic',
}: AnimatedBackgroundProps) {
  // Matrix theme - pure black with rain effect
  if (themeStyle === 'matrix') {
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
          background: '#000000',
        }}
      >
        <MatrixRain />
        {/* Subtle vignette effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Scanline effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
            pointerEvents: 'none',
            opacity: 0.3,
          }}
        />
      </Box>
    );
  }

  // Sakura theme - falling petals on soft pink gradient
  if (themeStyle === 'sakura') {
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
            'linear-gradient(180deg, #FFF5F7 0%, #FDF2F8 50%, #FCE7F3 100%)',
        }}
      >
        <SakuraPetals />
        {/* Soft pink orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(244, 114, 182, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '-10%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(251, 207, 232, 0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </Box>
    );
  }

  // Cosmic theme - original floating orbs
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
      <CosmicOrbs themeMode={themeMode} />
    </Box>
  );
}
