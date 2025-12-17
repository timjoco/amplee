import { useMemo } from 'react';
import type { SetlistTemplateItemRow } from '../types/setlistTypes';

/**
 * Derived stats hook for setlist templates.
 * Computes total duration (seconds/minutes/label) from template items and can
 * provide a simple "minutesEstimate" fallback based on song count.
 */
export function useSetlistDurations(items: SetlistTemplateItemRow[]) {
  const totalDurationSeconds = useMemo(() => {
    return items.reduce(
      (sum, r) => sum + (Number(r.duration_seconds ?? 0) || 0),
      0
    );
  }, [items]);

  const totalDurationMinutes = useMemo(() => {
    return totalDurationSeconds ? Math.ceil(totalDurationSeconds / 60) : 0;
  }, [totalDurationSeconds]);

  const totalDurationLabel = useMemo(() => {
    if (!totalDurationSeconds) return '—';
    const mm = Math.floor(totalDurationSeconds / 60);
    const ss = totalDurationSeconds % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
  }, [totalDurationSeconds]);

  // keep your existing rough fallback too if you still want it
  const minutesEstimate =
    items.length > 0 ? Math.round((items.length * 4) / 5) * 5 : 0;

  return {
    totalDurationSeconds,
    totalDurationMinutes,
    totalDurationLabel,
    minutesEstimate,
  };
}
