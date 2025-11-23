/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import React, { useCallback, useRef, useState } from 'react';
import type { BandWithRole } from '../../types/bands';
import BandTileMobile from './BandTileMobile';

type Props = {
  bands: BandWithRole[];
  selectedId?: string;
  onSelect: (band: BandWithRole) => void;
  gapPx?: number;
  avatarSize?: number;
};

const MOVE_THRESHOLD_PX = 12;

export default function BandGridMobile({
  bands,
  selectedId,
  onSelect,
  gapPx = 10,
  avatarSize = 50,
}: Props) {
  const [activePressId, setActivePressId] = useState<string | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const wasLongPressRef = useRef(false);

  // Always 2 columns on the base layout (small screens)
  const columns = 2;

  // Adjust gap based on band count - you can keep this logic
  const effectiveGap = bands.length === 4 ? 8 : bands.length >= 5 ? 10 : gapPx;

  // Smaller avatars when in potentially denser layouts
  const effectiveAvatarSize = bands.length >= 5 ? 64 : avatarSize;

  const triggerLongPressHaptic = useCallback(() => {
    if (Capacitor.getPlatform() === 'web') return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }, []);

  const handlePressStart = useCallback(
    (
      band: BandWithRole,
      e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
      wasLongPressRef.current = false;

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        const t = e.touches[0];
        clientX = t.clientX;
        clientY = t.clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };

      longPressTimeoutRef.current = window.setTimeout(() => {
        wasLongPressRef.current = true;
        setActivePressId(band.id);
        triggerLongPressHaptic();
      }, 400);
    },
    [triggerLongPressHaptic]
  );

  const handlePressMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
    if (!e.touches || e.touches.length !== 1) return;

    const { x, y } = pressStartRef.current;
    const t = e.touches[0];
    const dx = t.clientX - x;
    const dy = t.clientY - y;

    if (Math.abs(dx) > MOVE_THRESHOLD_PX || Math.abs(dy) > MOVE_THRESHOLD_PX) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
      setActivePressId(null);
    }
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;
    setActivePressId(null);
  }, []);

  const handleTileClick = useCallback(
    (band: BandWithRole) => {
      if (wasLongPressRef.current) {
        wasLongPressRef.current = false;
        return;
      }
      onSelect(band);
    },
    [onSelect]
  );

  return (
    <div style={{ paddingInline: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: effectiveGap,
          alignItems: 'stretch',
        }}
        className="band-grid-responsive"
      >
        {bands.map((b) => {
          const pressed = activePressId === b.id;
          return (
            <div
              key={b.id}
              onTouchStart={(e) => handlePressStart(b, e)}
              onTouchMove={handlePressMove}
              onTouchEnd={handlePressEnd}
              onTouchCancel={handlePressEnd}
              onMouseDown={(e) => handlePressStart(b, e)}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              style={{
                width: '100%',
                minHeight: 0,
                aspectRatio: '1 / 1',
                maxWidth: '180px',
                maxHeight: '180px',
                margin: '0 auto',
                transform: pressed ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 120ms ease-out',
              }}
            >
              <BandTileMobile
                id={b.id}
                name={b.name}
                bandRole={b.role}
                avatar_url={b.avatar_url ?? null}
                avatarUpdatedAt={b.updated_at ?? null}
                selected={selectedId === b.id}
                size={effectiveAvatarSize}
                onClick={() => handleTileClick(b)}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @media (min-width: 700px) {
          .band-grid-responsive {
            grid-template-columns: repeat(${Math.min(
              bands.length,
              3
            )}, minmax(0, 1fr)) !important;
          }
        }

        @media (min-width: 1024px) {
          .band-grid-responsive {
            grid-template-columns: repeat(${Math.min(
              bands.length,
              4
            )}, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}

export type { BandWithRole };
