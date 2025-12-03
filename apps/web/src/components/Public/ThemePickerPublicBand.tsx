'use client';

import {
  THEMES,
  THEME_OPTIONS,
  type BandPageTheme,
  type ThemeName,
} from '@/themes/publicPageThemes';
import { Box, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

// Crown icon for premium themes
function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}

interface ThemePickerProps {
  currentTheme: ThemeName;
  theme: BandPageTheme;
  bandSlug: string;
  isPremiumBand?: boolean;
}

export function ThemePickerPublicBand({
  currentTheme,
  theme,
  bandSlug,
  isPremiumBand = false,
}: ThemePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Split themes into free and premium
  const freeThemes = THEME_OPTIONS.filter((t) => !t.premium);
  const premiumThemes = THEME_OPTIONS.filter((t) => t.premium);

  // Get current theme label
  const currentThemeOption = THEME_OPTIONS.find((t) => t.key === currentTheme);
  const currentLabel = currentThemeOption?.label || 'Neon';

  const selectTheme = (key: ThemeName) => {
    const themeOption = THEME_OPTIONS.find((t) => t.key === key);
    const isPremiumTheme = themeOption?.premium ?? false;

    // If premium theme selected but band isn't premium, don't allow
    if (isPremiumTheme && !isPremiumBand) {
      // Could show upgrade modal here
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('theme', key);
    router.push(`/b/${bandSlug}?${params.toString()}`, { scroll: false });
    setShowPicker(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 500,
        mx: 'auto',
        mb: 1,
      }}
    >
      {/* Toggle Button */}
      <Box
        component="button"
        onClick={() => setShowPicker(!showPicker)}
        sx={{
          background: theme.showBg,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: 20,
          padding: '8px 20px',
          color: theme.mainTextColor,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backdropFilter: 'blur(20px)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.followButtonBorder,
          },
        }}
      >
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: theme.avatarGlow,
          }}
        />
        {currentLabel.replace(/^⭐+\s*/, '')}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          width="16"
          height="16"
          style={{
            transform: showPicker ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </Box>

      {/* Dropdown */}
      {showPicker && (
        <Box
          sx={{
            mt: 1.5,
            width: '100%',
            background: theme.showBg,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 2,
            padding: 2,
            maxHeight: '70vh',
            overflowY: 'auto',
            animation: 'fadeIn 0.2s ease',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 3,
            },
          }}
        >
          {/* Free Themes */}
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.secondaryTextColor,
              textTransform: 'uppercase',
              letterSpacing: 1,
              mb: 1.5,
            }}
          >
            Free Themes ({freeThemes.length})
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              mb: 2.5,
            }}
          >
            {freeThemes.map(({ key, label }) => {
              const t = THEMES[key];
              const isActive = key === currentTheme;
              return (
                <Box
                  key={key}
                  component="button"
                  onClick={() => selectTheme(key)}
                  sx={{
                    background: isActive
                      ? theme.followButtonBorder
                      : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${
                      isActive ? theme.followButtonBorder : 'transparent'
                    }`,
                    borderRadius: 1.25,
                    padding: '8px 4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: isActive
                        ? theme.followButtonBorder
                        : 'rgba(255,255,255,0.1)',
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: t.avatarGlow,
                      margin: '0 auto 4px',
                      boxShadow: isActive
                        ? '0 0 12px rgba(255,255,255,0.3)'
                        : 'none',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: isActive ? '#fff' : theme.mainTextColor,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Premium Themes */}
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.secondaryTextColor,
              textTransform: 'uppercase',
              letterSpacing: 1,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Box component="span" sx={{ color: '#fbbf24' }}>
              <CrownIcon />
            </Box>
            Premium Themes ({premiumThemes.length})
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
            }}
          >
            {premiumThemes.map(({ key, label }) => {
              const t = THEMES[key];
              const isActive = key === currentTheme;
              const isLocked = !isPremiumBand;
              // Clean label (remove star emojis for display)
              const cleanLabel = label.replace(/^⭐+\s*/, '');
              // Count stars for tier indication
              const starCount = (label.match(/⭐/g) || []).length;

              return (
                <Box
                  key={key}
                  component="button"
                  onClick={() => selectTheme(key)}
                  sx={{
                    background: isActive
                      ? theme.followButtonBorder
                      : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${
                      isActive
                        ? theme.followButtonBorder
                        : isLocked
                        ? 'rgba(251,191,36,0.2)'
                        : 'transparent'
                    }`,
                    borderRadius: 1.25,
                    padding: '8px 4px',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isLocked ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: isLocked
                        ? 'rgba(255,255,255,0.05)'
                        : isActive
                        ? theme.followButtonBorder
                        : 'rgba(255,255,255,0.1)',
                      transform: isLocked ? 'none' : 'scale(1.02)',
                    },
                  }}
                >
                  {/* Tier indicator */}
                  {starCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        display: 'flex',
                        gap: '1px',
                      }}
                    >
                      {[...Array(Math.min(starCount, 3))].map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: '#fbbf24',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: t.avatarGlow,
                      margin: '0 auto 4px',
                      boxShadow: isActive
                        ? '0 0 12px rgba(255,255,255,0.3)'
                        : 'none',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: isActive ? '#fff' : theme.mainTextColor,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cleanLabel}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {!isPremiumBand && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${theme.borderColor}`,
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: theme.secondaryTextColor,
                }}
              >
                ✨ Upgrade to Pro to unlock {premiumThemes.length} premium
                themes
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
