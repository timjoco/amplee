import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useRef, useState } from 'react';
import type { EventRow } from '../../../../lib/cache/eventInboxCache';

export function usePressActions({
  rows,
  bandId,
  isAdmin,
  adminBandIds,
  enabled,
  onArchiveRequested,
}: {
  rows: EventRow[];
  bandId?: string;
  isAdmin: boolean;
  adminBandIds: string[];
  enabled: boolean;
  onArchiveRequested: (target: EventRow) => void;
}) {
  const longPressFiredRef = useRef(false);
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const MOVE_THRESHOLD = 12;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);

  const [actionTarget, setActionTarget] = useState<EventRow | null>(null);
  const [showActions, setShowActions] = useState(false);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  }, []);

  const clearTimeoutIfNeeded = () => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handlePressEnd = useCallback(() => {
    clearTimeoutIfNeeded();
    pressStartRef.current = null;

    if (pressedId != null) setTimeout(() => setPressedId(null), 130);
    setTimeout(() => {
      longPressFiredRef.current = false;
    }, 0);
  }, [pressedId]);

  const handlePressStart = useCallback(
    (
      id: string,
      e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      if (!enabled) return;

      longPressFiredRef.current = false;
      clearTimeoutIfNeeded();

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };

      longPressTimeoutRef.current = window.setTimeout(() => {
        setPressedId(id);
        void triggerHaptic();

        const target = rows.find((r) => r.id === id) ?? null;
        if (!target) return;

        const ts = target.starts_at ? new Date(target.starts_at).getTime() : 0;
        const isPast = ts > 0 && ts < Date.now();

        const isAdminForTarget = bandId
          ? isAdmin
          : adminBandIds.includes(target.band_id);

        if (isAdminForTarget && isPast) {
          longPressFiredRef.current = true;
          setActionTarget(target);
          setShowActions(true);
        }
      }, 350);
    },
    [enabled, triggerHaptic, rows, isAdmin, bandId, adminBandIds]
  );

  const handlePressMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
    if (e.touches.length !== 1) return;

    const { x, y } = pressStartRef.current;
    const t = e.touches[0];

    if (
      Math.abs(t.clientX - x) > MOVE_THRESHOLD ||
      Math.abs(t.clientY - y) > MOVE_THRESHOLD
    ) {
      clearTimeoutIfNeeded();
    }
  }, []);

  const requestArchiveFromActionSheet = useCallback(() => {
    if (!actionTarget) return;
    onArchiveRequested(actionTarget);
  }, [actionTarget, onArchiveRequested]);

  // binder for row props
  const bindPressHandlers = {
    onMouseEnter: (id: string) => setHoveredId(id),
    onMouseLeave: () => {
      setHoveredId(null);
      setPressedId(null);
      longPressFiredRef.current = false;
    },
    getHandlers: (id: string) => ({
      onTouchStart: (ev: React.TouchEvent<HTMLDivElement>) => {
        setPressedId(id);
        handlePressStart(id, ev);
      },
      onTouchMove: handlePressMove,
      onTouchEnd: (ev: React.TouchEvent<HTMLDivElement>) => {
        if (longPressFiredRef.current) {
          ev.preventDefault();
          ev.stopPropagation();
          handlePressEnd();
          return;
        }
        handlePressEnd();
        setTimeout(() => setPressedId(null), 150);
      },
      onTouchCancel: () => {
        handlePressEnd();
        setPressedId(null);
      },
      onMouseDown: (ev: React.MouseEvent<HTMLDivElement>) => {
        setPressedId(id);
        handlePressStart(id, ev);
      },
      onMouseUp: (ev: React.MouseEvent<HTMLDivElement>) => {
        if (longPressFiredRef.current) {
          ev.preventDefault();
          ev.stopPropagation();
          handlePressEnd();
          return;
        }
        handlePressEnd();
        setTimeout(() => setPressedId(null), 150);
      },
    }),
    // expose this so row click can block navigation if long press fired
    didLongPressFire: () => longPressFiredRef.current,
    clearLongPress: () => {
      longPressFiredRef.current = false;
    },
  };

  return {
    hoveredId,
    pressedId,
    actionTarget,
    showActions,
    setShowActions,
    bindPressHandlers,
    requestArchiveFromActionSheet,
  };
}
