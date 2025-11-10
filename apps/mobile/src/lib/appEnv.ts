// Works for web (vite dev) and native (Capacitor)
export function getAppOrigin(): string {
  // Prefer explicit app URL if you set it (same as web NEXT_PUBLIC_APP_URL)
  const fromEnv =
    import.meta.env.VITE_APP_URL || import.meta.env.NEXT_PUBLIC_APP_URL || '';
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {}
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:5173';
}

// If you host Next API routes on your web app, mobile can hit them via this base:
export function getApiBase(): string {
  // allows pointing to production API (e.g., https://amplee.app)
  return (import.meta.env.VITE_API_BASE || getAppOrigin()).replace(/\/+$/, '');
}

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
}
