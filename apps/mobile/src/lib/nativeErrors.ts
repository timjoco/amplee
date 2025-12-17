/* eslint-disable @typescript-eslint/no-explicit-any */

export function isUserCancelled(err: unknown): boolean {
  const e = err as any;

  // Capacitor plugins usually throw something with a message
  const msg =
    (typeof e?.message === 'string' && e.message) ||
    (typeof e === 'string' && e) ||
    '';

  const m = msg.toLowerCase();

  // iOS Photos/Camera cancel messages vary by iOS/plugin version
  if (
    m.includes('user cancelled') ||
    m.includes('user canceled') ||
    m.includes('cancelled photos app') ||
    m.includes('canceled photos app') ||
    m.includes('the user cancelled') ||
    m.includes('the user canceled')
  ) {
    return true;
  }

  // Sometimes you get a numeric code instead
  const code = e?.code ?? e?.errorCode;
  if (code === 'USER_CANCELLED' || code === 'USER_CANCELED') return true;

  return false;
}
