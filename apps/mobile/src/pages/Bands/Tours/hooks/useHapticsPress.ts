import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useState } from 'react';

export function useHapticsPress() {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[haptic error]', e);
    }
  }, []);

  const handleButtonPress = useCallback(
    (buttonId: string, action: () => void) => {
      void triggerHaptic();
      setPressedButton(buttonId);
      action();
      setTimeout(() => setPressedButton(null), 130);
    },
    [triggerHaptic]
  );

  return { pressedButton, triggerHaptic, handleButtonPress };
}
