import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type {
  SetlistTemplateItemRow,
  SetlistTemplateLinkRow,
  SetlistTemplateRow,
} from '../types/setlistTypes';

/**
 * Data loading hook for a setlist template editor.
 * Fetches the template row, template items, and template links from Supabase,
 * and exposes setters so the editor can update local state after mutations.
 */
export function useSetlistTemplateLoad(bandId?: string, setlistId?: string) {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<SetlistTemplateRow | null>(null);
  const [items, setItems] = useState<SetlistTemplateItemRow[]>([]);
  const [links, setLinks] = useState<SetlistTemplateLinkRow[]>([]);

  useEffect(() => {
    let alive = true;

    if (!bandId || !setlistId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [
          { data: tmpl, error: tErr },
          { data: rows, error: rErr },
          { data: linkRows, error: lErr },
        ] = await Promise.all([
          supabase
            .from('setlist_templates')
            .select('id,band_id,name,created_at')
            .eq('id', setlistId)
            .eq('band_id', bandId)
            .maybeSingle(),
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

        if (!alive) return;

        if (tErr || !tmpl) {
          console.error('[SetlistTemplate] template load error', tErr);
          setTemplate(null);
        } else {
          setTemplate(tmpl as SetlistTemplateRow);
        }

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
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId, setlistId]);

  return { loading, template, setTemplate, items, setItems, links, setLinks };
}
