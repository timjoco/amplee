/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useRef, useState } from 'react';

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

  const triggerLongPressHaptic = useCallback(() => {
    if (Capacitor.getPlatform() === 'web') return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }, []);

  const handlePressStart = useCallback(
    (band: BandWithRole, e: any) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      wasLongPressRef.current = false;

      let clientX = 0;
      let clientY = 0;

      if (e?.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (typeof e?.clientX === 'number') {
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

  const handlePressMove = useCallback((e: any) => {
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
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: gapPx,
          alignItems: 'stretch',
        }}
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
                size={avatarSize}
                onClick={() => handleTileClick(b)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { BandWithRole };
