import { Capacitor } from '@capacitor/core';

const isAndroid = Capacitor.getPlatform() === 'android';

/**
 * A fixed footer that covers the Android navigation bar area.
 * Content scrolls behind this footer, similar to Instagram's approach.
 */
export default function AndroidBottomSafeArea() {
  if (!isAndroid) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        background: 'linear-gradient(180deg, transparent 0%, #020109 30%)',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  );
}
