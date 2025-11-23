/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  createOutline,
  musicalNotesOutline,
  reorderThreeOutline,
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

  // song picker state
  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

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
    [saveOrder]
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
    if (!songs.length) {
      void loadSongs();
    }
  }, [songs.length, loadSongs]);

  const handleSelectSong = useCallback(
    async (song: SongOption) => {
      if (!setlistId) return;

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
    [setlistId, items.length]
  );

  // ---------- Delete item ----------
  const handleDeleteItem = useCallback(
    async (id: string) => {
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
    [saveOrder]
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

      // delete items first
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
      // route back to setlist list page
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
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IonSpinner name="dots" />
          <IonText color="medium">
            <p style={{ margin: 0 }}>Loading setlist…</p>
          </IonText>
        </div>
      );
    }

    if (!template) {
      return (
        <div style={{ padding: 16 }}>
          <IonText color="danger">
            <p style={{ margin: 0 }}>Setlist not found.</p>
          </IonText>
        </div>
      );
    }

    return (
      <div
        style={{
          padding: 16,
          paddingBottom: 80,
        }}
      >
        {/* header meta */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <IonText color="medium">
            <p
              style={{
                margin: 0,
                fontSize: 12,
                letterSpacing: 0.08,
                textTransform: 'uppercase',
                color: 'rgba(244,114,182,0.9)',
              }}
            >
              Template · {items.length} song{items.length === 1 ? '' : 's'}
              {savingReorder && ' · Saving order…'}
            </p>
          </IonText>
          <IonText color="light">
            <h2
              style={{
                margin: 0,
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: 0.02,
                color: '#F9FAFB',
              }}
            >
              {template.name || 'Untitled setlist'}
            </h2>
          </IonText>

          {/* Edit / Delete controls */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 6,
            }}
          >
            <IonButton
              size="small"
              fill="outline"
              onClick={startEditTemplate}
              style={
                {
                  '--color': 'rgba(244,114,182,0.95)',
                  '--border-color': 'rgba(244,114,182,0.95)',
                  '--background-activated': 'rgba(244,114,182,0.12)',
                  '--border-radius': '999px',
                  textTransform: 'none',
                  fontSize: 13,
                } as any
              }
            >
              <IonIcon icon={createOutline} slot="start" />
              Rename
            </IonButton>

            <IonButton
              size="small"
              fill="outline"
              onClick={() => setShowDeleteTemplate(true)}
              style={
                {
                  '--color': 'rgba(248,113,113,0.95)',
                  '--border-color': 'rgba(248,113,113,0.9)',
                  '--background-activated': 'rgba(127,29,29,0.4)',
                  '--border-radius': '999px',
                  textTransform: 'none',
                  fontSize: 13,
                } as any
              }
            >
              <IonIcon icon={trashOutline} slot="start" />
              Delete
            </IonButton>
          </div>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              paddingTop: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15,23,42,0.96)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.8)',
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 26, color: '#e5e7eb' }}
              />
            </div>
            <h3
              style={{
                margin: 0,
                marginTop: 8,
                fontSize: 18,
                fontWeight: 700,
                color: '#e5e7eb',
              }}
            >
              No songs in this setlist
            </h3>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 14,
                color: '#9ca3af',
              }}
            >
              Add songs from your band library to start building this template.
            </p>

            <IonButton
              onClick={openSongPicker}
              style={
                {
                  marginTop: 10,
                  '--background': 'rgba(244,114,182,0.95)',
                  '--background-activated': 'rgba(244,114,182,1)',
                  '--color': '#000000',
                  '--border-radius': '999px',
                  paddingInline: 20,
                } as any
              }
            >
              <IonIcon icon={addOutline} slot="start" />
              Add song from library
            </IonButton>
          </div>
        ) : (
          <>
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

            <div
              style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <IonButton
                onClick={openSongPicker}
                fill="outline"
                size="small"
                style={
                  {
                    '--color': 'rgba(244,114,182,0.95)',
                    '--border-color': 'rgba(244,114,182,0.95)',
                    '--background-activated': 'rgba(244,114,182,0.95)',
                    '--border-color-activated': 'rgba(244,114,182,0.95)',
                    '--color-activated': '#000000',
                    borderRadius: 999,
                  } as any
                }
              >
                <IonIcon icon={addOutline} slot="start" />
                Add song
              </IonButton>
            </div>
          </>
        )}

        {/* Song picker modal */}
        <IonModal
          isOpen={songPickerOpen}
          onDidDismiss={() => setSongPickerOpen(false)}
        >
          <div
            style={{
              padding: 16,
              paddingTop: 20,
              paddingBottom: 24,
              background: 'rgba(8,8,12,1)',
              minHeight: '100%',
              color: '#e5e7eb',
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 0.06,
                textTransform: 'uppercase',
              }}
            >
              Choose a song
            </h2>

            {loadingSongs ? (
              <div
                style={{
                  paddingTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <IonSpinner name="dots" />
                <IonText color="medium">
                  <p style={{ margin: 0 }}>Loading songs…</p>
                </IonText>
              </div>
            ) : songs.length === 0 ? (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: '#9ca3af',
                }}
              >
                No songs in your band library yet. Add some on the Songs tab
                first.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 8,
                  maxHeight: '70vh',
                  overflowY: 'auto',
                }}
              >
                {songs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => handleSelectSong(song)}
                    style={{
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      background: 'transparent',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 14,
                        paddingInline: 14,
                        paddingBlock: 10,
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        columnGap: 10,
                        alignItems: 'center',
                        background:
                          'linear-gradient(135deg, rgba(15,15,20,1), rgba(20,24,35,1))',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.55)',
                        border: '1px solid rgba(148,163,184,0.4)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: '#F9FAFB',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={song.title}
                        >
                          {song.title}
                        </span>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 4,
                            fontSize: 12,
                            color: '#9ca3af',
                          }}
                        >
                          <span>
                            Key:{' '}
                            {song.default_key && song.default_key.trim().length
                              ? song.default_key
                              : '—'}
                          </span>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span>
                            BPM:{' '}
                            {song.default_bpm != null ? song.default_bpm : '—'}
                          </span>
                        </div>
                      </div>

                      <IonIcon
                        icon={chevronForwardOutline}
                        style={{
                          fontSize: 18,
                          color: 'rgba(248,250,252,0.7)',
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <IonButton
                fill="outline"
                size="small"
                onClick={() => setSongPickerOpen(false)}
                style={
                  {
                    '--color': '#e5e7eb',
                    '--border-color': 'rgba(156,163,175,0.8)',
                    borderRadius: 999,
                  } as any
                }
              >
                Close
              </IonButton>
            </div>
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
              '--background':
                'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))',
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
                  borderRadius: 20,
                  padding: 24,
                  background: 'rgba(15,23,42,0.98)',
                  border: '1px solid rgba(244,114,182,0.6)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 16,
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#F9FAFB',
                  }}
                >
                  Rename setlist
                </h3>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                    }}
                  >
                    Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Setlist name"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(244,114,182,0.5)',
                      padding: 12,
                      background: 'rgba(15,23,42,0.9)',
                      color: '#e5e7eb',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 20,
                  }}
                >
                  <button
                    type="button"
                    disabled={savingTemplate}
                    onClick={saveTemplateEdits}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(244,114,182,0.7)',
                      background: 'rgba(244,114,182,0.98)',
                      color: '#000000',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {savingTemplate ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    disabled={savingTemplate}
                    onClick={() => setShowEditTemplate(false)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.3)',
                      background: 'rgba(15,23,42,0.9)',
                      color: '#9ca3af',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
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
              '--background':
                'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))',
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
                  borderRadius: 20,
                  padding: 24,
                  background: 'rgba(15,23,42,0.98)',
                  border: '1px solid rgba(248,113,113,0.6)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 12,
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'rgba(248,113,113,0.98)',
                  }}
                >
                  Delete setlist?
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 18,
                    fontSize: 15,
                    color: '#9ca3af',
                    lineHeight: 1.5,
                  }}
                >
                  This will permanently remove this setlist template and all of
                  its songs. This action cannot be undone.
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    disabled={deletingTemplate}
                    onClick={deleteTemplate}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(248,113,113,0.7)',
                      background: 'rgba(248,113,113,0.98)',
                      color: '#000000',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {deletingTemplate ? 'Deleting…' : 'Delete setlist'}
                  </button>
                  <button
                    type="button"
                    disabled={deletingTemplate}
                    onClick={() => setShowDeleteTemplate(false)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.3)',
                      background: 'rgba(15,23,42,0.9)',
                      color: '#9ca3af',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
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
      <IonHeader>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <IonButton slot="start">
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                paddingInline: 4,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ fontSize: 22, color: '#F9FAFB' }}
              />
            </IonButton>
          </IonButton>

          <IonTitle
            style={{
              color: '#F9FAFB',
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 0.25,
            }}
          >
            Edit setlist
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>{renderBody()}</IonContent>
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
    opacity: isDragging ? 0.92 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          borderRadius: 18,
          paddingInline: 14,
          paddingBlock: 10,
          minHeight: 72,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          columnGap: 10,
          alignItems: 'center',
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))',
          boxShadow: isDragging
            ? '0 18px 40px rgba(0,0,0,0.9)'
            : '0 10px 24px rgba(0,0,0,.45)',
          border: '1px solid rgba(148,163,184,0.45)',
        }}
      >
        {/* Drag + index */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            paddingRight: 6,
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
              padding: 0,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              opacity: 0.85,
              touchAction: 'none',
            }}
          >
            <IonIcon
              icon={reorderThreeOutline}
              style={{ fontSize: 18, color: '#9ca3af' }}
            />
          </button>
          <span
            style={{
              fontSize: 11,
              color: '#9ca3af',
            }}
          >
            {index + 1}
          </span>
        </div>

        {/* Text + meta */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 0.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#e5e7eb',
            }}
            title={row.title}
          >
            {row.title}
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                minWidth: 0,
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 14, opacity: 0.85 }}
              />
              <span>{row.musical_key || '—'}</span>
            </div>
            <span
              style={{
                opacity: 0.35,
              }}
            >
              ·
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                minWidth: 0,
              }}
            >
              <IonIcon
                icon={speedometerOutline}
                style={{ fontSize: 14, opacity: 0.85 }}
              />
              <span>{row.bpm != null ? `${row.bpm} bpm` : '—'}</span>
            </div>
          </div>

          {row.notes && (
            <p
              style={{
                margin: 0,
                marginTop: 6,
                fontSize: 12,
                color: '#9ca3af',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.notes}
            </p>
          )}
        </div>

        {/* Right: delete item */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            fontSize: 11,
            color: '#6b7280',
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={onDelete}
            style={{
              borderRadius: 999,
              border: '1px solid rgba(239,68,68,0.7)',
              paddingInline: 10,
              paddingBlock: 4,
              background: 'rgba(127,29,29,0.3)',
              color: '#fecaca',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Remove
          </button>
          <span>#{row.order_index + 1}</span>
        </div>
      </div>
    </div>
  );
}
