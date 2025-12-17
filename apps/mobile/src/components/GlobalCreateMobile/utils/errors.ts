export const normalizeCreateEventError = (e: any) => {
  const msg = String(e?.message ?? e ?? '');
  const code = e?.code ?? e?.status;

  if (code === '42501' || /row[- ]level security/i.test(msg)) {
    return "You don't have permission to create events for this band.";
  }
  if (code === 401 || code === 403) {
    return "You're not allowed to create events for this band.";
  }
  return 'Could not create the event. Please try again.';
};
