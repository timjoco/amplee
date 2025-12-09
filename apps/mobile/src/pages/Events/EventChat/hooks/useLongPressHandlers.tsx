// useLongPressHandlers.ts
import { useCallback, useRef, type MouseEvent, type TouchEvent } from 'react';

const MOVE_THRESHOLD_PX = 12;

type UseLongPressHandlersArgs = {
  onLongPress: (id: string) => void;
  delayMs?: number;
};

export function useLongPressHandlers({
  onLongPress,
  delayMs = 500,
}: UseLongPressHandlersArgs) {
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePressStart = useCallback(
    (
      id: string,
      e: TouchEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && 'changedTouches' in e) {
        const touchEvent = e as TouchEvent<HTMLDivElement>;
        if (touchEvent.touches.length > 0) {
          clientX = touchEvent.touches[0].clientX;
          clientY = touchEvent.touches[0].clientY;
        }
      } else if ('clientX' in e) {
        const me = e as MouseEvent<HTMLDivElement>;
        clientX = me.clientX;
        clientY = me.clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };

      longPressTimeoutRef.current = window.setTimeout(() => {
        onLongPress(id);
      }, delayMs);
    },
    [onLongPress, delayMs]
  );

  const handlePressMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
    if (e.touches.length !== 1) return;

    const { x, y } = pressStartRef.current;
    const t = e.touches[0];
    const dx = t.clientX - x;
    const dy = t.clientY - y;

    if (Math.abs(dx) > MOVE_THRESHOLD_PX || Math.abs(dy) > MOVE_THRESHOLD_PX) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;
  }, []);

  return {
    handlePressStart,
    handlePressMove,
    handlePressEnd,
  };
}
