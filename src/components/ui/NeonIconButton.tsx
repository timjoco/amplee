// components/ui/NeonIconButton.tsx
'use client';

import {
  IconButton,
  Tooltip,
  type IconButtonProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type PaletteKey =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

type NeonIconButtonProps = Omit<IconButtonProps, 'color' | 'size'> & {
  /** Tooltip & aria-label text */
  title: string;
  /** Use a palette key or pass colorHex for a custom color */
  colorKey?: PaletteKey;
  /** Optional direct hex (overrides colorKey) */
  colorHex?: string;
  /** Selected = filled chip look */
  selected?: boolean;
  /** Smaller/larger button in px (circle size). Default 20 */
  sizePx?: number;
  /** Icon size in px. Default 12 */
  iconSizePx?: number;
  /** Muted style: lighter tint + softer glow. Default true */
  muted?: boolean;
  /** Neon glow effect when selected/hovered. Default true */
  glow?: boolean;
  /** Extra sx overrides (object only, not a function) */
  sx?: SxProps<Theme>;
};

export function NeonIconButton({
  title,
  colorKey = 'success',
  colorHex,
  selected = false,
  disabled,
  onClick,
  children,
  sizePx = 20,
  iconSizePx = 12,
  muted = true,
  glow = true,
  sx,
  ...iconButtonProps
}: NeonIconButtonProps) {
  const t = useTheme();

  // Resolve base color
  const paletteBase =
    colorHex ?? (colorKey ? t.palette[colorKey].main : t.palette.success.main);

  // If muted, nudge toward a lighter/less saturated appearance
  const base = muted
    ? colorHex
      ? alpha(colorHex, 0.8)
      : t.palette[colorKey].light // lighter tint
    : paletteBase;

  // Glow strings (use softer alpha when muted)
  const glow6 = `${base}80`; // ~50% alpha
  const glow18 = muted ? `${base}4D` : `${base}59`; // 30% when muted, ~35% otherwise

  // Build a plain object (not a function) so SxProps stays happy
  const baseSx: SxProps<Theme> = {
    width: sizePx,
    height: sizePx,
    borderRadius: '50%',
    padding: 0, // ensure it stays tight
    transition:
      'transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease',
    color: selected ? t.palette.common.black : base,
    backgroundColor: selected ? base : 'transparent',
    border: selected
      ? '1px solid transparent'
      : `1px solid ${alpha(base, 0.65)}`,
    boxShadow:
      glow && selected ? `0 0 6px ${glow6}, 0 0 18px ${glow18}` : 'none',

    '& .MuiSvgIcon-root': { fontSize: iconSizePx },
    '&:hover': {
      transform: 'translateZ(0) scale(1.06)',
      boxShadow: glow ? `0 0 6px ${glow6}, 0 0 18px ${glow18}` : 'none',
      // keep transparent fill on hover when not selected
      backgroundColor: selected ? base : 'transparent',
    },
    '&:active': { transform: 'scale(0.98)' },
    '&:focus-visible': {
      outline: `2px solid ${alpha(base, 0.9)}`,
      outlineOffset: 2,
      boxShadow: glow ? `0 0 6px ${glow6}, 0 0 18px ${glow18}` : 'none',
    },
  };

  return (
    <Tooltip title={title} arrow>
      {/* Keep tooltip & layout when disabled */}
      <span>
        <IconButton
          aria-label={title}
          disabled={disabled}
          onClick={onClick}
          size="small"
          sx={{ ...baseSx, ...(sx as object) }}
          {...iconButtonProps}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
