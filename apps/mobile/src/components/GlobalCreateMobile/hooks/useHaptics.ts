import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback } from 'react';

export function useHaptics() {
  const impact = useCallback(
    async (style: ImpactStyle = ImpactStyle.Medium) => {
      if (Capacitor.getPlatform() === 'web') return;
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('[haptic error]', e);
      }
    },
    []
  );

  return { impact };
}
