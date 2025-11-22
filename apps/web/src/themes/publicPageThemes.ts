export type ThemeName =
  | 'default'
  | 'cherry'
  | 'white'
  | 'woods'
  | 'deepPurple'
  | 'banana'
  | 'samus'
  | 'liquidDeath'
  | 'blackout'
  | 'money'
  | 'silver'
  | 'onepiece'
  | 'chocolate'
  | 'bioshock'
  | 'mario'
  | 'mattePurple'
  | 'matteYellow'
  | 'matteRed'
  | 'citySky'
  | 'royalty'
  | 'tacos'
  | 'heyLow'
  | 'pumpkin'
  | 'google'
  | 'pastel'
  | 'pepsi'
  | 'metalGear'
  | 'quietHill'
  | 'oldRing'
  | 'nightrain'
  | 'zoroWano'
  | 'spiderman'
  | 'batman'
  | 'sunflowers'
  | 'garden'
  | 'rainbow'
  | 'sunnyDay'
  | 'neonBlackout'
  | 'acousticOm42'
  | 'darthVader'
  | 'ice'
  | 'purpleCascade'
  | 'zelda'
  | 'coffee'
  | 'amplee'
  | 'retroCalc'
  | 'cosmicVortex' // ⭐ PREMIUM
  | 'holographicDream' // ⭐ PREMIUM
  | 'cyberpunkNeon' // ⭐ PREMIUM
  | 'auraBorealis' // ⭐ PREMIUM
  | 'quantumRealm'
  | 'premiumSakura' // ⭐⭐ ULTRA PREMIUM
  | 'stellarOdyssey';

export const DARK_THEMES: ThemeName[] = [
  'default',
  'deepPurple',
  'samus',
  'liquidDeath',
  'blackout',
  'bioshock',
  'mario',
  'mattePurple',
  'matteYellow',
  'matteRed',
  'royalty',
  'tacos',
  'heyLow',
  'pumpkin',
  'google',
  'pepsi',
  'metalGear',
  'quietHill',
  'oldRing',
  'nightrain',
  'zoroWano',
  'spiderman',
  'batman',
  'neonBlackout',
  'darthVader',
  'purpleCascade',
  'zelda',
  'coffee',
  'amplee',
  'cosmicVortex', // ⭐ PREMIUM
  'holographicDream', // ⭐ PREMIUM
  'cyberpunkNeon', // ⭐ PREMIUM
  'quantumRealm', // ⭐ PREMIUM
  'stellarOdyssey',
];

export function isDarkTheme(key: ThemeName) {
  return DARK_THEMES.includes(key);
}

export type BandPageTheme = {
  background: string;
  avatarGlow: string;
  textGradient: string;
  showBg: string;
  borderColor: string;
  followButtonBg: string;
  followButtonBorder: string;
  followButtonTextColor: string;
  mainTextColor: string;
  secondaryTextColor: string;
  fieldColor: string;
  commentBg: string;
};

const retroCalcTheme: BandPageTheme = {
  background: `
    linear-gradient(
      180deg,
      #1f2933 0%,
      #111827 40%,
      #020617 100%
    )
  `,
  avatarGlow: 'linear-gradient(135deg, #4b5563, #9ca3af)',
  textGradient: 'linear-gradient(135deg, #0b1120, #1f2937)',
  showBg: 'rgba(203, 213, 225, 0.9)',
  borderColor: '#4b5563',
  followButtonBg: '#111827',
  followButtonBorder: '#9ca3af',
  followButtonTextColor: '#e5e7eb',
  mainTextColor: '#e5e7eb',
  secondaryTextColor: '#cbd5f5',
  fieldColor: 'rgba(209, 250, 229, 0.9)',
  commentBg: 'rgba(226, 232, 240, 0.95)',
};

const neonBlackoutTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 10% 0%, rgba(236, 72, 153, 0.25) 0%, transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(56, 189, 248, 0.22) 0%, transparent 50%),
    radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 55%),
    linear-gradient(180deg, #000000 0%, #020617 40%, #000000 100%)
  `,
  avatarGlow:
    'conic-gradient(from 140deg, #22C55E, #8B5CF6, #EC4899, #22D3EE, #22C55E)',
  textGradient: 'linear-gradient(135deg, #FFFFFF, #A855F7)',
  showBg: 'rgba(3, 7, 18, 0.95)',
  borderColor: 'rgba(168, 85, 247, 0.9)',
  followButtonBg: 'rgba(0, 0, 0, 0.9)',
  followButtonBorder: 'rgba(34, 197, 94, 0.9)',
  followButtonTextColor: '#F9FAFB',
  mainTextColor: '#F9FAFB',
  secondaryTextColor: '#A5B4FC',
  fieldColor: 'rgba(15, 23, 42, 0.98)',
  commentBg: 'rgba(10, 16, 36, 0.98)',
};
const acousticOm42Theme: BandPageTheme = {
  background: `
    radial-gradient(circle at 0% 0%, #FFF7E3 0%, rgba(255,247,227,0) 45%),
    linear-gradient(180deg, #FDECC8 0%, #D9A066 40%, #7B4A23 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #F5E6D3, #D9A066)',
  textGradient: 'linear-gradient(135deg, #4B341F, #F5E6D3)',
  showBg: 'rgba(255, 249, 238, 0.96)',
  borderColor: '#D9A066',
  followButtonBg: '#F5E6D3',
  followButtonBorder: '#C47A3D',
  followButtonTextColor: '#3B2714',
  mainTextColor: '#3B2714',
  secondaryTextColor: '#6B4A2E',
  fieldColor: 'rgba(255, 249, 240, 0.98)',
  commentBg: 'rgba(255, 252, 245, 0.98)',
};
const darthVaderTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 15% 0%, rgba(239, 68, 68, 0.35) 0%, transparent 45%),
    radial-gradient(circle at 85% 10%, rgba(127, 29, 29, 0.35) 0%, transparent 50%),
    linear-gradient(180deg, #020617 0%, #02020A 40%, #000000 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #EF4444, #991B1B)',
  textGradient: 'linear-gradient(135deg, #FCA5A5, #EF4444)',
  showBg: 'rgba(6, 6, 10, 0.96)',
  borderColor: '#EF4444',
  followButtonBg: '#111827',
  followButtonBorder: '#DC2626',
  followButtonTextColor: '#FEE2E2',
  mainTextColor: '#F9FAFB',
  secondaryTextColor: '#FCA5A5',
  fieldColor: 'rgba(15, 23, 42, 0.97)',
  commentBg: 'rgba(10, 10, 16, 0.98)',
};
const iceTheme: BandPageTheme = {
  background: `
    linear-gradient(
      180deg,
      #edfcff 0%,
      #d4f7ff 35%,
      #bedeff 70%,
      #98ccff 100%
    )
  `,
  avatarGlow: 'linear-gradient(135deg, #b3f1ff, #98ccff)',
  textGradient: 'linear-gradient(135deg, #0f172a, #2563eb)',
  showBg: 'rgba(255, 255, 255, 0.96)',
  borderColor: '#98ccff',
  followButtonBg: '#0ea5e9',
  followButtonBorder: '#0284c7',
  followButtonTextColor: '#f9fafb',
  mainTextColor: '#0f172a',
  secondaryTextColor: '#1f2937',
  fieldColor: 'rgba(237, 252, 255, 0.98)',
  commentBg: 'rgba(255, 255, 255, 0.98)',
};

const purpleCascadeTheme: BandPageTheme = {
  background: `
    linear-gradient(
      135deg,
      #2d00f7 0%,
      #6a00f4 10%,
      #8900f2 20%,
      #a100f2 30%,
      #b100e8 40%,
      #bc00dd 50%,
      #d100d1 60%,
      #db00b6 70%,
      #e500a4 80%,
      #f20089 100%
    )
  `,
  avatarGlow:
    'conic-gradient(from 140deg, #2d00f7, #6a00f4, #8900f2, #bc00dd, #f20089, #e500a4, #d100d1, #2d00f7)',
  textGradient: 'linear-gradient(135deg, #ffffff, #f9a8ff)',
  showBg: 'rgba(9, 9, 20, 0.96)',
  borderColor: '#f20089',
  followButtonBg: '#2d00f7',
  followButtonBorder: '#f20089',
  followButtonTextColor: '#fdf2ff',
  mainTextColor: '#f9fafb',
  secondaryTextColor: '#e5e7eb',
  fieldColor: 'rgba(15, 23, 42, 0.97)',
  commentBg: 'rgba(14, 11, 30, 0.98)',
};
const zeldaTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 0% 0%, #d4ce46 0%, rgba(212,206,70,0) 45%),
    linear-gradient(180deg, #0e5135 0%, #0d9263 40%, #494b4b 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #d4ce46, #4aba91)',
  textGradient: 'linear-gradient(135deg, #fefce8, #d4ce46)',
  showBg: 'rgba(9, 41, 32, 0.94)',
  borderColor: '#4aba91',
  followButtonBg: '#0d9263',
  followButtonBorder: '#d4ce46',
  followButtonTextColor: '#022c22',
  mainTextColor: '#ecfdf3',
  secondaryTextColor: '#a7f3d0',
  fieldColor: 'rgba(8, 36, 28, 0.97)',
  commentBg: 'rgba(9, 40, 30, 0.97)',
};
const coffeeTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 0% 0%, #f7f6da 0%, rgba(247,246,218,0) 40%),
    linear-gradient(180deg, #c9a388 0%, #9b856c 45%, #301d06 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #f7f6da, #c9a388)',
  textGradient: 'linear-gradient(135deg, #f7f6da, #c9a388)',
  showBg: 'rgba(247, 246, 218, 0.96)',
  borderColor: '#9b856c',
  followButtonBg: '#c9a388',
  followButtonBorder: '#5e4614',
  followButtonTextColor: '#301d06',
  mainTextColor: '#301d06',
  secondaryTextColor: '#5e4614',
  fieldColor: 'rgba(250, 248, 228, 0.98)',
  commentBg: 'rgba(250, 247, 230, 0.98)',
};
const ampleeTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 0% 0%, rgba(110,64,248,0.2) 0%, transparent 40%),
    radial-gradient(circle at 100% 0%, rgba(139,92,255,0.18) 0%, transparent 45%),
    linear-gradient(180deg, #020617 0%, #050816 40%, #0B1020 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #6E40F8, #A78BFA)',
  textGradient: 'linear-gradient(135deg, #ffffff, #8B5CFF)',
  showBg: 'rgba(5, 8, 22, 0.96)',
  borderColor: '#312E81',
  followButtonBg: '#0B1020',
  followButtonBorder: '#6E40F8',
  followButtonTextColor: '#E5E7EB',
  mainTextColor: '#F9FAFB',
  secondaryTextColor: '#A5B4FC',
  fieldColor: 'rgba(15, 23, 42, 0.97)',
  commentBg: 'rgba(8, 11, 24, 0.97)',
};
const blackoutTheme: BandPageTheme = {
  background: '#000000',
  avatarGlow: 'linear-gradient(135deg, #444444, #111111)',
  textGradient: 'linear-gradient(135deg, #ffffff, #cccccc)',
  showBg: 'rgba(255, 255, 255, 0.1)',
  borderColor: 'rgba(255, 255, 255, 0.3)',
  followButtonBg: 'rgba(255, 255, 255, 0.1)',
  followButtonBorder: 'rgba(255, 255, 255, 0.3)',
  followButtonTextColor: '#ffffff',
  mainTextColor: '#ffffff',
  secondaryTextColor: '#cccccc',
  fieldColor: 'rgba(173, 168, 169, 0.8)',
  commentBg: 'rgba(18, 18, 18, 0.98)',
};

