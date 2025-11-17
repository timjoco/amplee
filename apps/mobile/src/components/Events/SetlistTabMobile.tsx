import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type SetlistRow = {
  id: string;
  event_id: string;
  title: string;
  musical_key: string | null;
  bpm: number | null;
  notes: string | null;
  order_index: number;
};

export default function SetlistTabMobile({
  eventId,
  bandId, // not used yet, but handy for future templates
  isAdmin = false,
}: {
  eventId: string;
  bandId: string;
  isAdmin?: boolean;
}) {
  const [rows, setRows] = useState<SetlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SetlistRow>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_setlist_items')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (!alive) return;
      if (error) {
        console.error('Load setlist error:', error);
        setRows([]);
      } else {
        setRows((data || []) as SetlistRow[]);
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  const startEdit = (row: SetlistRow) => {
    if (!isAdmin) return;
    setEditingId(row.id);
    setDraft({
      title: row.title,
      musical_key: row.musical_key ?? '',
      bpm: row.bpm ?? undefined,
      notes: row.notes ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = async (row: SetlistRow) => {
    if (!isAdmin) return;
    const patch: SetlistRow = {
      ...row,
      title: (draft.title ?? row.title) || 'Untitled',
      musical_key:
        draft.musical_key === '' ? null : (draft.musical_key as string | null),
      bpm:
        draft.bpm === undefined || draft.bpm === null
          ? null
          : Number(draft.bpm),
      notes: draft.notes === '' ? null : (draft.notes as string | null),
    };

    const { error } = await supabase
      .from('event_setlist_items')
      .update({
        title: patch.title,
        musical_key: patch.musical_key,
        bpm: patch.bpm,
        notes: patch.notes,
      })
      .eq('id', row.id);

    if (error) {
      console.error('Save setlist row error:', error);
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === row.id ? patch : r)));
    cancelEdit();
  };

  const addSong = async () => {
    if (!isAdmin) return;
    const order_index = rows.length;
    const insert = {
      event_id: eventId,
      title: 'New Song',
      musical_key: null as string | null,
      bpm: null as number | null,
      notes: null as string | null,
      order_index,
    };

    const { data, error } = await supabase
      .from('event_setlist_items')
      .insert(insert)
      .select('*')
      .single();

    if (error) {
      console.error('Add song error:', error);
      return;
    }

    setRows((prev) => [...prev, data as SetlistRow]);
  };

  const deleteSong = async (row: SetlistRow) => {
    if (!isAdmin) return;
    const { error } = await supabase
      .from('event_setlist_items')
      .delete()
      .eq('id', row.id);

    if (error) {
      console.error('Delete song error:', error);
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 12px 12px',
        }}
      >
        {loading && rows.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 8,
            }}
          >
            <IonSpinner name="dots" />
            <IonText color="medium">Loading setlist…</IonText>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 12, opacity: 0.85 }}>
            <strong>No songs yet.</strong>
            <br />
            {isAdmin
              ? 'Tap “Add song” below to start building this set.'
              : 'Your band leader can add songs to this setlist.'}
          </div>
        ) : (
          <IonList lines="none">
            {rows.map((row, idx) => {
              const isEditing = editingId === row.id;
              return (
                <IonItem
                  key={row.id}
                  lines="none"
                  style={{
                    '--background': 'transparent',
                    paddingInline: 0,
                    paddingBlock: 6,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 16,
                      padding: 10,
                      width: '100%',
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 18,
                        textAlign: 'center',
                        paddingTop: 2,
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title */}
                      {isEditing ? (
                        <IonInput
                          value={draft.title ?? ''}
                          onIonChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              title: e.detail.value ?? '',
                            }))
                          }
                          placeholder="Song title"
                          style={{ fontSize: 15, fontWeight: 600 }}
                        />
                      ) : (
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {row.title}
                        </div>
                      )}

                      {/* Meta row: key • BPM */}
                      <div
                        style={{
                          marginTop: 4,
                          display: 'flex',
                          gap: 8,
                          fontSize: 12,
                          opacity: 0.8,
                        }}
                      >
                        {isEditing ? (
                          <>
                            <IonInput
                              value={draft.musical_key ?? ''}
                              onIonChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  musical_key: e.detail.value ?? '',
                                }))
                              }
                              placeholder="Key"
                              style={{ maxWidth: 80 }}
                            />
                            <IonInput
                              value={
                                draft.bpm === undefined || draft.bpm === null
                                  ? ''
                                  : String(draft.bpm)
                              }
                              type="number"
                              onIonChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  bpm:
                                    e.detail.value === ''
                                      ? null
                                      : Number(e.detail.value),
                                }))
                              }
                              placeholder="BPM"
                              style={{ maxWidth: 80 }}
                            />
                          </>
                        ) : (
                          <>
                            <span>{row.musical_key || '—'}</span>
                            <span>•</span>
                            <span>{row.bpm ?? '—'}</span>
                          </>
                        )}
                      </div>

                      {/* Notes */}
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          opacity: 0.8,
                        }}
                      >
                        {isEditing ? (
                          <IonInput
                            value={draft.notes ?? ''}
                            onIonChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                notes: e.detail.value ?? '',
                              }))
                            }
                            placeholder="Notes"
                          />
                        ) : (
                          row.notes || ''
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isAdmin && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          gap: 4,
                        }}
                      >
                        {isEditing ? (
                          <>
                            <IonButton
                              size="small"
                              onClick={() => saveEdit(row)}
                            >
                              Save
                            </IonButton>
                            <IonButton
                              size="small"
                              fill="clear"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </IonButton>
                          </>
                        ) : (
                          <IonButton
                            size="small"
                            fill="clear"
                            onClick={() => startEdit(row)}
                          >
                            <IonIcon icon={createOutline} />
                          </IonButton>
                        )}

                        <IonButton
                          size="small"
                          fill="clear"
                          color="danger"
                          onClick={() => deleteSong(row)}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </div>
                    )}
                  </div>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </div>

      {/* bottom bar for admins */}
      {isAdmin && (
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <IonButton size="small" onClick={addSong}>
            <IonIcon slot="start" icon={addOutline} />
            Add song
          </IonButton>
        </div>
      )}
    </div>
  );
}
