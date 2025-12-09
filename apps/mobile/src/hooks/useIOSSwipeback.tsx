// hooks/useIOSSwipeBack.ts
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useIOSSwipeBack() {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const EDGE_THRESHOLD = 24; // px from left edge to start gesture
    const SWIPE_THRESHOLD = 60; // how far you need to swipe to trigger back
    const MAX_VERTICAL_DRIFT = 80; // if you move more than this vertically, cancel

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];

      // Only start if they begin at the very left edge (like iOS native)
      if (touch.clientX > EDGE_THRESHOLD) return;

      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      // If they move mostly vertically or start swiping left, cancel
      if (dx < 0 || dy > MAX_VERTICAL_DRIFT) {
        tracking = false;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;

      if (dx > SWIPE_THRESHOLD) {
        // Looks like a legit edge swipe → go back
        navigate(-1);
      }

      tracking = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate]);
}
