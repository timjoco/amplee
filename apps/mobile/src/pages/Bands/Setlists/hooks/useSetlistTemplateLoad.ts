import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type {
  SetlistTemplateItemRow,
  SetlistTemplateLinkRow,
  SetlistTemplateRow,
} from '../types/setlistTypes';

/**
 * Data loading hook for a setlist template editor.
 * Fetches template, items, and links from Supabase.
 *
 *
 * - Clears state when params are missing (prevents stale flashes)
 * - Exposes a reload() function so other hooks can re-sync after failures
 * - Loads template by setlistId (RLS is the authority), then optionally validates bandId
 */
export function useSetlistTemplateLoad(bandId?: string, setlistId?: string) {
  const [loading, setLoading] = useState(true);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [template, setTemplate] = useState<SetlistTemplateRow | null>(null);
  const [items, setItems] = useState<SetlistTemplateItemRow[]>([]);
  const [links, setLinks] = useState<SetlistTemplateLinkRow[]>([]);

  const reload = useCallback(async () => {
    if (!setlistId) {
      // No template selected – ensure local state is empty
      // Keep loading true until we have valid params to prevent "not found" flash
      setTemplate(null);
      setItems([]);
      setLinks([]);
      return;
    }

    setLoading(true);
    try {
      // 1) Load template by ID only (RLS enforces access).
      //    bandId in the URL is a routing detail; treat it as optional validation.
      const { data: tmpl, error: tErr } = await supabase
        .from('setlist_templates')
        .select('id,band_id,name,created_at')
        .eq('id', setlistId)
        .maybeSingle();

      if (tErr || !tmpl) {
        console.error('[SetlistTemplate] template load error', tErr);
        setTemplate(null);
        setItems([]);
        setLinks([]);
        return;
      }

      // Optional: if you *expect* bandId to match the URL, you can log or handle mismatch here.
      // We don't hard-fail because it can produce false "not found" states.
      if (bandId && tmpl.band_id !== bandId) {
        console.warn('[SetlistTemplate] bandId mismatch', {
          routeBandId: bandId,
          templateBandId: tmpl.band_id,
        });
        // Optional: navigate to `/bands/${tmpl.band_id}/setlists/${setlistId}`
      }

      setTemplate(tmpl as SetlistTemplateRow);

      // 2) Load items/links in parallel after template is confirmed
      const [{ data: rows, error: rErr }, { data: linkRows, error: lErr }] =
        await Promise.all([
          supabase
            .from('setlist_template_items')
            .select('*')
            .eq('template_id', setlistId)
            .order('order_index', { ascending: true }),
          supabase
            .from('setlist_template_links')
            .select('*')
            .eq('template_id', setlistId)
            .order('created_at', { ascending: true }),
        ]);

      if (rErr) {
        console.error('[SetlistTemplate] items load error', rErr);
        setItems([]);
      } else {
        setItems((rows || []) as SetlistTemplateItemRow[]);
      }

      if (lErr) {
        console.error('[SetlistTemplate] links load error', lErr);
        setLinks([]);
      } else {
        setLinks((linkRows || []) as SetlistTemplateLinkRow[]);
      }
    } finally {
      setLoading(false);
      setHasAttemptedLoad(true);
    }
  }, [bandId, setlistId]);

  useEffect(() => {
    let alive = true;

    // If params missing, clear state but keep loading true to prevent "not found" flash
    // Only show "not found" after we've actually tried to load with valid params
    if (!bandId || !setlistId) {
      setTemplate(null);
      setItems([]);
      setLinks([]);
      // Don't set loading to false - keep showing spinner until params are ready
      return;
    }

    // Kick off load; ignore state updates after unmount
    (async () => {
      try {
        await reload();
      } finally {
        // reload() already manages loading state
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId, setlistId, reload]);

  return {
    loading,
    hasAttemptedLoad,
    template,
    setTemplate,
    items,
    setItems,
    links,
    setLinks,
    reload,
  };
}
