// src/themes/publicPageThemes.ts

// ═══════════════════════════════════════════════════════════════════════════
// AMPLEE PUBLIC BAND PAGE THEMES
// Free themes for all bands, Premium themes for Pro subscribers
// ═══════════════════════════════════════════════════════════════════════════

export type ThemeName =
  | 'midnight'
  | 'ocean'
  | 'ember'
  | 'forest'
  | 'synthwave'
  | 'neonCity'
  | 'holographic'
  | 'aurora'
  | 'vaporwave'
  | 'glitch';

export type SpecialEffect =
  | 'synthwave'
  | 'neonCity'
  | 'holographic'
  | 'aurora'
  | 'vaporwave'
  | 'glitch'
  | null;

export interface BandPageTheme {
  name: string;
  premium: boolean;

  // Background + cards
  bg: string; // main page background
  background: string; // alias for convenience
  cardBg: string;
  cardBorder: string;

  // Accent + text
  accent: string;
  accentGlow: string;
  text: string;
  textMuted: string;
  textGradient: string;

  // Avatar / badges
  avatarRing: string;
  avatarGlow: string;

  // Shell / containers
  showBg: string;
  commentBg: string;
  fieldColor: string;

  // Generic UI colors
  borderColor: string;
  mainTextColor: string;
  secondaryTextColor: string;

  // Buttons / chips
  followButtonBg: string;
  followButtonBorder: string;
  followButtonTextColor: string;

  // Special animated effect key
  special: SpecialEffect;
}