const moneyTheme: BandPageTheme = {
  background: '#00ff00',
  avatarGlow: 'linear-gradient(135deg, #aaffaa, #007700)',
  textGradient: 'linear-gradient(135deg, #333333, #ffffff)',
  showBg: 'rgba(0, 255, 0, 0.1)',
  borderColor: 'rgba(0, 128, 0, 0.6)',
  followButtonBg: 'rgba(0, 200, 0, 0.8)',
  followButtonBorder: 'rgba(0, 150, 0, 0.6)',
  followButtonTextColor: '#ffffff',
  mainTextColor: '#111111',
  secondaryTextColor: '#555555',
  fieldColor: 'rgba(235, 255, 240, 0.98)',
  commentBg: 'rgba(235, 255, 240, 0.96)',
};

const silverTheme: BandPageTheme = {
  background: '#C0C0C0',
  avatarGlow: 'linear-gradient(135deg, #ffffff, #a0a0a0)',
  textGradient: 'linear-gradient(135deg, #333333, #ffffff)',
  showBg: 'rgba(192, 192, 192, 0.1)',
  borderColor: 'rgba(128, 128, 128, 0.6)',
  followButtonBg: 'rgba(192, 192, 192, 0.8)',
  followButtonBorder: 'rgba(128, 128, 128, 0.6)',
  followButtonTextColor: '#000000',
  mainTextColor: '#000000',
  secondaryTextColor: '#444444',
  fieldColor: 'rgba(250, 250, 250, 0.96)',
  commentBg: 'rgba(248, 248, 248, 0.96)',
};

const onepieceTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 20% 0%, #FFCE00 0%, rgba(255, 206, 0, 0) 45%),
    radial-gradient(circle at 80% 0%, #60BFF5 0%, rgba(96, 191, 245, 0) 50%),
    linear-gradient(180deg, #60BFF5 0%, #2E63A4 45%, #000000 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #60BFF5, #2E63A4)',
  textGradient: 'linear-gradient(135deg, #D70000, #FFCE00)',
  showBg: 'rgba(0, 0, 0, 0.35)',
  borderColor: '#AF6528',
  followButtonBg: '#FFCE00',
  followButtonBorder: '#D70000',
  followButtonTextColor: '#000000',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#60BFF5',
  fieldColor: 'rgba(46, 99, 164, 0.92)',
  commentBg: 'rgba(0, 18, 48, 0.96)',
};

const cherryBlossomTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #ffe4e1, #fff0f5)',
  avatarGlow: 'linear-gradient(135deg, #ffb6c1, #ff69b4)',
  textGradient: 'linear-gradient(135deg, #ff69b4, #ffb6c1)',
  showBg: 'rgba(255, 192, 203, 0.7)',
  borderColor: 'rgba(255, 105, 180, 0.6)',
  followButtonBg: 'rgba(255, 182, 193, 0.8)',
  followButtonBorder: 'rgba(255, 105, 180, 0.7)',
  followButtonTextColor: '#d81b60',
  mainTextColor: '#d81b60',
  secondaryTextColor: '#6d4c41',
  fieldColor: 'rgba(255, 244, 248, 0.96)',
  commentBg: 'rgba(255, 244, 248, 0.96)',
};

const whiteTheme: BandPageTheme = {
  background: '#ffffff',
  avatarGlow: '#e0e0e0',
  textGradient: '#333333',
  showBg: 'rgba(240, 240, 240, 0.5)',
  borderColor: 'rgba(0, 0, 0, 0.1)',
  followButtonBg: '#f9f9f9',
  followButtonBorder: 'rgba(0, 0, 0, 0.2)',
  followButtonTextColor: '#333333',
  mainTextColor: '#000000',
  secondaryTextColor: '#555555',
  fieldColor: 'rgba(245, 245, 245, 0.96)',
  commentBg: 'rgba(255, 255, 255, 0.98)',
};

