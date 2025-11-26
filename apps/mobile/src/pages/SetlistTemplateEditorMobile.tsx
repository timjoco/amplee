/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  createOutline,
  musicalNotesOutline,
  reorderThreeOutline,
  searchOutline,
  sparklesOutline,
  speedometerOutline,
  trashOutline,
} from 'ionicons/icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type RouteParams = {
  bandId: string;
  setlistId: string;
};

type TemplateRow = {
  id: string;
  band_id: string;
  name: string;
  created_at: string | null;
};

type TemplateItemRow = {
  id: string;
  template_id: string;
  order_index: number;
  title: string;
  musical_key: string | null;
  bpm: number | null;
  notes: string | null;
};

type SongOption = {
  id: string;
  title: string;
  default_key: string | null;
  default_bpm: number | null;
};

export default function SetlistTemplateEditorMobile() {
  const nav = useNavigate();
  const { bandId, setlistId } = useParams<RouteParams>();

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [items, setItems] = useState<TemplateItemRow[]>([]);
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

  // Filter songs by search
  const filteredSongs = songs.filter((s) =>
    s.title.toLowerCase().includes(songSearch.toLowerCase())
  );

  // ---------- Load template + items ----------
  useEffect(() => {
    let alive = true;

    if (!bandId || !setlistId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [{ data: tmpl, error: tErr }, { data: rows, error: rErr }] =
          await Promise.all([
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
          ]);

        if (!alive) return;

        if (tErr || !tmpl) {
          console.error(
            '[SetlistTemplateEditorMobile] template load error',
            tErr
          );
          setTemplate(null);
        } else {
          setTemplate(tmpl as TemplateRow);
        }

        if (rErr) {
          console.error('[SetlistTemplateEditorMobile] items load error', rErr);
          setItems([]);
        } else {
          setItems((rows || []) as TemplateItemRow[]);
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
    async (rows: TemplateItemRow[]) => {
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

        setItems((prev) => [...prev, data as TemplateItemRow]);
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

  // ---------- Template edit / delete handlers ----------
  function startEditTemplate() {
    if (!template) return;
    setEditName(template.name || '');
    setShowEditTemplate(true);
  }

  async function saveTemplateEdits() {
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
  }

  async function deleteTemplate() {
    if (!template || !bandId) return;

    try {
      setDeletingTemplate(true);

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
      nav(`/bands/${bandId}/setlists`);
    } catch (e) {
      console.error(e);
      setDeletingTemplate(false);
    }
  }

  // ---------- Render body ----------
  const renderBody = () => {
    if (loading) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            gap: 12,
          }}
        >
          <IonSpinner
            name="crescent"
            style={{ '--color': '#f472b6', width: 32, height: 32 }}
          />
          <IonText color="medium">
            <p style={{ margin: 0, fontSize: 14 }}>Loading setlist…</p>
          </IonText>
        </div>
      );
    }

    if (!template) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            gap: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'rgba(244, 114, 182, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IonIcon
              icon={musicalNotesOutline}
              style={{ fontSize: 32, color: '#f472b6' }}
            />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#e5e7eb',
            }}
          >
            Setlist not found
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
            This setlist may have been deleted or moved.
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          padding: 16,
          paddingBottom: 100,
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(244, 114, 182, 0.08)',
              border: '1px solid rgba(244, 114, 182, 0.2)',
              borderRadius: 14,
              padding: '12px 16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#f472b6',
                lineHeight: 1,
              }}
            >
              {items.length}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {items.length === 1 ? 'SONG' : 'SONGS'}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: 'rgba(244, 114, 182, 0.08)',
              border: '1px solid rgba(244, 114, 182, 0.2)',
              borderRadius: 14,
              padding: '12px 16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#f472b6',
                lineHeight: 1,
              }}
            >
              {items.length > 0
                ? `~${Math.round((items.length * 4) / 5) * 5}`
                : '0'}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              MINUTES
            </div>
          </div>

          {savingReorder && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(244, 114, 182, 0.15)',
                fontSize: 12,
                color: '#f472b6',
              }}
            >
              <IonSpinner
                name="dots"
                style={{ '--color': '#f472b6', width: 16, height: 16 }}
              />
              Saving…
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => handleButtonPress('rename', startEditTemplate)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(244, 114, 182, 0.3)',
              background: 'rgba(244, 114, 182, 0.08)',
              color: '#f472b6',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 100ms ease-out',
              transform:
                pressedButton === 'rename' ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
            Rename
          </button>

          <button
            type="button"
            onClick={() =>
              handleButtonPress('delete', () => setShowDeleteTemplate(true))
            }
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 100ms ease-out',
              transform:
                pressedButton === 'delete' ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
            Delete
          </button>
        </div>

        {/* Songs section */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 18, color: '#f472b6' }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Songs
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleButtonPress('add', openSongPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 20,
                border: '1px solid rgba(244, 114, 182, 0.4)',
                background: 'rgba(244, 114, 182, 0.15)',
                color: '#f472b6',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 100ms ease-out',
                transform: pressedButton === 'add' ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
              Add
            </button>
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(244, 114, 182, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <IonIcon
                  icon={sparklesOutline}
                  style={{ fontSize: 28, color: '#f472b6' }}
                />
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#e5e7eb',
                  marginBottom: 6,
                }}
              >
                Start building your setlist
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#6b7280',
                  marginBottom: 16,
                }}
              >
                Add songs from your library and drag to reorder
              </p>

              <button
                type="button"
                onClick={openSongPicker}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#f472b6',
                  color: '#000',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Add your first song
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={items.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {items.map((row, index) => (
                    <SortableTemplateItemCard
                      key={row.id}
                      row={row}
                      index={index}
                      onDelete={() => handleDeleteItem(row.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Song picker modal */}
        <IonModal
          isOpen={songPickerOpen}
          onDidDismiss={() => setSongPickerOpen(false)}
          style={{
            '--background': 'rgba(8, 8, 12, 1)',
          }}
        >
          <div
            style={{
              padding: 16,
              paddingTop: 20,
              background: 'rgba(8, 8, 12, 1)',
              minHeight: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#F9FAFB',
                }}
              >
                Add song
              </h2>
              <button
                type="button"
                onClick={() => setSongPickerOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'transparent',
                  color: '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>

            {/* Search bar */}
            <div
              style={{
                position: 'relative',
                marginBottom: 16,
              }}
            >
              <IonIcon
                icon={searchOutline}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: '#6b7280',
                }}
              />
              <input
                type="text"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder="Search songs…"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: 12,
                  border: '1px solid rgba(244, 114, 182, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#e5e7eb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>

            {loadingSongs ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 40,
                  gap: 10,
                }}
              >
                <IonSpinner
                  name="crescent"
                  style={{ '--color': '#f472b6', width: 24, height: 24 }}
                />
                <span style={{ fontSize: 14, color: '#9ca3af' }}>
                  Loading songs…
                </span>
              </div>
            ) : filteredSongs.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{
                    fontSize: 40,
                    color: '#4b5563',
                    marginBottom: 12,
                  }}
                />
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  {songs.length === 0
                    ? 'No songs in your library yet'
                    : 'No songs match your search'}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: '65vh',
                  overflowY: 'auto',
                  paddingBottom: 20,
                }}
              >
                {filteredSongs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => handleSelectSong(song)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1px solid rgba(244, 114, 182, 0.2)',
                      background: 'rgba(244, 114, 182, 0.05)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 100ms ease-out',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#F9FAFB',
                        marginBottom: 4,
                      }}
                    >
                      {song.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 12,
                        color: '#6b7280',
                      }}
                    >
                      <span>Key: {song.default_key?.trim() || '—'}</span>
                      <span>•</span>
                      <span>BPM: {song.default_bpm ?? '—'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </IonModal>

        {/* Edit template name modal */}
        <IonModal
          isOpen={showEditTemplate}
          onDidDismiss={() => {
            if (!savingTemplate) setShowEditTemplate(false);
          }}
        >
          <IonContent
            style={{
              '--background': 'rgba(8, 8, 12, 0.98)',
            }}
          >
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 380,
                  borderRadius: 24,
                  padding: 24,
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.3)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 20,
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#F9FAFB',
                  }}
                >
                  Rename setlist
                </h3>

                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Setlist name"
                    autoFocus
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(244, 114, 182, 0.4)',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#F9FAFB',
                      fontSize: 16,
                      outline: 'none',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    disabled={savingTemplate}
                    onClick={() => setShowEditTemplate(false)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: 'transparent',
                      color: '#9ca3af',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingTemplate}
                    onClick={saveTemplateEdits}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#f472b6',
                      color: '#000',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: savingTemplate ? 0.7 : 1,
                    }}
                  >
                    {savingTemplate ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Delete template confirm modal */}
        <IonModal
          isOpen={showDeleteTemplate}
          onDidDismiss={() => {
            if (!deletingTemplate) setShowDeleteTemplate(false);
          }}
        >
          <IonContent
            style={{
              '--background': 'rgba(8, 8, 12, 0.98)',
            }}
          >
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 380,
                  borderRadius: 24,
                  padding: 24,
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <IonIcon
                    icon={trashOutline}
                    style={{ fontSize: 28, color: '#f87171' }}
                  />
                </div>

                <h3
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#F9FAFB',
                  }}
                >
                  Delete setlist?
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 24,
                    fontSize: 15,
                    color: '#9ca3af',
                    lineHeight: 1.5,
                  }}
                >
                  This will permanently remove "{template?.name}" and all{' '}
                  {items.length} song{items.length === 1 ? '' : 's'}. This can't
                  be undone.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    disabled={deletingTemplate}
                    onClick={() => setShowDeleteTemplate(false)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: 'transparent',
                      color: '#9ca3af',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingTemplate}
                    onClick={deleteTemplate}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: deletingTemplate ? 0.7 : 1,
                    }}
                  >
                    {deletingTemplate ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 12, 0.98)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                '--padding-start': '0',
                '--padding-end': '0',
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </IonButton>

            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                startEditTemplate();
              }}
              onTouchStart={() => setPressedButton('header')}
              onTouchEnd={() => setPressedButton(null)}
              onTouchCancel={() => setPressedButton(null)}
              onMouseDown={() => setPressedButton('header')}
              onMouseUp={() => setPressedButton(null)}
              onMouseLeave={() => setPressedButton(null)}
              style={{
                flex: 1,
                minWidth: 0,
                background:
                  pressedButton === 'header'
                    ? 'rgba(244, 114, 182, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  pressedButton === 'header'
                    ? '1px solid rgba(244, 114, 182, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 100ms ease-out',
                transform:
                  pressedButton === 'header' ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {template?.name ?? (loading ? 'Loading…' : 'Setlist')}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: pressedButton === 'header' ? '#f472b6' : '#6b7280',
                    transition: 'color 100ms ease-out',
                  }}
                >
                  Tap to rename
                </span>
              </div>
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {renderBody()}
      </IonContent>
    </IonPage>
  );
}

