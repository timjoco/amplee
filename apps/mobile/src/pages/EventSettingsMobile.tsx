/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, warningOutline } from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventDateTimePicker from '../components/ui/EventDateTimePicker';
import { supabase } from '../lib/supabase';

type EventType = 'show' | 'practice';

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'show', label: 'Show' },
  { value: 'practice', label: 'Practice' },
];

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: EventType | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  is_public: boolean;
};

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalToIso(val: string | null): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function EventSettingsMobile() {
  const { bandId, eventId } = useParams<{ bandId: string; eventId: string }>();
  const nav = useNavigate();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState<EventType>('show');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [busyDanger, setBusyDanger] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!eventId) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(
          'id, band_id, title, type, starts_at, ends_at, location, is_public'
        )
        .eq('id', eventId)
        .maybeSingle();

      if (!alive) return;

      if (!error && data) {
        const e = data as any;
        const row: EventRow = {
          id: String(e.id),
          band_id: String(e.band_id),
          title: e.title ?? '',
          type: e.type === 'practice' ? 'practice' : 'show',
          starts_at: e.starts_at ?? null,
          ends_at: e.ends_at ?? null,
          location: e.location ?? null,
          is_public: !!e.is_public,
        };
        setEvent(row);

        // seed edit fields
        setEditTitle(row.title || '');
        setEditLocation(row.location || '');
        setEditType(row.type ?? 'show');
        setEditStart(toLocalInputValue(row.starts_at));
        setEditEnd(toLocalInputValue(row.ends_at));
      } else {
        setEvent(null);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  // isAdmin check
  useEffect(() => {
    let alive = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive || !user || !bandId) return;

      const { data, error } = await supabase
        .from('band_members')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!alive) return;
      setIsAdmin(!error && data?.role === 'admin');
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const handleSaveEventDetails = useCallback(async () => {
    if (!event) return;

    try {
      setSavingEvent(true);

      const updates = {
        title: editTitle.trim() || null,
        location: editLocation.trim() || null,
        type: editType,
        starts_at: fromLocalToIso(editStart),
        ends_at: fromLocalToIso(editEnd),
      };

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', event.id)
        .eq('band_id', event.band_id);

      if (error) {
        console.error('[event settings] update error', error);
        return;
      }

      setEvent((prev) =>
        prev
          ? {
              ...prev,
              title: updates.title ?? prev.title,
              location: updates.location ?? prev.location,
              type: updates.type ?? prev.type,
              starts_at: updates.starts_at ?? prev.starts_at,
              ends_at: updates.ends_at ?? prev.ends_at,
            }
          : prev
      );

      setShowSavedToast(true);
    } finally {
      setSavingEvent(false);
    }
  }, [event, editTitle, editLocation, editType, editStart, editEnd]);

  const handleTogglePublic = useCallback(async () => {
    if (!event || !isAdmin || savingPublic) return;

    const next = !event.is_public;
    setSavingPublic(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({ is_public: next })
        .eq('id', event.id)
        .eq('band_id', event.band_id);

      if (error) {
        console.error('[event settings] public toggle error', error);
        return;
      }

      setEvent((prev) => (prev ? { ...prev, is_public: next } : prev));
    } finally {
      setSavingPublic(false);
    }
  }, [event, isAdmin, savingPublic]);

  const handleDeleteEvent = useCallback(async () => {
    if (!event || !isAdmin || busyDanger) return;

    try {
      setBusyDanger(true);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)
        .eq('band_id', event.band_id);

      if (error) {
        console.error('[event settings] delete error', error);
        return;
      }

      setShowDeleteToast(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete band.');
    } finally {
      setBusyDanger(false);
    }
  }, [event, isAdmin, busyDanger, nav, bandId]);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
          }}
        >
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              onClick={() => {
                if (bandId && eventId) {
                  nav(`/bands/${bandId}/events/${eventId}`, {
                    state: { fromSettings: true },
                  });
                } else {
                  nav(-1);
                }
              }}
              style={{ minWidth: 0, paddingInline: 4 }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 22 }}
              />
            </IonButton>
          </IonButtons>

          <div
            style={{
              paddingInline: 12,
              paddingBlock: 8,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#F9FAFB',
              }}
            >
              Event settings
            </h1>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12,
                color: 'rgba(148,163,184,0.95)',
              }}
            >
              Update details and public listing.
            </p>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {loading && (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonSpinner name="dots" />
          </div>
        )}

        {!loading && !event && (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonText color="medium">
              <p>Event not found.</p>
            </IonText>
          </div>
        )}

        {!loading && event && (
          <div
            style={{
              padding: 16,
              paddingBottom: 24,
            }}
          >
            <EventDetailsCard
              event={event}
              editTitle={editTitle}
              editLocation={editLocation}
              editType={editType}
              editStart={editStart}
              editEnd={editEnd}
              setEditTitle={setEditTitle}
              setEditLocation={setEditLocation}
              setEditType={setEditType}
              setEditStart={setEditStart}
              setEditEnd={setEditEnd}
              savingEvent={savingEvent}
              onSave={handleSaveEventDetails}
              isAdmin={isAdmin}
              savingPublic={savingPublic}
              onTogglePublic={handleTogglePublic}
            />

            {isAdmin && (
              <>
                <div
                  style={{
                    borderRadius: 18,
                    background:
                      'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                    border: '1px solid rgba(220,38,38,0.55)',
                    padding: 14,
                    marginTop: 16,
                  }}
                >
                  <div
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <IonIcon
                      icon={warningOutline}
                      style={{ marginRight: 8, color: '#FCA5A5' }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 0.04,
                        textTransform: 'uppercase',
                        color: 'rgba(254,226,226,0.96)',
                      }}
                    >
                      Danger Zone
                    </p>
                  </div>
                  <p
                    style={{
                      margin: '0 0 30px',
                      fontSize: 13,
                      color: 'rgba(254,202,202,0.9)',
                    }}
                  >
                    Delete this event for everyone. This cannot be undone.
                  </p>

                  <IonButton
                    expand="block"
                    color="danger"
                    disabled={busyDanger}
                    onClick={() => setShowDeleteAlert(true)}
                    style={{ '--border-radius': '999px' } as any}
                  >
                    {busyDanger ? 'Working…' : 'Delete event'}
                  </IonButton>
                </div>

                <IonAlert
                  isOpen={showDeleteAlert}
                  onDidDismiss={() => {
                    setShowDeleteAlert(false);
                    setDeleteError(null);
                  }}
                  header="Delete event?"
                  message={
                    deleteError ??
                    `This will delete this event for all band members.\n\n` +
                      `Type the event name to confirm: "${event?.title ?? ''}"`
                  }
                  cssClass="custom-dark-alert delete-event-alert"
                  inputs={[
                    {
                      name: 'confirmText',
                      type: 'text',
                      placeholder: event?.title ?? 'Event name',
                    },
                  ]}
                  buttons={[
                    {
                      text: 'Cancel',
                      role: 'cancel',
                      handler: () => {
                        setDeleteError(null);
                      },
                    },
                    {
                      text: 'Delete',
                      role: 'destructive',
                      handler: (data) => {
                        if (!event) return false;

                        const expected = (event.title ?? '').trim();
                        const typed = (data?.confirmText ?? '').trim();

                        if (!expected || typed !== expected) {
                          setDeleteError(
                            'Event name does not match. Check the spelling.'
                          );
                          return false;
                        }

                        void handleDeleteEvent();
                        setDeleteError(null);
                        return true;
                      },
                    },
                  ]}
                />
                <IonToast
                  isOpen={showDeleteToast}
                  message="Event successfully deleted."
                  duration={1800}
                  onDidDismiss={() => {
                    setShowDeleteToast(false);
                    nav('/home', { replace: true });
                  }}
                  cssClass="amplee-toast-success"
                />
              </>
            )}
          </div>
        )}
      </IonContent>

      <IonToast
        isOpen={showSavedToast}
        onDidDismiss={() => setShowSavedToast(false)}
        message="Your event has been updated."
        duration={2000}
        position="bottom"
        style={
          {
            '--background': 'rgba(5,46,22,0.96)',
            '--color': '#BBF7D0',
          } as any
        }
      />
    </IonPage>
  );
}

