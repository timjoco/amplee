import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useState } from 'react';

/**
 * Small UI interaction hook.
 * Provides a platform-safe haptic trigger and a "pressedButton" helper that
 * supports short press animations before running an action callback.
 */
export function useHapticsPress() {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // ignore
    }
  }, []);

  const handleButtonPress = useCallback(
    (buttonId: string, action: () => void) => {
      setPressedButton(buttonId);
      void triggerHaptic();
      setTimeout(() => {
        setPressedButton(null);
        action();
      }, 120);
    },
    [triggerHaptic]
  );

  return { pressedButton, triggerHaptic, handleButtonPress };
}