const treesAndWoodsTheme: BandPageTheme = {
  background: '#f0f8ff',
  avatarGlow: 'linear-gradient(135deg, #8FBC8F, #6B8E23)',
  textGradient: 'linear-gradient(135deg, #556B2F, #8FBC8F)',
  showBg: 'rgba(34, 139, 34, 0.18)',
  borderColor: 'rgba(139, 69, 19, 0.6)',
  followButtonBg: 'rgba(34, 139, 34, 0.6)',
  followButtonBorder: 'rgba(139, 69, 19, 0.7)',
  followButtonTextColor: '#fff8dc',
  mainTextColor: '#1b4332',
  secondaryTextColor: '#4a5568',
  fieldColor: 'rgba(226, 243, 231, 0.96)',
  commentBg: 'rgba(226, 243, 231, 0.96)',
};

const deepPurpleTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #5e35b1, #673ab7)',
  avatarGlow: 'linear-gradient(135deg, #7b1fa2, #ab47bc)',
  textGradient: 'linear-gradient(135deg, #d5006d, #f50057)',
  showBg: 'rgba(255, 255, 255, 0.1)',
  borderColor: 'rgba(156, 39, 176, 0.5)',
  followButtonBg: 'rgba(255, 255, 255, 0.1)',
  followButtonBorder: 'rgba(255, 255, 255, 0.3)',
  followButtonTextColor: '#ffffff',
  mainTextColor: '#ffffff',
  secondaryTextColor: '#e1bee7',
  fieldColor: 'rgba(32, 12, 70, 0.96)',
  commentBg: 'rgba(32, 12, 70, 0.96)',
};

const bananaTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #fff176, #ffe135)',
  avatarGlow: 'linear-gradient(135deg, #fbc02d, #fdd835)',
  textGradient: 'linear-gradient(135deg, #fbc02d, #f9a825)',
  showBg: 'rgba(255, 235, 59, 0.7)',
  borderColor: 'rgba(255, 235, 59, 0.5)',
  followButtonBg: 'rgba(255, 245, 157, 0.5)',
  followButtonBorder: 'rgba(255, 193, 7, 0.6)',
  followButtonTextColor: '#4a4a4a',
  mainTextColor: '#5d4037',
  secondaryTextColor: '#8d6e63',
  fieldColor: 'rgba(255, 252, 217, 0.96)',
  commentBg: 'rgba(255, 252, 217, 0.96)',
};

const samusAranTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #ff6f00, #b2ff59)',
  avatarGlow: 'linear-gradient(135deg, #ff8f00, #c6ff00)',
  textGradient: 'linear-gradient(135deg, #ff5722, #ffab40)',
  showBg: 'rgba(0, 150, 136, 0.6)',
  borderColor: 'rgba(255, 87, 34, 0.5)',
  followButtonBg: 'rgba(0, 150, 136, 0.1)',
  followButtonBorder: 'rgba(0, 150, 136, 0.3)',
  followButtonTextColor: '#ffffff',
  mainTextColor: '#ffffff',
  secondaryTextColor: '#ffcc80',
  fieldColor: 'rgba(3, 54, 52, 0.96)',
  commentBg: 'rgba(3, 54, 52, 0.96)',
};

const liquidDeathTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #111111, #222222)',
  avatarGlow: 'linear-gradient(135deg, #ffd700, #ffcc00)',
  textGradient: 'linear-gradient(135deg, #ffcc00, #ffd700)',
  showBg: 'rgba(0, 0, 0, 0.8)',
  borderColor: 'rgba(255, 215, 0, 0.5)',
  followButtonBg: 'rgba(255, 215, 0, 0.1)',
  followButtonBorder: 'rgba(255, 215, 0, 0.3)',
  followButtonTextColor: '#ffd700',
  mainTextColor: '#ffd700',
  secondaryTextColor: '#ffffff',
  fieldColor: 'rgba(24, 24, 24, 0.96)',
  commentBg: 'rgba(16, 16, 16, 0.98)',
};