/* ------------------ Sortable item card ------------------ */

function SortableTemplateItemCard({
  row,
  index,
  onDelete,
}: {
  row: TemplateItemRow;
  index: number;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          borderRadius: 14,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: isDragging
            ? 'rgba(244, 114, 182, 0.15)'
            : 'rgba(15, 23, 42, 0.6)',
          border: isDragging
            ? '1px solid rgba(244, 114, 182, 0.4)'
            : '1px solid rgba(71, 85, 105, 0.3)',
          boxShadow: isDragging
            ? '0 20px 40px rgba(0, 0, 0, 0.5)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'background 150ms, border 150ms, box-shadow 150ms',
        }}
      >
        {/* Drag handle + index */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            width: 28,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            aria-label="Reorder"
            {...attributes}
            {...listeners}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 4,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              touchAction: 'none',
              borderRadius: 6,
            }}
          >
            <IonIcon
              icon={reorderThreeOutline}
              style={{ fontSize: 20, color: '#6b7280' }}
            />
          </button>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#f472b6',
            }}
          >
            {index + 1}
          </span>
        </div>

        {/* Song info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#F9FAFB',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 4,
            }}
          >
            {row.title}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 13, color: '#f472b6', opacity: 0.8 }}
              />
              <span>{row.musical_key || '—'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IonIcon
                icon={speedometerOutline}
                style={{ fontSize: 13, color: '#f472b6', opacity: 0.8 }}
              />
              <span>{row.bpm ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
