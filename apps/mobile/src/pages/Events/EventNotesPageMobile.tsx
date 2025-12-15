/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkOutline,
  chevronBackOutline,
  closeOutline,
  createOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventShell } from '../../hooks/useEventShell';
import { supabase } from '../../lib/supabase';

type RouteParams = {
  eventId: string;
};

export default function EventNotesPageMobile() {
  const nav = useNavigate();
  const { eventId } = useParams<RouteParams>();
  const { event, isAdmin, loading } = useEventShell(eventId);

  const [notes, setNotes] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const title = event?.title ?? 'Event';

  // Load notes from event data
  useEffect(() => {
    if (event?.notes) {
      setNotes(event.notes);
      setEditedNotes(event.notes);
    }
  }, [event?.notes]);

  const handleStartEdit = () => {
    setEditedNotes(notes);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedNotes(notes);
    setIsEditing(false);
  };

  const handleSaveNotes = async () => {
    if (!eventId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ notes: editedNotes })
        .eq('id', eventId);

      if (error) throw error;

      setNotes(editedNotes);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
      // TODO: Show toast error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader
        className="ion-no-border"
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      >
        <IonToolbar
          style={{
            '--background': 'rgba(5, 5, 9, 0.95)',
            '--border-width': '0',
            borderBottom: '1px solid rgba(31, 41, 55, 0.9)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => nav(-1)}
              style={{
                flex: '0 0 auto',
                background: 'transparent',
                border: 'none',
                padding: 6,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </button>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background:
                  'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IonIcon
                icon={documentTextOutline}
                style={{ fontSize: 16, color: '#34D399' }}
              />
            </div>

            <IonText style={{ flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#F9FAFB',
                  letterSpacing: -0.2,
                }}
              >
                Notes
              </h2>
              <p
                style={{
                  margin: 0,
                  marginTop: 2,
                  fontSize: 12,
                  color: '#9ca3af',
                }}
              >
                {title}
              </p>
            </IonText>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          ['--background' as any]: '#050509',
        }}
      >
        {loading || !eventId ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            <IonSpinner name="crescent" style={{ marginRight: 8 }} />
            Loading notes…
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {isEditing ? (
              /* ─────────────────────────────────────────────────
                 EDIT MODE
                 ───────────────────────────────────────────────── */
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div
                  style={{
                    background: 'rgba(17, 24, 39, 0.6)',
                    border: '1px solid rgba(55, 65, 81, 0.6)',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add event notes, instructions, or important details..."
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: 320,
                      background: 'transparent',
                      border: 'none',
                      padding: 16,
                      color: '#F9FAFB',
                      fontSize: 15,
                      lineHeight: 1.6,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '14px 16px',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSaving ? (
                      <IonSpinner
                        name="crescent"
                        style={{ width: 18, height: 18 }}
                      />
                    ) : (
                      <IonIcon
                        icon={checkmarkOutline}
                        style={{ fontSize: 18 }}
                      />
                    )}
                    {isSaving ? 'Saving…' : 'Save Notes'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: 'rgba(31, 41, 55, 0.8)',
                      color: '#d1d5db',
                      border: '1px solid rgba(55, 65, 81, 0.6)',
                      borderRadius: 10,
                      padding: '14px 20px',
                      fontSize: 15,
                      fontWeight: 500,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : notes ? (
              /* ─────────────────────────────────────────────────
                 VIEW MODE (with notes)
                 ───────────────────────────────────────────────── */
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div
                  style={{
                    background: 'rgba(17, 24, 39, 0.6)',
                    border: '1px solid rgba(55, 65, 81, 0.6)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#e5e7eb',
                      fontSize: 15,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {notes}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'rgba(17, 24, 39, 0.6)',
                      color: '#d1d5db',
                      border: '1px solid rgba(55, 65, 81, 0.6)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      fontSize: 15,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
                    Edit Notes
                  </button>
                )}

                {/* Admin hint */}
                {isAdmin && (
                  <div
                    style={{
                      background: 'rgba(17, 24, 39, 0.4)',
                      border: '1px solid rgba(55, 65, 81, 0.4)',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                      💡 Only band admins can edit event notes
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ─────────────────────────────────────────────────
                 EMPTY STATE
                 ───────────────────────────────────────────────── */
              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.6)',
                  border: '1px solid rgba(55, 65, 81, 0.6)',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: '0 auto 16px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon
                    icon={documentTextOutline}
                    style={{ fontSize: 28, color: '#4b5563' }}
                  />
                </div>

                <h3
                  style={{
                    margin: '0 0 8px',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#9ca3af',
                  }}
                >
                  No notes yet
                </h3>
                <p
                  style={{
                    margin: '0 0 20px',
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.5,
                  }}
                >
                  {isAdmin
                    ? 'Add important details like load-in times, parking info, or special instructions'
                    : 'No notes have been added for this event yet'}
                </p>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 20px',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
                    Add Notes
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
