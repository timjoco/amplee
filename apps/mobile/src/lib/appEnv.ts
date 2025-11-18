export function getAppOrigin(): string {
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

export function getApiBase(): string {
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
