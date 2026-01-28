'use client';

import { Box, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';

const footerLinks = [
  { label: 'Help Center', href: '/help' },
  { label: 'Support', href: '/support' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Guidelines', href: '/community-guidelines' },
];

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid rgba(139, 92, 246, 0.1)',
        bgcolor: '#050308',
        py: { xs: 3, sm: 4 },
        px: { xs: 3, sm: 4 },
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 2.5, md: 2 }}
          alignItems={{ xs: 'center', md: 'center' }}
          justifyContent="space-between"
        >
          {/* Copyright */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(232, 230, 240, 0.45)',
              fontSize: '0.8125rem',
              order: { xs: 2, md: 1 },
            }}
          >
            © {new Date().getFullYear()} Amplee
          </Typography>

          {/* Links */}
          <Stack
            component="nav"
            direction="row"
            spacing={{ xs: 0.5, sm: 1 }}
            alignItems="center"
            sx={{ order: { xs: 1, md: 2 } }}
          >
            {footerLinks.map((link, index) => (
              <Box
                key={link.href}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Box
                  component={Link}
                  href={link.href}
                  sx={{
                    color: 'rgba(232, 230, 240, 0.6)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    px: { xs: 1, sm: 1.5 },
                    py: 0.75,
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      color: '#A78BFA',
                      bgcolor: 'rgba(139, 92, 246, 0.08)',
                    },
                  }}
                >
                  {link.label}
                </Box>
                {index < footerLinks.length - 1 && (
                  <Box
                    sx={{
                      width: '3px',
                      height: '3px',
                      borderRadius: '50%',
                      bgcolor: 'rgba(232, 230, 240, 0.2)',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
