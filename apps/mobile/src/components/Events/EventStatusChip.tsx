/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

type EventStatusChipProps = {
  isBooked?: boolean;
  isCancelled?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
};

export default function EventStatusChip({
  isBooked = false,
  isCancelled = false,
  size = 'md',
  style,
}: EventStatusChipProps) {
  let label: string;
  let bg: string;
  let border: string;
  let color: string;

  if (isCancelled) {
    label = 'Cancelled';
    bg = 'rgba(248,113,113,0.18)';
    border = 'rgba(248,113,113,0.7)';
    color = '#FCA5A5';
  } else if (isBooked) {
    label = 'Booked';
    bg = 'rgba(76,175,80,0.16)';
    border = 'rgba(76,175,80,0.45)';
    color = '#C9F5D0';
  } else {
    label = 'Pending';
    bg = 'rgba(255,193,7,0.2)';
    border = 'rgba(255,193,7,0.5)';
    color = '#FFE7AA';
  }

  const sizeStyles =
    size === 'sm'
      ? {
          fontSize: 10.5,
          paddingInline: 7,
          paddingBlock: 2,
          transform: 'scale(0.9)',
          transformOrigin: 'center right',
        }
      : {
          fontSize: 11,
          paddingInline: 8,
          paddingBlock: 3,
        };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        fontWeight: 600,
        textTransform: 'capitalize',
        background: bg,
        color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.1,
        ...sizeStyles,
        ...style,
      }}
    >
      {label}
    </span>
  );
}
