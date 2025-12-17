'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export default function LegalHeader({
  title,
  lastUpdated = 'December 2025',
}: {
  title: string;
  lastUpdated?: string;
}) {
  return (
    <Box>
      <Link
        href="/dashboard"
        aria-label="Go to dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
        }}
      >
        <Image
          src="/logo.png"
          alt="Amplee"
          width={36}
          height={36}
          priority
          style={{ borderRadius: 10 }}
        />
        <Typography
          sx={{ fontWeight: 900, letterSpacing: -0.4, color: '#E8E6F0' }}
        >
          Amplee
        </Typography>
      </Link>

      <Typography
        variant="h2"
        sx={{
          mt: 2,
          fontWeight: 900,
          letterSpacing: -1,
          fontSize: { xs: '2.1rem', md: '2.75rem' },
          background: 'linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </Typography>

      <Typography sx={{ mt: 1, color: 'rgba(232, 230, 240, 0.65)' }}>
        Last updated: {lastUpdated}
      </Typography>
    </Box>
  );
}
