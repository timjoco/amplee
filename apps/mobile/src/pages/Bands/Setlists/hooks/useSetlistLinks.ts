import { useCallback, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { SetlistTemplateLinkRow } from '../types/setlistTypes';
import { detectLinkType } from '../utils/setlistUtils';

/**
 * External link management hook for setlist templates.
 * Handles the "Add Link" modal state, URL validation + provider detection,
 * and insert/delete of template links in Supabase, plus a helper to open links.
 */
export function useSetlistLinks(args: {
  setlistId?: string;
  links: SetlistTemplateLinkRow[];
  setLinks: React.Dispatch<React.SetStateAction<SetlistTemplateLinkRow[]>>;
  triggerHaptic: () => Promise<void> | void;
}) {
  const { setlistId, setLinks, triggerHaptic } = args;

  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const openAddLink = useCallback(() => {
    setNewLinkUrl('');
    setNewLinkLabel('');
    setLinkError(null);
    setShowAddLink(true);
  }, []);

  const closeAddLink = useCallback(() => setShowAddLink(false), []);

  const handleAddLink = useCallback(async () => {
    if (!setlistId || !newLinkUrl.trim()) return;

    let url = newLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      new URL(url);
    } catch {
      setLinkError('Please enter a valid URL');
      return;
    }

    setSavingLink(true);
    setLinkError(null);

    try {
      const detected = detectLinkType(url);
      const label = newLinkLabel.trim() || detected.label;

      const { data, error } = await supabase
        .from('setlist_template_links')
        .insert({ template_id: setlistId, url, label })
        .select('*')
        .single();

      if (error) {
        console.error('[SetlistTemplate] add link error', error);
        setLinkError('Failed to add link');
        return;
      }

      setLinks((prev) => [...prev, data as SetlistTemplateLinkRow]);
      setShowAddLink(false);
      void triggerHaptic();
    } catch (e) {
      console.error('[SetlistTemplate] handleAddLink', e);
      setLinkError('Failed to add link');
    } finally {
      setSavingLink(false);
    }
  }, [newLinkLabel, newLinkUrl, setLinks, setlistId, triggerHaptic]);

  const handleDeleteLink = useCallback(
    async (linkId: string) => {
      void triggerHaptic();

      const { error } = await supabase
        .from('setlist_template_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        console.error('[SetlistTemplate] delete link error', error);
        return;
      }

      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    },
    [setLinks, triggerHaptic]
  );

  const openExternalLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return {
    showAddLink,
    newLinkUrl,
    newLinkLabel,
    setNewLinkUrl,
    setNewLinkLabel,
    savingLink,
    linkError,
    openAddLink,
    closeAddLink,
    handleAddLink,
    handleDeleteLink,
    openExternalLink,
  };
}
