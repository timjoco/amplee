// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNative = () => !!(window as any).Capacitor;

export const callbackUrl = () =>
  isNative()
    ? 'app.amplee://auth/callback'
    : `${window.location.origin}/auth/callback`;

export function getRedirectParam(): string | null {
  const u = new URL(window.location.href);
  const r = u.searchParams.get('redirect');
  if (!r) return null;
  try {
    const url = new URL(r, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export const afterLoginPath = () => '/home';

export const setLastEmail = (email: string) =>
  sessionStorage.setItem('amplee:lastEmail', email);
export const getLastEmail = () =>
  sessionStorage.getItem('amplee:lastEmail') || '';
