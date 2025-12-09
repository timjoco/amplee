// useChatKeyboardPadding.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { useEffect, useMemo, useState } from 'react';

export function useChatKeyboardPadding() {
  const isNative = Capacitor.isNativePlatform();
  const platform = isNative ? Capacitor.getPlatform() : 'web';
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const BASE_NAV_OFFSET = isAndroid ? 50 : 8;

  // Keyboard listeners (Android only – iOS handled natively)
  useEffect(() => {
    if (!isNative || isIOS) return;

    let willShowSub: any;
    let willHideSub: any;
    let didShowSub: any;

    (async () => {
      try {
        willShowSub = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardHeight(info.keyboardHeight);
        });

        willHideSub = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
        });

        didShowSub = await Keyboard.addListener('keyboardDidShow', (info) => {
          setKeyboardHeight((prev) => prev || info.keyboardHeight);
        });
      } catch (e) {
        console.warn('[keyboard listeners error]', e);
      }
    })();

    return () => {
      willShowSub?.remove?.();
      willHideSub?.remove?.();
      didShowSub?.remove?.();
    };
  }, [isNative, isIOS]);

  const composerPaddingBottom = useMemo(() => {
    if (isAndroid && keyboardHeight > 0) {
      return keyboardHeight + 8;
    }
    return `calc(env(safe-area-inset-bottom, 0px) + ${BASE_NAV_OFFSET}px)`;
  }, [isAndroid, keyboardHeight, BASE_NAV_OFFSET]);

  return {
    composerPaddingBottom,
    keyboardHeight,
    isAndroid,
    isIOS,
    isNative,
  };
}