const defaultTheme: BandPageTheme = {
  background: `
    radial-gradient(ellipse at 50% -50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 0% 100%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0f 0%, #050509 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  textGradient: 'linear-gradient(135deg, #ffffff, #a78bfa)',
  showBg: 'rgba(30, 41, 59, 0.6)',
  borderColor: 'rgba(71, 85, 105, 0.65)',
  followButtonBg: 'rgba(15,23,42,0.95)',
  followButtonBorder: 'rgba(236, 72, 153, 0.6)',
  followButtonTextColor: '#f9a8d4',
  mainTextColor: '#ffffff',
  secondaryTextColor: '#d1d5db',
  fieldColor: 'rgba(15, 23, 42, 0.96)',
  commentBg: 'rgba(15, 23, 42, 0.96)',
};

const chocolateTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #4e342e, #3e2723)',
  avatarGlow: 'linear-gradient(135deg, #6d4c41, #a1887f)',
  textGradient: 'linear-gradient(135deg, #ffccbc, #ffe0b2)',
  showBg: 'rgba(62, 39, 35, 0.75)',
  borderColor: 'rgba(161, 136, 127, 0.7)',
  followButtonBg: 'rgba(33, 22, 18, 0.95)',
  followButtonBorder: 'rgba(198, 166, 144, 0.9)',
  followButtonTextColor: '#ffe0b2',
  mainTextColor: '#fff7ed',
  secondaryTextColor: '#ffccbc',
  fieldColor: 'rgba(43, 27, 23, 0.97)',
  commentBg: 'rgba(43, 27, 23, 0.97)',
};

const bioshockTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #0f172a, #022c22)',
  avatarGlow: 'linear-gradient(135deg, #22c55e, #0ea5e9)',
  textGradient: 'linear-gradient(135deg, #e5e7eb, #a7f3d0)',
  showBg: 'rgba(15, 23, 42, 0.8)',
  borderColor: 'rgba(148, 163, 184, 0.7)',
  followButtonBg: 'rgba(15, 23, 42, 0.95)',
  followButtonBorder: 'rgba(56, 189, 248, 0.7)',
  followButtonTextColor: '#e0f2fe',
  mainTextColor: '#f9fafb',
  secondaryTextColor: '#a7f3d0',
  fieldColor: 'rgba(9, 18, 36, 0.96)',
  commentBg: 'rgba(9, 18, 36, 0.96)',
};

const marioTheme: BandPageTheme = {
  background: 'linear-gradient(to bottom, #ef4444, #1d4ed8)',
  avatarGlow: 'linear-gradient(135deg, #f97316, #facc15)',
  textGradient: 'linear-gradient(135deg, #fef3c7, #facc15)',
  showBg: 'rgba(15, 23, 42, 0.75)',
  borderColor: 'rgba(248, 250, 252, 0.6)',
  followButtonBg: 'rgba(248, 250, 252, 0.14)',
  followButtonBorder: 'rgba(248, 250, 252, 0.7)',
  followButtonTextColor: '#fef9c3',
  mainTextColor: '#fefce8',
  secondaryTextColor: '#fde68a',
  fieldColor: 'rgba(16, 23, 55, 0.96)',
  commentBg: 'rgba(16, 23, 55, 0.96)',
};

const mattePurpleTheme: BandPageTheme = {
  background: '#171427',
  avatarGlow: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  textGradient: 'linear-gradient(135deg, #e5e7eb, #a855f7)',
  showBg: 'rgba(15, 15, 26, 0.9)',
  borderColor: 'rgba(129, 140, 248, 0.6)',
  followButtonBg: '#1f172f',
  followButtonBorder: 'rgba(168, 85, 247, 0.8)',
  followButtonTextColor: '#ede9fe',
  mainTextColor: '#f9fafb',
  secondaryTextColor: '#c4b5fd',
  fieldColor: 'rgba(25, 22, 52, 0.96)',
  commentBg: 'rgba(25, 22, 52, 0.96)',
};

const matteYellowTheme: BandPageTheme = {
  background: '#1e1b18',
  avatarGlow: 'linear-gradient(135deg, #fbbf24, #facc15)',
  textGradient: 'linear-gradient(135deg, #fef3c7, #facc15)',
  showBg: 'rgba(24, 20, 15, 0.95)',
  borderColor: 'rgba(245, 158, 11, 0.7)',
  followButtonBg: '#29221a',
  followButtonBorder: 'rgba(234, 179, 8, 0.9)',
  followButtonTextColor: '#fef3c7',
  mainTextColor: '#fef9c3',
  secondaryTextColor: '#fcd34d',
  fieldColor: 'rgba(37, 30, 19, 0.97)',
  commentBg: 'rgba(37, 30, 19, 0.97)',
};

const matteRedTheme: BandPageTheme = {
  background: '#1a1111',
  avatarGlow: 'linear-gradient(135deg, #ef4444, #f97316)',
  textGradient: 'linear-gradient(135deg, #fecaca, #f97316)',
  showBg: 'rgba(24, 14, 14, 0.95)',
  borderColor: 'rgba(248, 113, 113, 0.7)',
  followButtonBg: '#241111',
  followButtonBorder: 'rgba(239, 68, 68, 0.9)',
  followButtonTextColor: '#fee2e2',
  mainTextColor: '#fee2e2',
  secondaryTextColor: '#fecaca',
  fieldColor: 'rgba(40, 18, 18, 0.97)',
  commentBg: 'rgba(40, 18, 18, 0.97)',
};

const citySkyTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 20% 0%, #BF9860 0%, rgba(191,152,96,0) 45%),
    radial-gradient(circle at 80% 10%, #24A3C0 0%, rgba(36,163,192,0) 55%),
    linear-gradient(180deg, #24A3C0 0%, #C9B79E 55%, #D3C0A3 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #24A3C0, #BF9860)',
  textGradient: 'linear-gradient(135deg, #000000, #24A3C0)',
  showBg: 'rgba(211, 192, 163, 0.9)',
  borderColor: '#C9B79E',
  followButtonBg: '#24A3C0',
  followButtonBorder: '#BF9860',
  followButtonTextColor: '#FFFFFF',
  mainTextColor: '#1F2933',
  secondaryTextColor: '#6B4F3C',
  fieldColor: 'rgba(243, 235, 226, 0.97)',
  commentBg: 'rgba(243, 235, 226, 0.96)',
};

const royaltyTheme: BandPageTheme = {
  background: 'linear-gradient(180deg, #004687 0%, #000000 100%)',
  avatarGlow: 'linear-gradient(135deg, #BD9B60, #FFFFFF)',
  textGradient: 'linear-gradient(135deg, #BD9B60, #FFFFFF)',
  showBg: 'rgba(0, 24, 60, 0.92)',
  borderColor: '#BD9B60',
  followButtonBg: '#BD9B60',
  followButtonBorder: '#FFFFFF',
  followButtonTextColor: '#0B1120',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#BBBBBB',
  fieldColor: 'rgba(0, 35, 80, 0.96)',
  commentBg: 'rgba(5, 34, 72, 0.96)',
};

const tacosTheme: BandPageTheme = {
  background: 'linear-gradient(135deg, #36399A 0%, #ED008C 45%, #FEE012 100%)',
  avatarGlow: 'linear-gradient(135deg, #ED008C, #FEE012)',
  textGradient: 'linear-gradient(135deg, #FFFFFF, #FEE012)',
  showBg: 'rgba(15, 16, 64, 0.9)',
  borderColor: '#FEE012',
  followButtonBg: '#ED008C',
  followButtonBorder: '#FEE012',
  followButtonTextColor: '#FFFFFF',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#FEE012',
  fieldColor: 'rgba(54, 57, 154, 0.96)',
  commentBg: 'rgba(18, 22, 80, 0.96)',
};

const heyLowTheme: BandPageTheme = {
  background: 'linear-gradient(180deg, #6C8D71 0%, #879250 45%, #99D21B 100%)',
  avatarGlow: 'linear-gradient(135deg, #838B64, #99D21B)',
  textGradient: 'linear-gradient(135deg, #F9FAFB, #99D21B)',
  showBg: 'rgba(18, 28, 14, 0.94)',
  borderColor: '#8EA72F',
  followButtonBg: '#8EA72F',
  followButtonBorder: '#99D21B',
  followButtonTextColor: '#0B1307',
  mainTextColor: '#F9FAFB',
  secondaryTextColor: '#D1FAE5',
  fieldColor: 'rgba(20, 30, 14, 0.97)',
  commentBg: 'rgba(24, 33, 18, 0.97)',
};

const pumpkinTheme: BandPageTheme = {
  background:
    'linear-gradient(180deg, #ECCC7C 0%, #DE984E 25%, #DC8B30 55%, #D96527 100%)',
  avatarGlow: 'linear-gradient(135deg, #DE984E, #D96527)',
  textGradient: 'linear-gradient(135deg, #FFF7ED, #D96527)',
  showBg: 'rgba(44, 26, 14, 0.95)',
  borderColor: '#DE984E',
  followButtonBg: '#D96527',
  followButtonBorder: '#ECCC7C',
  followButtonTextColor: '#FFF7ED',
  mainTextColor: '#FFF7ED',
  secondaryTextColor: '#FED7AA',
  fieldColor: 'rgba(56, 30, 14, 0.97)',
  commentBg: 'rgba(48, 28, 18, 0.97)',
};

const googleTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 15% 0%, #FFA700 0%, rgba(255,167,0,0) 50%),
    radial-gradient(circle at 85% 0%, #D62D20 0%, rgba(214,45,32,0) 55%),
    linear-gradient(180deg, #0057E7 0%, #008744 55%, #000000 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #FFA700, #D62D20)',
  textGradient: 'linear-gradient(135deg, #FFFFFF, #FFA700)',
  showBg: 'rgba(0, 18, 64, 0.9)',
  borderColor: '#FFA700',
  followButtonBg: '#FFFFFF',
  followButtonBorder: '#FFA700',
  followButtonTextColor: '#0057E7',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#D1D5DB',
  fieldColor: 'rgba(0, 26, 80, 0.97)',
  commentBg: 'rgba(0, 23, 66, 0.96)',
};

const pastelTheme: BandPageTheme = {
  background:
    'linear-gradient(180deg, #A8E6CF 0%, #DCEDC1 25%, #FFD3B6 55%, #FFAAA5 80%, #FF8B94 100%)',
  avatarGlow: 'linear-gradient(135deg, #FFD3B6, #FF8B94)',
  textGradient: 'linear-gradient(135deg, #FF8B94, #FFAAA5)',
  showBg: 'rgba(255, 255, 255, 0.8)',
  borderColor: '#FFAAA5',
  followButtonBg: '#FFFFFF',
  followButtonBorder: '#FF8B94',
  followButtonTextColor: '#FF8B94',
  mainTextColor: '#374151',
  secondaryTextColor: '#6B7280',
  fieldColor: 'rgba(255, 251, 250, 0.98)',
  commentBg: 'rgba(255, 251, 250, 0.98)',
};

const pepsiTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 20% 0%, #EC1D39 0%, rgba(236,29,57,0) 55%),
    linear-gradient(180deg, #005890 0%, #000000 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #005890, #EC1D39)',
  textGradient: 'linear-gradient(135deg, #FFFFFF, #EC1D39)',
  showBg: 'rgba(0, 10, 28, 0.96)',
  borderColor: '#AAAAAA',
  followButtonBg: '#005890',
  followButtonBorder: '#EC1D39',
  followButtonTextColor: '#FFFFFF',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#AAAAAA',
  fieldColor: 'rgba(0, 32, 72, 0.97)',
  commentBg: 'rgba(3, 20, 46, 0.97)',
};

const metalGearTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 10% 0%, #1F4F46 0%, rgba(31,79,70,0) 45%),
    linear-gradient(180deg, #020B0A 0%, #0B2B26 45%, #020B0A 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #1F4F46, #88BFB3)',
  textGradient: 'linear-gradient(135deg, #88BFB3, #F0F4F5)',
  showBg: 'rgba(3, 20, 20, 0.9)',
  borderColor: '#88BFB3',
  followButtonBg: '#0B2B26',
  followButtonBorder: '#88BFB3',
  followButtonTextColor: '#E5F5F4',
  mainTextColor: '#E5F5F4',
  secondaryTextColor: '#88BFB3',
  fieldColor: 'rgba(5, 32, 30, 0.96)',
  commentBg: 'rgba(7, 40, 36, 0.96)',
};

const quietHillTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 0% 0%, #C7CBBF 0%, rgba(199,203,191,0) 45%),
    linear-gradient(180deg, #1F2A24 0%, #3F5244 40%, #0F1511 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #7A8572, #C7CBBF)',
  textGradient: 'linear-gradient(135deg, #F5F3EA, #C7CBBF)',
  showBg: 'rgba(10, 16, 12, 0.92)',
  borderColor: '#7A8572',
  followButtonBg: '#3F5244',
  followButtonBorder: '#C7CBBF',
  followButtonTextColor: '#F5F3EA',
  mainTextColor: '#F5F3EA',
  secondaryTextColor: '#C7CBBF',
  fieldColor: 'rgba(24, 32, 26, 0.97)',
  commentBg: 'rgba(30, 38, 31, 0.97)',
};

const oldRingTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 15% 0%, #C5A15F 0%, rgba(197,161,95,0) 45%),
    linear-gradient(180deg, #060B10 0%, #102020 40%, #020509 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #C5A15F, #1A4038)',
  textGradient: 'linear-gradient(135deg, #F9F3DF, #C5A15F)',
  showBg: 'rgba(6, 16, 18, 0.94)',
  borderColor: '#C5A15F',
  followButtonBg: '#1A4038',
  followButtonBorder: '#C5A15F',
  followButtonTextColor: '#F9F3DF',
  mainTextColor: '#F9F3DF',
  secondaryTextColor: '#C5A15F',
  fieldColor: 'rgba(9, 24, 26, 0.97)',
  commentBg: 'rgba(11, 28, 30, 0.97)',
};

const NightRainTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 80% 0%, #9F7CFF 0%, rgba(159,124,255,0) 55%),
    linear-gradient(180deg, #050816 0%, #0C1224 40%, #02010A 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #9F7CFF, #182848)',
  textGradient: 'linear-gradient(135deg, #F5E9FF, #9F7CFF)',
  showBg: 'rgba(7, 10, 24, 0.94)',
  borderColor: '#9F7CFF',
  followButtonBg: '#182848',
  followButtonBorder: '#9F7CFF',
  followButtonTextColor: '#F5E9FF',
  mainTextColor: '#F5E9FF',
  secondaryTextColor: '#C4B5FF',
  fieldColor: 'rgba(10, 16, 40, 0.97)',
  commentBg: 'rgba(12, 20, 48, 0.97)',
};

const zoroWanoTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 10% 0%, #FDA4AF 0%, rgba(253,164,175,0) 45%),
    linear-gradient(180deg, #0F3B2E 0%, #145F3E 45%, #020917 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #22C55E, #FDA4AF)',
  textGradient: 'linear-gradient(135deg, #FEF9C3, #22C55E)',
  showBg: 'rgba(6, 30, 24, 0.94)',
  borderColor: '#22C55E',
  followButtonBg: '#22C55E',
  followButtonBorder: '#FEF9C3',
  followButtonTextColor: '#022C22',
  mainTextColor: '#ECFEFF',
  secondaryTextColor: '#BBF7D0',
  fieldColor: 'rgba(8, 36, 28, 0.97)',
  commentBg: 'rgba(10, 40, 32, 0.97)',
};

const spidermanTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 15% 0%, #B91C1C 0%, rgba(185,28,28,0) 45%),
    linear-gradient(180deg, #0B1120 0%, #1D4ED8 45%, #020617 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #B91C1C, #1D4ED8)',
  textGradient: 'linear-gradient(135deg, #F9FAFB, #F97316)',
  showBg: 'rgba(10, 18, 40, 0.94)',
  borderColor: '#F97316',
  followButtonBg: '#B91C1C',
  followButtonBorder: '#F97316',
  followButtonTextColor: '#FEF9C3',
  mainTextColor: '#F9FAFB',
  secondaryTextColor: '#E5E7EB',
  fieldColor: 'rgba(15, 23, 42, 0.97)',
  commentBg: 'rgba(17, 24, 52, 0.97)',
};

const batmanTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 0% 0%, #FACC15 0%, rgba(250,204,21,0) 40%),
    linear-gradient(180deg, #020617 0%, #111827 40%, #020617 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #FACC15, #1F2937)',
  textGradient: 'linear-gradient(135deg, #FACC15, #FEF9C3)',
  showBg: 'rgba(10, 14, 28, 0.94)',
  borderColor: '#FACC15',
  followButtonBg: '#111827',
  followButtonBorder: '#FACC15',
  followButtonTextColor: '#FEF9C3',
  mainTextColor: '#F9FAFB',
  secondaryTextColor: '#E5E7EB',
  fieldColor: 'rgba(15, 23, 42, 0.97)',
  commentBg: 'rgba(15, 23, 42, 0.97)',
};
const sunflowersTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 15% 0%, #FDE68A 0%, rgba(253,230,138,0) 45%),
    linear-gradient(180deg, #FEF9C3 0%, #F97316 60%, #92400E 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #FACC15, #F97316)',
  textGradient: 'linear-gradient(135deg, #78350F, #FACC15)',
  showBg: 'rgba(255, 251, 235, 0.9)',
  borderColor: '#F59E0B',
  followButtonBg: '#FACC15',
  followButtonBorder: '#EA580C',
  followButtonTextColor: '#1F2937',
  mainTextColor: '#78350F',
  secondaryTextColor: '#92400E',
  fieldColor: 'rgba(255, 252, 237, 0.98)',
  commentBg: 'rgba(255, 250, 230, 0.98)',
};

const gardenTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 0% 0%, #BBF7D0 0%, rgba(187,247,208,0) 45%),
    radial-gradient(circle at 80% 0%, #A7F3D0 0%, rgba(167,243,208,0) 55%),
    linear-gradient(180deg, #DCFCE7 0%, #4ADE80 55%, #15803D 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #4ADE80, #22C55E)',
  textGradient: 'linear-gradient(135deg, #14532D, #4ADE80)',
  showBg: 'rgba(240, 253, 244, 0.95)',
  borderColor: '#22C55E',
  followButtonBg: '#22C55E',
  followButtonBorder: '#15803D',
  followButtonTextColor: '#F0FDF4',
  mainTextColor: '#14532D',
  secondaryTextColor: '#166534',
  fieldColor: 'rgba(240, 253, 244, 0.98)',
  commentBg: 'rgba(234, 252, 242, 0.98)',
};

const rainbowTheme: BandPageTheme = {
  background: `
    linear-gradient(120deg, #F97316 0%, #FACC15 16%, #22C55E 32%, #22D3EE 48%, #3B82F6 64%, #A855F7 80%, #EC4899 100%)
  `,
  avatarGlow:
    'conic-gradient(from 140deg, #F97316, #FACC15, #22C55E, #22D3EE, #3B82F6, #A855F7, #EC4899, #F97316)',
  textGradient: 'linear-gradient(135deg, #111827, #4B5563)',
  showBg: 'rgba(255, 255, 255, 0.9)',
  borderColor: 'rgba(148, 163, 184, 0.8)',
  followButtonBg: '#111827',
  followButtonBorder: '#F9FAFB',
  followButtonTextColor: '#F9FAFB',
  mainTextColor: '#111827',
  secondaryTextColor: '#374151',
  fieldColor: 'rgba(250, 250, 255, 0.98)',
  commentBg: 'rgba(255, 255, 255, 0.98)',
};

const sunnyDayTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 15% 0%, #FACC15 0%, rgba(250,204,21,0) 45%),
    linear-gradient(180deg, #BFDBFE 0%, #60A5FA 40%, #E0F2FE 100%)
  `,
  avatarGlow: 'linear-gradient(135deg, #FACC15, #60A5FA)',
  textGradient: 'linear-gradient(135deg, #1E3A8A, #FACC15)',
  showBg: 'rgba(239, 246, 255, 0.95)',
  borderColor: '#60A5FA',
  followButtonBg: '#FACC15',
  followButtonBorder: '#F97316',
  followButtonTextColor: '#1E3A8A',
  mainTextColor: '#1E3A8A',
  secondaryTextColor: '#2563EB',
  fieldColor: 'rgba(239, 246, 255, 0.98)',
  commentBg: 'rgba(239, 246, 255, 0.98)',
};

const cosmicVortexTheme: BandPageTheme = {
  background: `
    radial-gradient(ellipse at 50% 50%, rgba(138, 43, 226, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(255, 20, 147, 0.35) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 191, 255, 0.35) 0%, transparent 40%),
    conic-gradient(from 0deg at 50% 50%, 
      #000000 0deg, 
      #1a0033 60deg, 
      #4a148c 120deg, 
      #7b1fa2 180deg, 
      #4a148c 240deg, 
      #1a0033 300deg, 
      #000000 360deg
    ),
    repeating-conic-gradient(from 0deg at 50% 50%, 
      transparent 0deg 8deg, 
      rgba(138, 43, 226, 0.03) 8deg 10deg
    )
  `,
  avatarGlow: `
    conic-gradient(from 0deg, 
      #8A2BE2, #FF1493, #00BFFF, #7B68EE, #FF69B4, #00CED1, #8A2BE2
    )
  `,
  textGradient: 'linear-gradient(135deg, #FFFFFF, #E0B0FF, #00BFFF)',
  showBg: 'rgba(10, 0, 25, 0.92)',
  borderColor: 'rgba(138, 43, 226, 0.8)',
  followButtonBg: 'rgba(138, 43, 226, 0.2)',
  followButtonBorder: 'rgba(255, 20, 147, 0.9)',
  followButtonTextColor: '#E0B0FF',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#E0B0FF',
  fieldColor: 'rgba(26, 0, 51, 0.95)',
  commentBg: 'rgba(20, 0, 40, 0.97)',
};

// ⭐ PREMIUM THEME 2: HOLOGRAPHIC DREAM
// Features: Iridescent shimmer, rainbow refraction, glass morphism
const holographicDreamTheme: BandPageTheme = {
  background: `
    linear-gradient(125deg, 
      rgba(255, 255, 255, 0.15) 0%, 
      rgba(255, 255, 255, 0.05) 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.05) 75%,
      rgba(255, 255, 255, 0.15) 100%
    ),
    repeating-linear-gradient(
      45deg,
      #FF6EC7 0px,
      #FFA500 100px,
      #FFFF00 200px,
      #00FF00 300px,
      #00BFFF 400px,
      #8A2BE2 500px,
      #FF1493 600px,
      #FF6EC7 700px
    ),
    linear-gradient(180deg, #0a0015 0%, #1a0033 50%, #0a0015 100%)
  `,
  avatarGlow: `
    conic-gradient(from 45deg, 
      #FF6EC7, #FFA500, #FFFF00, #00FF00, #00BFFF, #8A2BE2, #FF1493, #FF6EC7
    )
  `,
  textGradient: `
    linear-gradient(90deg, 
      #FF6EC7, #FFA500, #FFFF00, #00FF00, #00BFFF, #8A2BE2, #FF1493
    )
  `,
  showBg: 'rgba(255, 255, 255, 0.08)',
  borderColor: 'rgba(255, 255, 255, 0.25)',
  followButtonBg: 'rgba(255, 255, 255, 0.12)',
  followButtonBorder: 'rgba(138, 43, 226, 0.6)',
  followButtonTextColor: '#FFFFFF',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#E0B0FF',
  fieldColor: 'rgba(255, 255, 255, 0.1)',
  commentBg: 'rgba(255, 255, 255, 0.08)',
};

// ⭐ PREMIUM THEME 3: CYBERPUNK NEON
// Features: Glitching neon signs, scanline effects, matrix rain aesthetic
const cyberpunkNeonTheme: BandPageTheme = {
  background: `
    repeating-linear-gradient(
      0deg,
      rgba(0, 255, 255, 0.03) 0px,
      transparent 2px,
      transparent 4px,
      rgba(0, 255, 255, 0.03) 4px
    ),
    radial-gradient(circle at 10% 20%, rgba(255, 0, 128, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(0, 255, 255, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 0, 0.15) 0%, transparent 60%),
    linear-gradient(180deg, #000000 0%, #0a0a0a 25%, #1a001a 50%, #001a1a 75%, #000000 100%)
  `,
  avatarGlow: `
    conic-gradient(from 90deg, 
      #FF0080, #00FFFF, #FFFF00, #FF0080
    ),
    radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)
  `,
  textGradient: 'linear-gradient(135deg, #00FFFF, #FF0080, #FFFF00)',
  showBg: 'rgba(0, 0, 0, 0.85)',
  borderColor: 'rgba(0, 255, 255, 0.8)',
  followButtonBg: 'rgba(255, 0, 128, 0.15)',
  followButtonBorder: 'rgba(0, 255, 255, 0.9)',
  followButtonTextColor: '#00FFFF',
  mainTextColor: '#00FFFF',
  secondaryTextColor: '#FF0080',
  fieldColor: 'rgba(0, 20, 20, 0.95)',
  commentBg: 'rgba(10, 0, 10, 0.97)',
};

// ⭐ PREMIUM THEME 4: AURORA BOREALIS
// Features: Flowing northern lights, ethereal waves, luminescent particles
const auraaBorealisTheme: BandPageTheme = {
  background: `
    radial-gradient(ellipse at 30% 0%, rgba(0, 255, 127, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 0%, rgba(138, 43, 226, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 40%, rgba(0, 191, 255, 0.3) 0%, transparent 60%),
    linear-gradient(180deg, 
      #001a1a 0%, 
      #002b36 20%, 
      #003d4d 40%, 
      #002b36 60%, 
      #001a1a 80%, 
      #000d0d 100%
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      rgba(0, 255, 127, 0.02) 50px,
      transparent 100px
    )
  `,
  avatarGlow: `
    conic-gradient(from 180deg, 
      #00FF7F, #00BFFF, #8A2BE2, #FF1493, #00FF7F
    )
  `,
  textGradient: 'linear-gradient(135deg, #00FF7F, #00BFFF, #8A2BE2)',
  showBg: 'rgba(0, 20, 25, 0.88)',
  borderColor: 'rgba(0, 255, 127, 0.6)',
  followButtonBg: 'rgba(0, 191, 255, 0.15)',
  followButtonBorder: 'rgba(0, 255, 127, 0.8)',
  followButtonTextColor: '#E0FFFF',
  mainTextColor: '#E0FFFF',
  secondaryTextColor: '#B0E0E6',
  fieldColor: 'rgba(0, 30, 35, 0.94)',
  commentBg: 'rgba(0, 25, 30, 0.96)',
};

// ⭐ PREMIUM THEME 5: QUANTUM REALM
// Features: Particle effects, quantum tunneling visuals, energy waves
const quantumRealmTheme: BandPageTheme = {
  background: `
    radial-gradient(circle at 50% 50%, rgba(0, 255, 0, 0.15) 0%, transparent 30%),
    radial-gradient(circle at 20% 30%, rgba(255, 0, 255, 0.2) 0%, transparent 35%),
    radial-gradient(circle at 80% 70%, rgba(0, 255, 255, 0.2) 0%, transparent 35%),
    repeating-radial-gradient(
      circle at 50% 50%,
      transparent 0px,
      rgba(0, 255, 0, 0.03) 50px,
      transparent 100px,
      rgba(255, 0, 255, 0.03) 150px,
      transparent 200px
    ),
    linear-gradient(180deg, #000000 0%, #001100 30%, #001a1a 50%, #110011 70%, #000000 100%)
  `,
  avatarGlow: `
    conic-gradient(from 0deg, 
      #00FF00 0deg, 
      #00FFFF 90deg, 
      #FF00FF 180deg, 
      #FFFF00 270deg, 
      #00FF00 360deg
    ),
    radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 60%)
  `,
  textGradient: 'linear-gradient(135deg, #00FF00, #00FFFF, #FF00FF)',
  showBg: 'rgba(0, 10, 10, 0.92)',
  borderColor: 'rgba(0, 255, 0, 0.7)',
  followButtonBg: 'rgba(0, 255, 0, 0.1)',
  followButtonBorder: 'rgba(0, 255, 255, 0.8)',
  followButtonTextColor: '#E0FFE0',
  mainTextColor: '#E0FFE0',
  secondaryTextColor: '#B0FFB0',
  fieldColor: 'rgba(0, 20, 15, 0.96)',
  commentBg: 'rgba(0, 15, 15, 0.97)',
};

const premiumSakuraTheme: BandPageTheme = {
  background: `
    radial-gradient(circle 3px at 15% 20%, rgba(255, 182, 193, 0.9) 0%, transparent 3px),
    radial-gradient(circle 4px at 85% 15%, rgba(255, 192, 203, 0.85) 0%, transparent 4px),
    radial-gradient(circle 2px at 45% 35%, rgba(255, 182, 193, 0.8) 0%, transparent 2px),
    radial-gradient(circle 3px at 70% 50%, rgba(255, 192, 203, 0.9) 0%, transparent 3px),
    radial-gradient(circle 2px at 25% 60%, rgba(255, 182, 193, 0.75) 0%, transparent 2px),
    radial-gradient(circle 4px at 90% 75%, rgba(255, 192, 203, 0.85) 0%, transparent 4px),
    radial-gradient(circle 3px at 10% 85%, rgba(255, 182, 193, 0.8) 0%, transparent 3px),
    radial-gradient(circle 2px at 55% 90%, rgba(255, 192, 203, 0.9) 0%, transparent 2px),
    radial-gradient(ellipse 200px 400px at 5% 30%, rgba(76, 111, 68, 0.15) 0%, transparent 70%),
    radial-gradient(ellipse 180px 380px at 95% 40%, rgba(85, 125, 78, 0.15) 0%, transparent 70%),
    radial-gradient(ellipse 150px 350px at 10% 60%, rgba(76, 111, 68, 0.12) 0%, transparent 70%),
    linear-gradient(135deg, 
      rgba(139, 195, 74, 0.08) 0% 2%, 
      transparent 2% 3%,
      rgba(104, 159, 56, 0.06) 3% 4%,
      transparent 4% 98%,
      rgba(139, 195, 74, 0.08) 98% 100%
    ),
    linear-gradient(45deg, 
      transparent 0% 48%,
      rgba(85, 125, 78, 0.1) 48% 52%,
      transparent 52% 100%
    ),
    repeating-linear-gradient(
      90deg,
      rgba(139, 195, 74, 0.03) 0px,
      transparent 2px,
      transparent 150px,
      rgba(104, 159, 56, 0.03) 152px,
      transparent 154px
    ),
    radial-gradient(ellipse at 50% 100%, #FFF5F7 0%, #FFE4E9 30%, #FFD1DC 60%, #FFC0CB 100%),
    linear-gradient(180deg, #FFF0F3 0%, #FFE4E9 25%, #FFD1DC 50%, #FFC0CB 75%, #FFB6C1 100%)
  `,
  avatarGlow: `
    conic-gradient(from 45deg, 
      #FF69B4, #FFB6C1, #8BC34A, #689F38, #FF69B4
    ),
    radial-gradient(circle, rgba(255, 182, 193, 0.6) 0%, transparent 70%)
  `,
  textGradient: `
    linear-gradient(135deg, 
      #C2185B 0%, 
      #E91E63 25%, 
      #FF4081 50%, 
      #F06292 75%, 
      #FFB6C1 100%
    )
  `,
  showBg: 'rgba(255, 245, 247, 0.92)',
  borderColor: 'rgba(255, 105, 180, 0.5)',
  followButtonBg: `
    linear-gradient(135deg, 
      rgba(255, 182, 193, 0.9) 0%, 
      rgba(255, 192, 203, 0.85) 50%,
      rgba(255, 182, 193, 0.9) 100%
    )
  `,
  followButtonBorder: 'rgba(139, 195, 74, 0.6)',
  followButtonTextColor: '#880E4F',
  mainTextColor: '#880E4F',
  secondaryTextColor: '#AD1457',
  fieldColor: 'rgba(255, 250, 252, 0.96)',
  commentBg: 'rgba(255, 252, 253, 0.97)',
};

// ⭐⭐ ULTRA PREMIUM: STELLAR ODYSSEY
// Features: Twinkling stars, nebula clouds, shooting stars, planet rings, cosmic dust
const stellarOdysseyTheme: BandPageTheme = {
  background: `
    radial-gradient(circle 1px at 12% 8%, rgba(255, 255, 255, 0.9) 0%, transparent 1px),
    radial-gradient(circle 2px at 88% 12%, rgba(255, 255, 255, 1) 0%, transparent 2px),
    radial-gradient(circle 1px at 35% 18%, rgba(200, 220, 255, 0.85) 0%, transparent 1px),
    radial-gradient(circle 1px at 65% 25%, rgba(255, 255, 255, 0.8) 0%, transparent 1px),
    radial-gradient(circle 2px at 15% 32%, rgba(255, 240, 200, 0.95) 0%, transparent 2px),
    radial-gradient(circle 1px at 92% 38%, rgba(255, 255, 255, 0.9) 0%, transparent 1px),
    radial-gradient(circle 1px at 45% 45%, rgba(200, 220, 255, 0.8) 0%, transparent 1px),
    radial-gradient(circle 2px at 78% 52%, rgba(255, 255, 255, 1) 0%, transparent 2px),
    radial-gradient(circle 1px at 8% 58%, rgba(255, 255, 255, 0.85) 0%, transparent 1px),
    radial-gradient(circle 1px at 58% 65%, rgba(255, 240, 200, 0.9) 0%, transparent 1px),
    radial-gradient(circle 2px at 28% 72%, rgba(255, 255, 255, 0.95) 0%, transparent 2px),
    radial-gradient(circle 1px at 82% 78%, rgba(200, 220, 255, 0.85) 0%, transparent 1px),
    radial-gradient(circle 1px at 38% 85%, rgba(255, 255, 255, 0.9) 0%, transparent 1px),
    radial-gradient(circle 1px at 72% 92%, rgba(255, 255, 255, 0.8) 0%, transparent 1px),
    radial-gradient(circle 1px at 18% 95%, rgba(255, 240, 200, 0.85) 0%, transparent 1px),
    radial-gradient(circle 1px at 52% 15%, rgba(255, 255, 255, 0.75) 0%, transparent 1px),
    radial-gradient(circle 1px at 95% 48%, rgba(200, 220, 255, 0.8) 0%, transparent 1px),
    radial-gradient(circle 1px at 25% 42%, rgba(255, 255, 255, 0.85) 0%, transparent 1px),
    radial-gradient(circle 2px at 68% 68%, rgba(255, 240, 200, 1) 0%, transparent 2px),
    radial-gradient(circle 1px at 5% 75%, rgba(255, 255, 255, 0.9) 0%, transparent 1px),
    radial-gradient(ellipse 400px 300px at 20% 30%, rgba(138, 43, 226, 0.25) 0%, transparent 60%),
    radial-gradient(ellipse 500px 350px at 80% 70%, rgba(75, 0, 130, 0.3) 0%, transparent 65%),
    radial-gradient(ellipse 350px 280px at 50% 50%, rgba(72, 61, 139, 0.2) 0%, transparent 55%),
    radial-gradient(ellipse 300px 250px at 10% 80%, rgba(123, 104, 238, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse 450px 320px at 90% 20%, rgba(106, 90, 205, 0.22) 0%, transparent 58%),
    radial-gradient(circle 80px at 85% 15%, rgba(255, 215, 0, 0.15) 0%, rgba(255, 140, 0, 0.1) 40%, transparent 80%),
    radial-gradient(circle 100px at 15% 85%, rgba(255, 69, 0, 0.12) 0%, rgba(255, 99, 71, 0.08) 45%, transparent 85%),
    repeating-linear-gradient(
      45deg,
      transparent 0px,
      rgba(138, 43, 226, 0.02) 1px,
      transparent 2px,
      transparent 200px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent 0px,
      rgba(75, 0, 130, 0.02) 1px,
      transparent 2px,
      transparent 180px
    ),
    linear-gradient(180deg, 
      #000000 0%, 
      #0a0015 15%, 
      #1a0033 30%, 
      #0f001f 45%,
      #1a0033 60%,
      #0a0015 80%,
      #000000 100%
    )
  `,
  avatarGlow: `
    conic-gradient(from 0deg, 
      #8A2BE2 0deg, 
      #9370DB 60deg,
      #BA55D3 120deg,
      #DA70D6 180deg,
      #EE82EE 240deg,
      #DDA0DD 300deg,
      #8A2BE2 360deg
    ),
    radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%),
    radial-gradient(circle, rgba(138, 43, 226, 0.6) 20%, transparent 80%)
  `,
  textGradient: `
    linear-gradient(135deg, 
      #FFFFFF 0%, 
      #E0B0FF 20%, 
      #DA70D6 40%, 
      #BA55D3 60%, 
      #9370DB 80%, 
      #8A2BE2 100%
    )
  `,
  showBg: 'rgba(10, 0, 25, 0.88)',
  borderColor: 'rgba(138, 43, 226, 0.6)',
  followButtonBg: `
    radial-gradient(ellipse at center, 
      rgba(138, 43, 226, 0.3) 0%, 
      rgba(75, 0, 130, 0.25) 50%,
      rgba(72, 61, 139, 0.2) 100%
    )
  `,
  followButtonBorder: 'rgba(186, 85, 211, 0.8)',
  followButtonTextColor: '#E0B0FF',
  mainTextColor: '#FFFFFF',
  secondaryTextColor: '#E0B0FF',
  fieldColor: 'rgba(26, 0, 51, 0.92)',
  commentBg: 'rgba(20, 0, 40, 0.94)',
};

export const THEMES: Record<ThemeName, BandPageTheme> = {
  default: defaultTheme,
  cherry: cherryBlossomTheme,
  white: whiteTheme,
  woods: treesAndWoodsTheme,
  deepPurple: deepPurpleTheme,
  banana: bananaTheme,
  samus: samusAranTheme,
  liquidDeath: liquidDeathTheme,
  blackout: blackoutTheme,
  money: moneyTheme,
  silver: silverTheme,
  onepiece: onepieceTheme,
  chocolate: chocolateTheme,
  bioshock: bioshockTheme,
  mario: marioTheme,
  mattePurple: mattePurpleTheme,
  matteYellow: matteYellowTheme,
  matteRed: matteRedTheme,
  citySky: citySkyTheme,
  royalty: royaltyTheme,
  tacos: tacosTheme,
  heyLow: heyLowTheme,
  pumpkin: pumpkinTheme,
  google: googleTheme,
  pastel: pastelTheme,
  pepsi: pepsiTheme,
  metalGear: metalGearTheme,
  quietHill: quietHillTheme,
  oldRing: oldRingTheme,
  nightrain: NightRainTheme,
  zoroWano: zoroWanoTheme,
  spiderman: spidermanTheme,
  batman: batmanTheme,
  sunflowers: sunflowersTheme,
  garden: gardenTheme,
  rainbow: rainbowTheme,
  sunnyDay: sunnyDayTheme,
  neonBlackout: neonBlackoutTheme,
  acousticOm42: acousticOm42Theme,
  darthVader: darthVaderTheme,
  ice: iceTheme,
  purpleCascade: purpleCascadeTheme,
  zelda: zeldaTheme,
  coffee: coffeeTheme,
  amplee: ampleeTheme,
  retroCalc: retroCalcTheme,
  cosmicVortex: cosmicVortexTheme, // ⭐ PREMIUM
  holographicDream: holographicDreamTheme, // ⭐ PREMIUM
  cyberpunkNeon: cyberpunkNeonTheme, // ⭐ PREMIUM
  auraBorealis: auraaBorealisTheme, // ⭐ PREMIUM
  quantumRealm: quantumRealmTheme, // ⭐ PREMIUM
  premiumSakura: premiumSakuraTheme, // ⭐⭐ ULTRA PREMIUM
  stellarOdyssey: stellarOdysseyTheme, // ⭐⭐ ULTRA PREMIUM
};

// Add to THEME_OPTIONS
export const THEME_OPTIONS: {
  key: ThemeName;
  label: string;
  premium?: boolean;
}[] = [
  { key: 'default', label: 'Neon' },
  { key: 'cherry', label: 'Blossom' },
  { key: 'white', label: 'White Out' },
  { key: 'woods', label: 'Woodsy' },
  { key: 'deepPurple', label: 'Purples' },
  { key: 'banana', label: 'Banana' },
  { key: 'samus', label: 'Space Hunter' },
  { key: 'liquidDeath', label: 'Liquid Gold' },
  { key: 'blackout', label: 'Blackout' },
  { key: 'money', label: 'Cash' },
  { key: 'silver', label: 'Silver' },
  { key: 'onepiece', label: 'Pirate King' },
  { key: 'chocolate', label: 'Chocolate' },
  { key: 'bioshock', label: 'City in the Water' },
  { key: 'citySky', label: 'City in the Sky' },
  { key: 'mario', label: 'Plumber' },
  { key: 'mattePurple', label: 'Matte Purple' },
  { key: 'matteYellow', label: 'Matte Yellow' },
  { key: 'matteRed', label: 'Matte Red' },
  { key: 'royalty', label: 'Royalty' },
  { key: 'tacos', label: 'Tacos' },
  { key: 'heyLow', label: 'Hey Low' },
  { key: 'pumpkin', label: 'Pumpkin' },
  { key: 'google', label: 'Fiber' },
  { key: 'pastel', label: 'Pastel' },
  { key: 'pepsi', label: 'Dark Cola' },
  { key: 'metalGear', label: 'Big Boss' },
  { key: 'quietHill', label: 'Quiet Hill' },
  { key: 'oldRing', label: 'Old Ring' },
  { key: 'nightrain', label: 'Night Rain' },
  { key: 'zoroWano', label: 'Lost Samuari' },
  { key: 'spiderman', label: 'Bitten by a Spider' },
  { key: 'batman', label: 'Bitten by a Bat' },
  { key: 'sunflowers', label: 'Sunflowers' },
  { key: 'garden', label: 'Garden' },
  { key: 'rainbow', label: 'Rainbow' },
  { key: 'sunnyDay', label: 'Sunny Day' },
  { key: 'neonBlackout', label: 'Neon Blackout' },
  { key: 'acousticOm42', label: 'Acoustic' },
  { key: 'darthVader', label: 'Vader' },
  { key: 'ice', label: 'Ice' },
  { key: 'purpleCascade', label: 'Purple Cascade' },
  { key: 'zelda', label: 'A Link' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'retroCalc', label: 'Retro Calc' },
  { key: 'amplee', label: 'Amplee' },
  { key: 'cosmicVortex', label: '⭐ Cosmic Vortex', premium: true },
  { key: 'holographicDream', label: '⭐ Holographic Dream', premium: true },
  { key: 'cyberpunkNeon', label: '⭐ Cyberpunk Neon', premium: true },
  { key: 'auraBorealis', label: '⭐ Aurora Borealis', premium: true },
  { key: 'quantumRealm', label: '⭐ Quantum Realm', premium: true },
  { key: 'premiumSakura', label: '⭐⭐ Sakura Garden', premium: true },
  { key: 'stellarOdyssey', label: '⭐⭐ Stellar Odyssey', premium: true },
];
