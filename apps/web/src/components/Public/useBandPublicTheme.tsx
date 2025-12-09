'use client';

import { alpha, createTheme } from '@mui/material';
import * as React from 'react';

export type BandThemeStyle = 'cosmic' | 'mystical' | 'plain';

export function useBandPublicTheme(themeStyle: BandThemeStyle) {
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>('dark');

  // plain = white/light, cosmic + mystical = dark
  React.useEffect(() => {
    if (themeStyle === 'plain') {
      setThemeMode('light');
    } else {
      setThemeMode('dark');
    }
  }, [themeStyle]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: themeStyle === 'plain' ? '#2563eb' : '#5865F2',
          },
          secondary: {
            main: themeStyle === 'plain' ? '#7c3aed' : '#EB459E',
          },
          success: {
            main: '#57F287',
          },
          warning: {
            main: '#FEE75C',
          },
          background: {
            // 🔹 Plain = truly minimal white/gray
            // 🔹 Mystical = soft lilac / light purple (old plain)
            default:
              themeStyle === 'plain'
                ? '#ffffff'
                : themeStyle === 'mystical'
                ? '#f4ecff'
                : themeMode === 'light'
                ? '#f8f9fa'
                : '#0e0e10',
            paper:
              themeStyle === 'plain'
                ? '#ffffff'
                : themeStyle === 'mystical'
                ? '#ffffff'
                : themeMode === 'light'
                ? '#ffffff'
                : '#18181b',
          },
          text: {
            primary: themeMode === 'light' ? '#1a1a1a' : '#ffffff',
            secondary: themeMode === 'light' ? '#6b7280' : '#a1a1aa',
          },
          divider:
            themeMode === 'light'
              ? 'rgba(0,0,0,0.06)'
              : 'rgba(255,255,255,0.06)',
        },
        typography: {
          fontFamily:
            '"DM Sans", "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif',
          h1: {
            fontWeight: 800,
            letterSpacing: '-0.03em',
          },
          h2: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
          },
          h3: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: themeStyle === 'plain' ? 8 : 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: themeStyle === 'plain' ? 6 : 10,
                padding: '10px 20px',
                fontSize: '0.9rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              contained: {
                // Plain = simple blue with minimal effects
                ...(themeStyle === 'plain'
                  ? {
                      backgroundColor: '#2563eb',
                      color: '#FFFFFF',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#1d4ed8',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      },
                    }
                  : // Mystical = light purple (old plain style)
                  themeStyle === 'mystical'
                  ? {
                      backgroundColor: '#A78BFA',
                      color: '#FFFFFF',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#8B5CF6',
                        boxShadow: '0 8px 24px rgba(167, 139, 250, 0.45)',
                        transform: 'translateY(-2px)',
                      },
                    }
                  : // Cosmic = original style
                    {
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(88, 101, 242, 0.3)',
                        transform: 'translateY(-2px)',
                      },
                    }),
              },
              outlined: {
                ...(themeStyle === 'plain'
                  ? {
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      color: '#374151',
                      '&:hover': {
                        borderWidth: 1,
                        borderColor: '#2563eb',
                        backgroundColor: '#f3f4f6',
                      },
                    }
                  : themeStyle === 'mystical'
                  ? {
                      borderWidth: 1,
                      borderColor: '#A78BFA',
                      color: '#4C1D95',
                      '&:hover': {
                        borderWidth: 1,
                        borderColor: '#8B5CF6',
                        backgroundColor: '#F5F3FF',
                        transform: 'translateY(-1px)',
                      },
                    }
                  : {
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-1px)',
                      },
                    }),
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderRadius: themeStyle === 'plain' ? 8 : 16,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
                borderRadius: themeStyle === 'plain' ? 6 : 8,
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: themeStyle === 'plain' ? 12 : 20,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: themeStyle === 'plain' ? 6 : 12,
                },
              },
            },
          },
        },
      }),
    [themeMode, themeStyle]
  );

  const getCardStyle = React.useCallback(() => {
    switch (themeStyle) {
      case 'plain':
        // Truly plain: simple white card with subtle border and minimal shadow
        return {
          bgcolor: '#FFFFFF',
          border: `1px solid #e5e7eb`,
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        };
      case 'mystical':
        // Mystical: soft purple theme (old plain style)
        return {
          bgcolor: '#FFFFFF',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
        };
      case 'cosmic':
      default:
        // Cosmic: glassmorphism effect
        return {
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#fff', 0.08)}`,
          borderRadius: '20px',
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        };
    }
  }, [theme, themeStyle]);

  const showAnimatedBackground =
    themeStyle === 'cosmic' || themeStyle === 'mystical';

  return { theme, themeMode, showAnimatedBackground, getCardStyle };
}