// Core theme definitions
export const THEMES: Record<ThemeName, BandPageTheme> = {
  // ─────────────────── FREE THEMES ───────────────────
  midnight: {
    name: 'Midnight',
    premium: false,
    bg: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    background:
      'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    cardBg: 'rgba(26, 26, 46, 0.85)',
    cardBorder: 'rgba(139, 92, 246, 0.3)',
    accent: '#8b5cf6',
    accentGlow: 'rgba(139, 92, 246, 0.4)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textGradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    avatarRing: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    avatarGlow: '#8b5cf6',
    showBg: 'rgba(15,23,42,0.9)',
    commentBg: 'rgba(15,23,42,0.8)',
    fieldColor: 'rgba(15,23,42,0.95)',
    borderColor: 'rgba(148,163,184,0.4)',
    mainTextColor: '#f9fafb',
    secondaryTextColor: '#9ca3af',
    followButtonBg: 'rgba(15,23,42,0.9)',
    followButtonBorder: '#8b5cf6',
    followButtonTextColor: '#f9fafb',
    special: null,
  },
  ocean: {
    name: 'Ocean',
    premium: false,
    bg: 'linear-gradient(135deg, #0c1929 0%, #0f2744 50%, #1e3a5f 100%)',
    background:
      'linear-gradient(135deg, #0c1929 0%, #0f2744 50%, #1e3a5f 100%)',
    cardBg: 'rgba(15, 39, 68, 0.85)',
    cardBorder: 'rgba(59, 130, 246, 0.3)',
    accent: '#3b82f6',
    accentGlow: 'rgba(59, 130, 246, 0.4)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textGradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    avatarRing: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    avatarGlow: '#3b82f6',
    showBg: 'rgba(15,23,42,0.9)',
    commentBg: 'rgba(15,30,52,0.85)',
    fieldColor: 'rgba(15,30,52,0.95)',
    borderColor: 'rgba(148,163,184,0.4)',
    mainTextColor: '#f9fafb',
    secondaryTextColor: '#9ca3af',
    followButtonBg: 'rgba(15,23,42,0.9)',
    followButtonBorder: '#3b82f6',
    followButtonTextColor: '#f9fafb',
    special: null,
  },
  ember: {
    name: 'Ember',
    premium: false,
    bg: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #3d1a1a 100%)',
    background:
      'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #3d1a1a 100%)',
    cardBg: 'rgba(45, 21, 21, 0.85)',
    cardBorder: 'rgba(239, 68, 68, 0.3)',
    accent: '#ef4444',
    accentGlow: 'rgba(239, 68, 68, 0.4)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textGradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    avatarRing: 'linear-gradient(135deg, #ef4444, #f97316)',
    avatarGlow: '#ef4444',
    showBg: 'rgba(24,16,16,0.9)',
    commentBg: 'rgba(45,21,21,0.9)',
    fieldColor: 'rgba(35,15,15,0.95)',
    borderColor: 'rgba(239,68,68,0.4)',
    mainTextColor: '#f9fafb',
    secondaryTextColor: '#fecaca',
    followButtonBg: 'rgba(24,16,16,0.9)',
    followButtonBorder: '#ef4444',
    followButtonTextColor: '#fef2f2',
    special: null,
  },
  forest: {
    name: 'Forest',
    premium: false,
    bg: 'linear-gradient(135deg, #0a1a0f 0%, #152e1a 50%, #1a3d22 100%)',
    background:
      'linear-gradient(135deg, #0a1a0f 0%, #152e1a 50%, #1a3d22 100%)',
    cardBg: 'rgba(21, 46, 26, 0.85)',
    cardBorder: 'rgba(34, 197, 94, 0.3)',
    accent: '#22c55e',
    accentGlow: 'rgba(34, 197, 94, 0.4)',
    text: '#f8fafc',
    textMuted: '#bbf7d0',
    textGradient: 'linear-gradient(135deg, #22c55e, #84cc16)',
    avatarRing: 'linear-gradient(135deg, #22c55e, #84cc16)',
    avatarGlow: '#22c55e',
    showBg: 'rgba(10,25,15,0.9)',
    commentBg: 'rgba(21,46,26,0.9)',
    fieldColor: 'rgba(15,35,20,0.95)',
    borderColor: 'rgba(34,197,94,0.4)',
    mainTextColor: '#ecfdf3',
    secondaryTextColor: '#bbf7d0',
    followButtonBg: 'rgba(10,25,15,0.9)',
    followButtonBorder: '#22c55e',
    followButtonTextColor: '#ecfdf3',
    special: null,
  },

  // ─────────────────── PREMIUM THEMES ───────────────────
  synthwave: {
    name: 'Synthwave',
    premium: true,
    bg: 'linear-gradient(180deg, #0f0520 0%, #1a0a30 30%, #2d0f4a 60%, #0f0520 100%)',
    background:
      'linear-gradient(180deg, #0f0520 0%, #1a0a30 30%, #2d0f4a 60%, #0f0520 100%)',
    cardBg: 'rgba(26, 10, 48, 0.9)',
    cardBorder: 'rgba(255, 0, 128, 0.4)',
    accent: '#ff0080',
    accentGlow: 'rgba(255, 0, 128, 0.5)',
    text: '#ffffff',
    textMuted: '#c4b5fd',
    textGradient: 'linear-gradient(135deg, #ff0080, #00ffff)',
    avatarRing: 'linear-gradient(135deg, #ff0080, #00ffff, #ff0080)',
    avatarGlow: '#ff0080',
    showBg: 'rgba(15,6,32,0.9)',
    commentBg: 'rgba(26,10,48,0.9)',
    fieldColor: 'rgba(26,10,48,0.95)',
    borderColor: 'rgba(148,163,184,0.4)',
    mainTextColor: '#f9fafb',
    secondaryTextColor: '#a5b4fc',
    followButtonBg: 'rgba(15,6,32,0.9)',
    followButtonBorder: '#ff0080',
    followButtonTextColor: '#f9fafb',
    special: 'synthwave',
  },
  neonCity: {
    name: 'Neon City',
    premium: true,
    bg: 'linear-gradient(180deg, #000814 0%, #001d3d 50%, #000814 100%)',
    background:
      'linear-gradient(180deg, #000814 0%, #001d3d 50%, #000814 100%)',
    cardBg: 'rgba(0, 29, 61, 0.9)',
    cardBorder: 'rgba(0, 255, 255, 0.4)',
    accent: '#00ffff',
    accentGlow: 'rgba(0, 255, 255, 0.5)',
    text: '#ffffff',
    textMuted: '#7dd3fc',
    textGradient: 'linear-gradient(135deg, #00ffff, #ff00ff)',
    avatarRing: 'linear-gradient(135deg, #00ffff, #ff00ff)',
    avatarGlow: '#00ffff',
    showBg: 'rgba(8,15,30,0.9)',
    commentBg: 'rgba(0,29,61,0.9)',
    fieldColor: 'rgba(0,29,61,0.95)',
    borderColor: 'rgba(0,255,255,0.4)',
    mainTextColor: '#e0f2fe',
    secondaryTextColor: '#7dd3fc',
    followButtonBg: 'rgba(8,15,30,0.9)',
    followButtonBorder: '#00ffff',
    followButtonTextColor: '#e0f2fe',
    special: 'neonCity',
  },
  holographic: {
    name: 'Holographic',
    premium: true,
    bg: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    cardBg: 'rgba(26, 26, 46, 0.75)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    accent: '#ffffff',
    accentGlow: 'rgba(255, 255, 255, 0.3)',
    text: '#ffffff',
    textMuted: '#a5b4fc',
    textGradient:
      'linear-gradient(135deg, #22c55e, #3b82f6, #a855f7, #ec4899, #f97316)',
    avatarRing:
      'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff0080, #ff0000)',
    avatarGlow: '#ffffff',
    showBg: 'rgba(15,23,42,0.9)',
    commentBg: 'rgba(26,26,46,0.9)',
    fieldColor: 'rgba(26,26,46,0.95)',
    borderColor: 'rgba(148,163,184,0.4)',
    mainTextColor: '#f9fafb',
    secondaryTextColor: '#a5b4fc',
    followButtonBg: 'rgba(15,23,42,0.9)',
    followButtonBorder: '#ffffff',
    followButtonTextColor: '#f9fafb',
    special: 'holographic',
  },
  aurora: {
    name: 'Aurora',
    premium: true,
    bg: 'linear-gradient(180deg, #0a0a1a 0%, #0f1a2a 50%, #0a0a1a 100%)',
    background:
      'linear-gradient(180deg, #0a0a1a 0%, #0f1a2a 50%, #0a0a1a 100%)',
    cardBg: 'rgba(15, 26, 42, 0.85)',
    cardBorder: 'rgba(74, 222, 128, 0.3)',
    accent: '#4ade80',
    accentGlow: 'rgba(74, 222, 128, 0.4)',
    text: '#ffffff',
    textMuted: '#86efac',
    textGradient: 'linear-gradient(135deg, #22c55e, #3b82f6, #a855f7)',
    avatarRing: 'linear-gradient(135deg, #22c55e, #3b82f6, #a855f7)',
    avatarGlow: '#4ade80',
    showBg: 'rgba(15,23,42,0.9)',
    commentBg: 'rgba(15,26,42,0.9)',
    fieldColor: 'rgba(15,26,42,0.95)',
    borderColor: 'rgba(74,222,128,0.4)',
    mainTextColor: '#ecfdf3',
    secondaryTextColor: '#86efac',
    followButtonBg: 'rgba(15,23,42,0.9)',
    followButtonBorder: '#4ade80',
    followButtonTextColor: '#ecfdf3',
    special: 'aurora',
  },
  vaporwave: {
    name: 'Vaporwave',
    premium: true,
    bg: 'linear-gradient(180deg, #1a0a30 0%, #2d1050 50%, #1a0a30 100%)',
    background:
      'linear-gradient(180deg, #1a0a30 0%, #2d1050 50%, #1a0a30 100%)',
    cardBg: 'rgba(45, 16, 80, 0.85)',
    cardBorder: 'rgba(251, 146, 60, 0.4)',
    accent: '#fb923c',
    accentGlow: 'rgba(251, 146, 60, 0.4)',
    text: '#fef3c7',
    textMuted: '#fcd34d',
    textGradient: 'linear-gradient(135deg, #f472b6, #fb923c, #c084fc)',
    avatarRing: 'linear-gradient(135deg, #fb923c, #f472b6, #c084fc)',
    avatarGlow: '#fb923c',
    showBg: 'rgba(24,16,48,0.9)',
    commentBg: 'rgba(45,16,80,0.9)',
    fieldColor: 'rgba(38,14,68,0.95)',
    borderColor: 'rgba(251,146,60,0.4)',
    mainTextColor: '#fef3c7',
    secondaryTextColor: '#fde68a',
    followButtonBg: 'rgba(24,16,48,0.9)',
    followButtonBorder: '#fb923c',
    followButtonTextColor: '#fef3c7',
    special: 'vaporwave',
  },
  glitch: {
    name: 'Glitch',
    premium: true,
    bg: '#0a0a0a',
    background: '#0a0a0a',
    cardBg: 'rgba(20, 20, 20, 0.95)',
    cardBorder: 'rgba(0, 255, 65, 0.5)',
    accent: '#00ff41',
    accentGlow: 'rgba(0, 255, 65, 0.5)',
    text: '#00ff41',
    textMuted: '#00cc33',
    textGradient: 'linear-gradient(135deg, #00ff41, #ff0040)',
    avatarRing: 'linear-gradient(135deg, #00ff41, #ff0040, #00ff41)',
    avatarGlow: '#00ff41',
    showBg: 'rgba(10,10,10,0.95)',
    commentBg: 'rgba(15,15,15,0.95)',
    fieldColor: 'rgba(15,15,15,0.98)',
    borderColor: 'rgba(0,255,65,0.4)',
    mainTextColor: '#e5ffe8',
    secondaryTextColor: '#00cc33',
    followButtonBg: 'rgba(10,10,10,0.95)',
    followButtonBorder: '#00ff41',
    followButtonTextColor: '#e5ffe8',
    special: 'glitch',
  },
};

export const FREE_THEMES: ThemeName[] = [
  'midnight',
  'ocean',
  'ember',
  'forest',
];

export const PREMIUM_THEMES: ThemeName[] = [
  'synthwave',
  'neonCity',
  'holographic',
  'aurora',
  'vaporwave',
  'glitch',
];

// For the picker
export const THEME_OPTIONS: {
  key: ThemeName;
  label: string;
  premium: boolean;
}[] = [
  { key: 'midnight', label: 'Midnight', premium: false },
  { key: 'ocean', label: 'Ocean', premium: false },
  { key: 'ember', label: 'Ember', premium: false },
  { key: 'forest', label: 'Forest', premium: false },

  { key: 'synthwave', label: '⭐ Synthwave', premium: true },
  { key: 'neonCity', label: '⭐ Neon City', premium: true },
  { key: 'holographic', label: '⭐ Holographic', premium: true },
  { key: 'aurora', label: '⭐ Aurora', premium: true },
  { key: 'vaporwave', label: '⭐ Vaporwave', premium: true },
  { key: 'glitch', label: '⭐ Glitch', premium: true },
];

export const ALL_THEME_KEYS = Object.keys(THEMES) as ThemeName[];

export function isValidTheme(key: string): key is ThemeName {
  return ALL_THEME_KEYS.includes(key as ThemeName);
}

export function getTheme(key: string): BandPageTheme {
  if (isValidTheme(key)) return THEMES[key];
  return THEMES.midnight;
}

export function isLightAccent(accent: string): boolean {
  return ['#fff', '#00ffff', '#00ff41', '#4ade80'].includes(accent);
}

// Simple dark flag – right now all are dark, but keep hook
export function isDarkTheme(_key: ThemeName): boolean {
  return true;
}
