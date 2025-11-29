/* ------------------ HOOK ------------------ */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

import {
  SetlistTemplateItemRow,
  SetlistTemplateLinkRow,
  SetlistTemplateRow,
  SongOption,
  detectLinkType,
} from '../utils/setlists';

type UseSetlistTemplateEditorArgs = {
  bandId?: string;
  setlistId?: string;
  onDeleted?: () => void;
};

export function useSetlistTemplateEditor({
  bandId,
  setlistId,
  onDeleted,
}: UseSetlistTemplateEditorArgs) {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<SetlistTemplateRow | null>(null);
  const [items, setItems] = useState<SetlistTemplateItemRow[]>([]);
  const [links, setLinks] = useState<SetlistTemplateLinkRow[]>([]);
  const [savingReorder, setSavingReorder] = useState(false);

  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // song picker state
  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [songSearch, setSongSearch] = useState('');

  // template edit / delete state
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [showDeleteTemplate, setShowDeleteTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  // link add state
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // DnD sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 4 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 160, tolerance: 6 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[haptic error]', e);
    }
  }, []);

  const handleButtonPress = useCallback(
    (buttonId: string, action: () => void) => {
      setPressedButton(buttonId);
      triggerHaptic();
      setTimeout(() => {
        setPressedButton(null);
        action();
      }, 120);
    },
    [triggerHaptic]
  );

  const filteredSongs = useMemo(
    () =>
      songs.filter((s) =>
        s.title.toLowerCase().includes(songSearch.toLowerCase())
      ),
    [songs, songSearch]
  );

  // ---------- Load template + items + links ----------
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
          console.error(
            '[SetlistTemplateEditorMobile] template load error',
            tErr
          );
          setTemplate(null);
        } else {
          setTemplate(tmpl as SetlistTemplateRow);
        }

        if (rErr) {
          console.error('[SetlistTemplateEditorMobile] items load error', rErr);
          setItems([]);
        } else {
          setItems((rows || []) as SetlistTemplateItemRow[]);
        }

        if (lErr) {
          console.error('[SetlistTemplateEditorMobile] links load error', lErr);
          setLinks((linkRows || []) as SetlistTemplateLinkRow[]);
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

  // ---------- Reorder ----------
  const saveOrder = useCallback(
    async (rows: SetlistTemplateItemRow[]) => {
      if (!rows.length || !setlistId) return;
      setSavingReorder(true);
      try {
        const payload = rows.map((r) => ({
          ...r,
          template_id: r.template_id ?? setlistId,
          musical_key: r.musical_key ?? null,
          bpm: r.bpm ?? null,
          notes: r.notes ?? null,
        }));

        const { error } = await supabase
          .from('setlist_template_items')
          .upsert(payload);

        if (error) {
          console.error(
            '[SetlistTemplateEditorMobile] save order error',
            error
          );
        }
      } finally {
        setSavingReorder(false);
      }
    },
    [setlistId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      triggerHaptic();

      setItems((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id);
        const newIndex = prev.findIndex((r) => r.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const moved = arrayMove(prev, oldIndex, newIndex).map((row, i) => ({
          ...row,
          order_index: i,
        }));

        void saveOrder(moved);
        return moved;
      });
    },
    [saveOrder, triggerHaptic]
  );

  // ---------- Songs: load + picker ----------
  const loadSongs = useCallback(async () => {
    if (!bandId) return;
    setLoadingSongs(true);
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,default_key,default_bpm')
        .eq('band_id', bandId)
        .order('title', { ascending: true });

      if (error) {
        console.error('[SetlistTemplateEditorMobile] load songs error', error);
        setSongs([]);
      } else {
        setSongs((data || []) as SongOption[]);
      }
    } finally {
      setLoadingSongs(false);
    }
  }, [bandId]);

  const openSongPicker = useCallback(() => {
    setSongPickerOpen(true);
    setSongSearch('');
    if (!songs.length) {
      void loadSongs();
    }
  }, [songs.length, loadSongs]);

  const closeSongPicker = useCallback(() => {
    setSongPickerOpen(false);
  }, []);

  const handleSelectSong = useCallback(
    async (song: SongOption) => {
      if (!setlistId) return;

      triggerHaptic();

      try {
        const order_index = items.length;

        const insert = {
          template_id: setlistId,
          title: song.title,
          musical_key: song.default_key,
          bpm: song.default_bpm,
          notes: null as string | null,
          order_index,
        };

        const { data, error } = await supabase
          .from('setlist_template_items')
          .insert(insert)
          .select('*')
          .single();

        if (error) {
          console.error(
            '[SetlistTemplateEditorMobile] add song to template error',
            error
          );
          return;
        }

        setItems((prev) => [...prev, data as SetlistTemplateItemRow]);
        setSongPickerOpen(false);
      } catch (err) {
        console.error('[SetlistTemplateEditorMobile] handleSelectSong', err);
      }
    },
    [setlistId, items.length, triggerHaptic]
  );

  // ---------- Delete item ----------
  const handleDeleteItem = useCallback(
    async (id: string) => {
      triggerHaptic();

      try {
        const { error } = await supabase
          .from('setlist_template_items')
          .delete()
          .eq('id', id);
        if (error) {
          console.error(
            '[SetlistTemplateEditorMobile] delete item error',
            error
          );
          return;
        }

        setItems((prev) => {
          const remaining = prev.filter((r) => r.id !== id);
          const renumbered = remaining.map((r, i) => ({
            ...r,
            order_index: i,
          }));
          void saveOrder(renumbered);
          return renumbered;
        });
      } catch (err) {
        console.error('[SetlistTemplateEditorMobile] handleDeleteItem', err);
      }
    },
    [saveOrder, triggerHaptic]
  );

  // ---------- Links handlers ----------
  const openAddLink = useCallback(() => {
    setNewLinkUrl('');
    setNewLinkLabel('');
    setLinkError(null);
    setShowAddLink(true);
  }, []);

  const closeAddLink = useCallback(() => {
    setShowAddLink(false);
  }, []);

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
        .insert({
          template_id: setlistId,
          url,
          label,
        })
        .select('*')
        .single();

      if (error) {
        console.error('[SetlistTemplateEditorMobile] add link error', error);
        setLinkError('Failed to add link');
        return;
      }

      setLinks((prev) => [...prev, data as SetlistTemplateLinkRow]);
      setShowAddLink(false);
      triggerHaptic();
    } catch (err) {
      console.error('[SetlistTemplateEditorMobile] handleAddLink', err);
      setLinkError('Failed to add link');
    } finally {
      setSavingLink(false);
    }
  }, [setlistId, newLinkUrl, newLinkLabel, triggerHaptic]);

  const handleDeleteLink = useCallback(
    async (linkId: string) => {
      triggerHaptic();

      try {
        const { error } = await supabase
          .from('setlist_template_links')
          .delete()
          .eq('id', linkId);

        if (error) {
          console.error(
            '[SetlistTemplateEditorMobile] delete link error',
            error
          );
          return;
        }

        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      } catch (err) {
        console.error('[SetlistTemplateEditorMobile] handleDeleteLink', err);
      }
    },
    [triggerHaptic]
  );

  const openExternalLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // ---------- Template edit / delete handlers ----------
  const startEditTemplate = useCallback(() => {
    if (!template) return;
    setEditName(template.name || '');
    setShowEditTemplate(true);
  }, [template]);

  const closeEditTemplate = useCallback(() => {
    if (!savingTemplate) setShowEditTemplate(false);
  }, [savingTemplate]);

  const saveTemplateEdits = useCallback(async () => {
    if (!template || !bandId) return;

    try {
      setSavingTemplate(true);
      const name = editName.trim() || 'Untitled setlist';

      const { error } = await supabase
        .from('setlist_templates')
        .update({ name })
        .eq('id', template.id)
        .eq('band_id', bandId);

      if (error) {
        console.error(
          '[SetlistTemplateEditorMobile] update template error',
          error
        );
        return;
      }

      setTemplate((prev) =>
        prev
          ? {
              ...prev,
              name,
            }
          : prev
      );
      setShowEditTemplate(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTemplate(false);
    }
  }, [template, bandId, editName]);

  const openDeleteTemplateConfirm = useCallback(() => {
    setShowDeleteTemplate(true);
  }, []);

  const closeDeleteTemplateConfirm = useCallback(() => {
    if (!deletingTemplate) setShowDeleteTemplate(false);
  }, [deletingTemplate]);

  const deleteTemplate = useCallback(async () => {
    if (!template || !bandId) return;

    try {
      setDeletingTemplate(true);

      await supabase
        .from('setlist_template_links')
        .delete()
        .eq('template_id', template.id);

      await supabase
        .from('setlist_template_items')
        .delete()
        .eq('template_id', template.id);

      const { error } = await supabase
        .from('setlist_templates')
        .delete()
        .eq('id', template.id)
        .eq('band_id', bandId);

      if (error) {
        console.error(
          '[SetlistTemplateEditorMobile] delete template error',
          error
        );
        setDeletingTemplate(false);
        return;
      }

      setShowDeleteTemplate(false);
      onDeleted?.();
    } catch (e) {
      console.error(e);
      setDeletingTemplate(false);
    }
  }, [template, bandId, onDeleted]);

  const minutesEstimate =
    items.length > 0 ? Math.round((items.length * 4) / 5) * 5 : 0;

  return {
    // data
    loading,
    template,
    items,
    links,
    savingReorder,
    songs,
    loadingSongs,
    songSearch,
    filteredSongs,
    songPickerOpen,
    showAddLink,
    newLinkUrl,
    newLinkLabel,
    savingLink,
    linkError,
    showEditTemplate,
    editName,
    savingTemplate,
    showDeleteTemplate,
    deletingTemplate,
    sensors,
    pressedButton,
    minutesEstimate,

    // setters / simple updaters
    setSongSearch,
    setNewLinkUrl,
    setNewLinkLabel,
    setEditName,

    // actions
    handleButtonPress,
    handleDragEnd,
    handleDeleteItem,
    openSongPicker,
    closeSongPicker,
    handleSelectSong,
    openAddLink,
    closeAddLink,
    handleAddLink,
    handleDeleteLink,
    openExternalLink,
    startEditTemplate,
    closeEditTemplate,
    saveTemplateEdits,
    openDeleteTemplateConfirm,
    closeDeleteTemplateConfirm,
    deleteTemplate,
  };
}
