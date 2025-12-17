import { useCallback, useRef, useState } from 'react';

export function usePressedAction(opts?: {
  delayMs?: number;
  onBefore?: (buttonId: string) => void;
}) {
  const delayMs = opts?.delayMs ?? 120;

  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const press = useCallback(
    (buttonId: string, action: () => void) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);

      setPressedButton(buttonId);
      opts?.onBefore?.(buttonId);

      timerRef.current = window.setTimeout(() => {
        setPressedButton(null);
        action();
      }, delayMs);
    },
    [delayMs, opts]
  );

  const clear = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setPressedButton(null);
  }, []);

  return { pressedButton, press, clear };
}