type EventDetailsCardProps = {
  event: EventRow | null;
  editTitle: string;
  editLocation: string;
  editType: EventType;
  editStart: string;
  editEnd: string;
  setEditTitle: (v: string) => void;
  setEditLocation: (v: string) => void;
  setEditType: (v: EventType) => void;
  setEditStart: (v: string) => void;
  setEditEnd: (v: string) => void;
  savingEvent: boolean;
  onSave: () => void;
  isAdmin: boolean;
  savingPublic: boolean;
  onTogglePublic: () => void;
};

function EventDetailsCard({
  event,
  editTitle,
  editLocation,
  editType,
  editStart,
  editEnd,
  setEditTitle,
  setEditLocation,
  setEditType,
  setEditStart,
  setEditEnd,
  savingEvent,
  onSave,
  isAdmin,
  savingPublic,
  onTogglePublic,
}: EventDetailsCardProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  function formatDateTimeLabelFromLocal(local: string) {
    if (!local) return 'Tap to choose date & time';
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return 'Tap to choose date & time';
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  return (
    <div
      style={{
        borderRadius: 18,
        background: 'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
        border: '1px solid rgba(52, 211, 153, 0.55)',
        padding: 14,
        boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.04,
            textTransform: 'uppercase',
            color: 'rgba(237,233,254,0.96)',
          }}
        >
          Event details
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'rgba(125, 205, 166, 0.9)',
          }}
        >
          Edit the core info for this event.
        </p>
      </div>

      {/* Body */}
      <div
        style={{
          marginTop: 8,
          paddingTop: 10,
          borderTop: '1px solid rgba(148,163,184,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Title */}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.08,
              color: 'rgba(167,243,208,0.9)',
              marginBottom: 4,
            }}
          >
            Title
          </p>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Event title"
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.8)',
              padding: 8,
              backgroundColor: '#020617',
              color: '#E5E7EB',
              fontSize: 14,
            }}
          />
        </div>

        {/* Location */}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.08,
              color: 'rgba(167,243,208,0.9)',
              marginBottom: 4,
            }}
          >
            Location
          </p>
          <input
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            placeholder="Venue / location"
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.8)',
              padding: 8,
              backgroundColor: '#020617',
              color: '#E5E7EB',
              fontSize: 14,
            }}
          />
        </div>

        {/* Type */}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.08,
              color: 'rgba(167,243,208,0.9)',
              marginBottom: 4,
            }}
          >
            Type
          </p>
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value as EventType)}
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.8)',
              padding: 8,
              backgroundColor: '#020617',
              color: '#E5E7EB',
              fontSize: 14,
              appearance: 'none',
            }}
          >
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start */}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.08,
              color: 'rgba(167,243,208,0.9)',
              marginBottom: 4,
            }}
          >
            Start
          </p>
          <button
            type="button"
            onClick={() => setShowStartPicker(true)}
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.8)',
              padding: 8,
              backgroundColor: '#020617',
              color: '#E5E7EB',
              fontSize: 14,
              textAlign: 'left',
            }}
          >
            {formatDateTimeLabelFromLocal(editStart)}
          </button>
        </div>

        {/* End */}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.08,
              color: 'rgba(167,243,208,0.9)',
              marginBottom: 4,
            }}
          >
            End (optional)
          </p>
          <button
            type="button"
            onClick={() => setShowEndPicker(true)}
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.8)',
              padding: 8,
              backgroundColor: '#020617',
              color: '#E5E7EB',
              fontSize: 14,
              textAlign: 'left',
            }}
          >
            {editEnd
              ? formatDateTimeLabelFromLocal(editEnd)
              : 'Tap to set an end time (optional)'}
          </button>

          <EventDateTimePicker
            open={showStartPicker}
            label="Pick start date & time"
            value={editStart ? new Date(editStart).toISOString() : undefined}
            onChange={(iso) => {
              if (!iso) {
                setEditStart('');
                return;
              }
              setEditStart(toLocalInputValue(iso));
            }}
            onDismiss={() => setShowStartPicker(false)}
          />

          <EventDateTimePicker
            open={showEndPicker}
            label="Pick end time (optional)"
            value={editEnd ? new Date(editEnd).toISOString() : undefined}
            min={editStart ? new Date(editStart).toISOString() : undefined}
            onChange={(iso) => {
              if (!iso) {
                setEditEnd('');
                return;
              }
              setEditEnd(toLocalInputValue(iso));
            }}
            onDismiss={() => setShowEndPicker(false)}
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          type="button"
          onClick={onSave}
          disabled={savingEvent}
          style={{
            marginTop: 4,
            borderRadius: 999,
            paddingBlock: 8,
            paddingInline: 12,
            border: '1px solid rgba(52,211,153,0.95)',
            background: 'transparent',
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(209,250,229,0.96)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
            opacity: savingEvent ? 0.7 : 1,
          }}
        >
          {savingEvent ? 'Saving…' : 'Save changes'}
        </button>

        {/* PUBLIC LISTING */}
        {isAdmin && (
          <div
            style={{
              marginTop: 6,
              paddingTop: 10,
              borderTop: '1px solid rgba(148,163,184,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.08,
                  color: 'rgba(167,243,208,0.9)',
                }}
              >
                Public listing
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'rgba(148,163,184,0.9)',
                }}
              >
                Show this event on your public Amplee band page.
              </p>
            </div>

            <IonToggle
              checked={!!event?.is_public}
              color="warning"
              disabled={savingPublic}
              onIonChange={onTogglePublic}
              style={{ transform: 'scale(0.9)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
