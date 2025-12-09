'use client';

import { alpha, createTheme } from '@mui/material';
import * as React from 'react';

export type BandThemeStyle =
  | 'cosmic'
  | 'cosmic-light'
  | 'matrix'
  | 'blocky'
  | 'modest'
  | 'modest-dark'
  | 'sakura';

export function useBandPublicTheme(themeStyle: BandThemeStyle) {
  // Dark themes: cosmic, matrix, modest-dark
  // Light themes: cosmic-light, blocky, modest, sakura
  const themeMode: 'light' | 'dark' =
    themeStyle === 'cosmic-light' ||
    themeStyle === 'blocky' ||
    themeStyle === 'modest' ||
    themeStyle === 'sakura'
      ? 'light'
      : 'dark';

  const theme = React.useMemo(() => {
    // Define theme-specific palettes
    const palettes = {
      cosmic: {
        primary: '#5865F2',
        secondary: '#EB459E',
        background: '#0e0e10',
        paper: '#18181b',
        text: '#ffffff',
        textSecondary: '#a1a1aa',
        divider: 'rgba(255,255,255,0.06)',
      },
      'cosmic-light': {
        primary: '#5865F2',
        secondary: '#EB459E',
        background: '#f8f9fa',
        paper: '#ffffff',
        text: '#1a1a2e',
        textSecondary: '#6b7280',
        divider: 'rgba(0,0,0,0.06)',
      },
      matrix: {
        primary: '#00FF00',
        secondary: '#00CC00',
        background: '#000000',
        paper: '#0a0a0a',
        text: '#00FF00',
        textSecondary: '#00AA00',
        divider: 'rgba(0,255,0,0.15)',
      },
      blocky: {
        primary: '#FF2E6C', // hot pink
        secondary: '#00D4FF', // electric cyan
        background: '#FAFAFA',
        paper: '#FFFFFF',
        text: '#0a0a0a',
        textSecondary: '#525252',
        divider: 'rgba(0,0,0,0.08)',
      },
      modest: {
        primary: '#525252',
        secondary: '#737373',
        background: '#F5F5F5',
        paper: '#FFFFFF',
        text: '#171717',
        textSecondary: '#737373',
        divider: 'rgba(0,0,0,0.06)',
      },
      'modest-dark': {
        primary: '#a3a3a3',
        secondary: '#737373',
        background: '#171717',
        paper: '#262626',
        text: '#f5f5f5',
        textSecondary: '#a3a3a3',
        divider: 'rgba(255,255,255,0.06)',
      },
      sakura: {
        primary: '#F472B6', // cherry blossom pink
        secondary: '#86EFAC', // soft spring green
        background: '#FFF5F7', // very soft pink bg
        paper: '#FFFFFF',
        text: '#831843', // deep rose for contrast
        textSecondary: '#9D174D',
        divider: 'rgba(244, 114, 182, 0.15)',
      },
    };

    const p = palettes[themeStyle];

    return createTheme({
      palette: {
        mode: themeMode,
        primary: { main: p.primary },
        secondary: { main: p.secondary },
        success: { main: themeStyle === 'matrix' ? '#00FF00' : '#57F287' },
        warning: { main: themeStyle === 'matrix' ? '#00FF00' : '#FEE75C' },
        background: {
          default: p.background,
          paper: p.paper,
        },
        text: {
          primary: p.text,
          secondary: p.textSecondary,
        },
        divider: p.divider,
      },
      typography: {
        fontFamily:
          themeStyle === 'matrix'
            ? '"JetBrains Mono", "Fira Code", "SF Mono", monospace'
            : themeStyle === 'blocky'
            ? '"Space Grotesk", "Inter", -apple-system, sans-serif'
            : themeStyle === 'modest' || themeStyle === 'modest-dark'
            ? '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            : themeStyle === 'sakura'
            ? '"Quicksand", "Nunito", -apple-system, BlinkMacSystemFont, sans-serif'
            : '"DM Sans", "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif',
        h1: {
          fontWeight:
            themeStyle === 'blocky'
              ? 900
              : themeStyle === 'modest' || themeStyle === 'modest-dark'
              ? 600
              : themeStyle === 'sakura'
              ? 700
              : 800,
          letterSpacing: themeStyle === 'blocky' ? '-0.04em' : '-0.03em',
          ...(themeStyle === 'matrix' && {
            textTransform: 'uppercase' as const,
          }),
        },
        h2: {
          fontWeight:
            themeStyle === 'modest' || themeStyle === 'modest-dark'
              ? 600
              : themeStyle === 'sakura'
              ? 600
              : 700,
          letterSpacing: themeStyle === 'blocky' ? '-0.03em' : '-0.02em',
        },
        h3: {
          fontWeight:
            themeStyle === 'modest' || themeStyle === 'modest-dark' ? 500 : 700,
          letterSpacing: '-0.01em',
        },
        h6: { fontWeight: 600 },
        button: {
          textTransform:
            themeStyle === 'matrix'
              ? ('uppercase' as const)
              : ('none' as const),
          fontWeight: 600,
          letterSpacing: themeStyle === 'matrix' ? '0.05em' : undefined,
        },
      },
      shape: {
        borderRadius:
          themeStyle === 'modest' || themeStyle === 'modest-dark'
            ? 8
            : themeStyle === 'matrix'
            ? 4
            : themeStyle === 'sakura'
            ? 16
            : 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius:
                themeStyle === 'modest' || themeStyle === 'modest-dark'
                  ? 6
                  : themeStyle === 'matrix'
                  ? 2
                  : themeStyle === 'sakura'
                  ? 20
                  : 10,
              padding: '10px 20px',
              fontSize: '0.9rem',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            contained: {
              ...((themeStyle === 'cosmic' ||
                themeStyle === 'cosmic-light') && {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(88, 101, 242, 0.3)',
                  transform: 'translateY(-2px)',
                },
              }),
              ...(themeStyle === 'matrix' && {
                backgroundColor: '#00FF00',
                color: '#000000',
                boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
                border: '1px solid #00FF00',
                '&:hover': {
                  backgroundColor: '#00CC00',
                  boxShadow:
                    '0 0 20px rgba(0, 255, 0, 0.6), 0 0 40px rgba(0, 255, 0, 0.3)',
                },
              }),
              ...(themeStyle === 'blocky' && {
                backgroundColor: '#FF2E6C',
                color: '#FFFFFF',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#E6295F',
                  boxShadow: '4px 4px 0px #0a0a0a',
                  transform: 'translate(-2px, -2px)',
                },
              }),
              ...(themeStyle === 'modest' && {
                backgroundColor: '#404040',
                color: '#FFFFFF',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#525252',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
              }),
              ...(themeStyle === 'modest-dark' && {
                backgroundColor: '#f5f5f5',
                color: '#171717',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#e5e5e5',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                },
              }),
              ...(themeStyle === 'sakura' && {
                backgroundColor: '#F472B6',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(244, 114, 182, 0.3)',
                '&:hover': {
                  backgroundColor: '#EC4899',
                  boxShadow: '0 6px 20px rgba(244, 114, 182, 0.4)',
                  transform: 'translateY(-2px)',
                },
              }),
            },
            outlined: {
              ...((themeStyle === 'cosmic' ||
                themeStyle === 'cosmic-light') && {
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-1px)',
                },
              }),
              ...(themeStyle === 'matrix' && {
                borderWidth: 1,
                borderColor: '#00FF00',
                color: '#00FF00',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: '#00FF00',
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                  boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
                },
              }),
              ...(themeStyle === 'blocky' && {
                borderWidth: 2,
                borderColor: '#0a0a0a',
                color: '#0a0a0a',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#0a0a0a',
                  backgroundColor: '#0a0a0a',
                  color: '#FFFFFF',
                },
              }),
              ...(themeStyle === 'modest' && {
                borderWidth: 1,
                borderColor: '#d4d4d4',
                color: '#525252',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: '#a3a3a3',
                  backgroundColor: '#fafafa',
                },
              }),
              ...(themeStyle === 'modest-dark' && {
                borderWidth: 1,
                borderColor: '#525252',
                color: '#a3a3a3',
                '&:hover': {
                  borderWidth: 1,
                  borderColor: '#737373',
                  backgroundColor: '#333333',
                },
              }),
              ...(themeStyle === 'sakura' && {
                borderWidth: 2,
                borderColor: '#F9A8D4',
                color: '#BE185D',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#F472B6',
                  backgroundColor: 'rgba(244, 114, 182, 0.1)',
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
              borderRadius:
                themeStyle === 'modest' || themeStyle === 'modest-dark'
                  ? 8
                  : themeStyle === 'matrix'
                  ? 4
                  : themeStyle === 'sakura'
                  ? 20
                  : 16,
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              fontWeight: 500,
              borderRadius:
                themeStyle === 'modest' || themeStyle === 'modest-dark'
                  ? 4
                  : themeStyle === 'matrix'
                  ? 2
                  : themeStyle === 'sakura'
                  ? 12
                  : 8,
              ...(themeStyle === 'matrix' && {
                border: '1px solid #00FF00',
                backgroundColor: 'transparent',
                color: '#00FF00',
              }),
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius:
                themeStyle === 'modest' || themeStyle === 'modest-dark'
                  ? 12
                  : themeStyle === 'matrix'
                  ? 4
                  : themeStyle === 'sakura'
                  ? 24
                  : 20,
              ...(themeStyle === 'matrix' && {
                border: '1px solid #00FF00',
                boxShadow: '0 0 30px rgba(0, 255, 0, 0.2)',
              }),
              ...(themeStyle === 'sakura' && {
                border: '1px solid rgba(244, 114, 182, 0.2)',
                boxShadow: '0 8px 32px rgba(244, 114, 182, 0.15)',
              }),
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius:
                  themeStyle === 'modest' || themeStyle === 'modest-dark'
                    ? 6
                    : themeStyle === 'matrix'
                    ? 2
                    : themeStyle === 'sakura'
                    ? 14
                    : 12,
                ...(themeStyle === 'matrix' && {
                  '& fieldset': {
                    borderColor: '#00AA00',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00FF00',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00FF00',
                    boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
                  },
                }),
                ...(themeStyle === 'sakura' && {
                  '& fieldset': {
                    borderColor: '#FBCFE8',
                  },
                  '&:hover fieldset': {
                    borderColor: '#F9A8D4',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F472B6',
                    boxShadow: '0 0 8px rgba(244, 114, 182, 0.2)',
                  },
                }),
              },
            },
          },
        },
      },
    });
  }, [themeMode, themeStyle]);

  const getCardStyle = React.useCallback(() => {
    switch (themeStyle) {
      case 'matrix':
        return {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #00FF00',
          borderRadius: '4px',
          boxShadow:
            '0 0 20px rgba(0, 255, 0, 0.15), inset 0 0 60px rgba(0, 255, 0, 0.03)',
        };
      case 'blocky':
        return {
          bgcolor: '#FFFFFF',
          border: '2px solid #0a0a0a',
          borderRadius: '4px',
          boxShadow: '6px 6px 0px #0a0a0a',
        };
      case 'modest':
        return {
          bgcolor: '#FFFFFF',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        };
      case 'modest-dark':
        return {
          bgcolor: '#262626',
          border: '1px solid #404040',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        };
      case 'cosmic-light':
        return {
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#5865F2', 0.15)}`,
          borderRadius: '20px',
          boxShadow:
            '0 8px 32px rgba(88, 101, 242, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)',
        };
      case 'sakura':
        return {
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(244, 114, 182, 0.2)',
          borderRadius: '20px',
          boxShadow:
            '0 8px 32px rgba(244, 114, 182, 0.1), 0 4px 16px rgba(0, 0, 0, 0.03)',
        };
      case 'cosmic':
      default:
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

  // Cosmic (both), matrix, sakura get animated backgrounds
  const showAnimatedBackground =
    themeStyle === 'cosmic' ||
    themeStyle === 'cosmic-light' ||
    themeStyle === 'matrix' ||
    themeStyle === 'sakura';

  // Theme-specific background style for the page
  const getBackgroundStyle = React.useCallback(() => {
    switch (themeStyle) {
      case 'matrix':
        return {
          background: '#000000',
        };
      case 'blocky':
        return {
          background: '#FAFAFA',
        };
      case 'modest':
        return {
          background: '#F5F5F5',
        };
      case 'modest-dark':
        return {
          background: '#171717',
        };
      case 'cosmic-light':
        return {
          background:
            'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 50%, #f0f4f8 100%)',
        };
      case 'sakura':
        return {
          background:
            'linear-gradient(135deg, #FFF5F7 0%, #FDF2F8 50%, #FCE7F3 100%)',
        };
      case 'cosmic':
      default:
        return {
          background:
            'linear-gradient(135deg, #0e0e10 0%, #1a1a2e 50%, #16213e 100%)',
        };
    }
  }, [themeStyle]);

  // Accent colors for highlights, links, etc.
  const getAccentColors = React.useCallback(() => {
    switch (themeStyle) {
      case 'matrix':
        return {
          primary: '#00FF00',
          secondary: '#00CC00',
          glow: 'rgba(0, 255, 0, 0.5)',
        };
      case 'blocky':
        return {
          primary: '#FF2E6C',
          secondary: '#00D4FF',
          glow: 'none',
        };
      case 'modest':
        return {
          primary: '#525252',
          secondary: '#737373',
          glow: 'none',
        };
      case 'modest-dark':
        return {
          primary: '#a3a3a3',
          secondary: '#737373',
          glow: 'none',
        };
      case 'cosmic-light':
        return {
          primary: '#5865F2',
          secondary: '#EB459E',
          glow: 'rgba(88, 101, 242, 0.3)',
        };
      case 'sakura':
        return {
          primary: '#F472B6',
          secondary: '#86EFAC',
          glow: 'rgba(244, 114, 182, 0.3)',
        };
      case 'cosmic':
      default:
        return {
          primary: '#5865F2',
          secondary: '#EB459E',
          glow: 'rgba(88, 101, 242, 0.5)',
        };
    }
  }, [themeStyle]);

  return {
    theme,
    themeMode,
    themeStyle,
    showAnimatedBackground,
    getCardStyle,
    getBackgroundStyle,
    getAccentColors,
  };
}
