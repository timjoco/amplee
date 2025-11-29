/* eslint-disable @typescript-eslint/no-explicit-any */
import {
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
import {
  chevronBackOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventDateTimePicker from '../../components/ui/EventDateTimePicker';
import { supabase } from '../../lib/supabase';

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

  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState<EventType>('show');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [busyDanger, setBusyDanger] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
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

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
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

    const expected = (event.title ?? '').trim();
    const typed = deleteConfirmText.trim();

    if (!expected || typed !== expected) {
      setDeleteError('Event name does not match. Check the spelling.');
      return;
    }

    try {
      setBusyDanger(true);
      setDeleteError(null);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)
        .eq('band_id', event.band_id);

      if (error) {
        console.error('[event settings] delete error', error);
        setDeleteError('Failed to delete event. Please try again.');
        return;
      }

      setShowDeleteModal(false);
      setShowDeleteToast(true);
    } finally {
      setBusyDanger(false);
    }
  }, [event, isAdmin, busyDanger, deleteConfirmText]);

  const openDeleteModal = () => {
    setDeleteConfirmText('');
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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

          <div style={{ paddingInline: 12, paddingBlock: 8 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: '#F9FAFB',
                letterSpacing: '-0.5px',
              }}
            >
              Event settings
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              Update details and public listing
            </p>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading && (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonSpinner name="dots" style={{ color: '#34d399' }} />
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
            <IonText>
              <p style={{ color: '#9ca3af' }}>Event not found.</p>
            </IonText>
          </div>
        )}

        {!loading && event && (
          <div style={{ padding: 16, paddingBottom: 24 }}>
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
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(127,29,29,0.15) 0%, rgba(80,20,20,0.1) 100%)',
                  border: '1px solid rgba(248, 113, 113, 0.25)',
                  borderRadius: 20,
                  padding: 20,
                  marginTop: 16,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <IonIcon
                    icon={warningOutline}
                    style={{ fontSize: 20, color: '#fca5a5' }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: '#fca5a5',
                    }}
                  >
                    Danger Zone
                  </p>
                </div>
                <p
                  style={{
                    margin: '0 0 20px',
                    fontSize: 13,
                    color: '#9ca3af',
                    lineHeight: 1.5,
                  }}
                >
                  Delete this event for everyone. This action cannot be undone.
                </p>

                <button
                  type="button"
                  onClick={openDeleteModal}
                  disabled={busyDanger}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    background:
                      'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.15) 100%)',
                    color: '#fca5a5',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: busyDanger ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    opacity: busyDanger ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
                  Delete event
                </button>
              </div>
            )}
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            {/* Backdrop */}
            <div
              onClick={closeDeleteModal}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />

            {/* Modal */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 360,
                background:
                  'linear-gradient(145deg, rgba(20,15,25,0.98) 0%, rgba(12,8,18,0.98) 100%)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: 24,
                padding: 24,
                boxShadow:
                  '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(248,113,113,0.1)',
              }}
            >
              {/* Warning Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.1) 100%)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <IonIcon
                  icon={trashOutline}
                  style={{ fontSize: 26, color: '#f87171' }}
                />
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#f9fafb',
                  textAlign: 'center',
                  letterSpacing: '-0.3px',
                }}
              >
                Delete this event?
              </h2>

              <p
                style={{
                  margin: '12px 0 20px',
                  fontSize: 14,
                  color: '#9ca3af',
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                This will permanently delete the event for all band members.
                Type{' '}
                <span style={{ color: '#f87171', fontWeight: 600 }}>
                  {event?.title}
                </span>{' '}
                to confirm.
              </p>

              {/* Confirm Input */}
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  if (deleteError) setDeleteError(null);
                }}
                placeholder={event?.title ?? 'Event name'}
                autoFocus
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: deleteError
                    ? '1px solid rgba(248,113,113,0.6)'
                    : '1px solid rgba(148,163,184,0.25)',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: '#e5e7eb',
                  fontSize: 15,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(248,113,113,0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(248,113,113,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = deleteError
                    ? 'rgba(248,113,113,0.6)'
                    : 'rgba(148,163,184,0.25)';
                  e.target.style.boxShadow = 'none';
                }}
              />

              {/* Error Message */}
              {deleteError && (
                <p
                  style={{
                    margin: '10px 0 0',
                    fontSize: 13,
                    color: '#f87171',
                    textAlign: 'center',
                  }}
                >
                  {deleteError}
                </p>
              )}

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={busyDanger}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#9ca3af',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  disabled={busyDanger || !deleteConfirmText.trim()}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(220,38,38,0.5)',
                    background:
                      'linear-gradient(135deg, rgba(220,38,38,0.9) 0%, rgba(185,28,28,0.9) 100%)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      busyDanger || !deleteConfirmText.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    transition: 'all 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                    opacity: busyDanger || !deleteConfirmText.trim() ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {busyDanger ? (
                    <>
                      <IonSpinner
                        name="crescent"
                        style={{ width: 16, height: 16 }}
                      />
                      Deleting…
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>

      <IonToast
        isOpen={showSavedToast}
        onDidDismiss={() => setShowSavedToast(false)}
        message="Event updated successfully"
        duration={2000}
        position="bottom"
        cssClass="amplee-toast-success"
      />

      <IonToast
        isOpen={showDeleteToast}
        message="Event deleted"
        duration={1800}
        onDidDismiss={() => {
          setShowDeleteToast(false);
          nav('/home', { replace: true });
        }}
        cssClass="amplee-toast-success"
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

  const inputStyle = {
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.2)',
    padding: '12px 14px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#e5e7eb',
    fontSize: 14,
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  const labelStyle = {
    margin: 0,
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#6b7280',
    fontWeight: 600,
    marginBottom: 8,
  };

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.04) 100%)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: '#34d399',
          }}
        >
          Event details
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            color: '#9ca3af',
          }}
        >
          Edit the core info for this event
        </p>
      </div>

      {/* Body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Title */}
        <div>
          <p style={labelStyle}>Title</p>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Event title"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div>
          <p style={labelStyle}>Location</p>
          <input
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            placeholder="Venue / location"
            style={inputStyle}
          />
        </div>

        {/* Type */}
        <div>
          <p style={labelStyle}>Type</p>
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value as EventType)}
            style={{
              ...inputStyle,
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
          <p style={labelStyle}>Start</p>
          <button
            type="button"
            onClick={() => setShowStartPicker(true)}
            style={{
              ...inputStyle,
              textAlign: 'left',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {formatDateTimeLabelFromLocal(editStart)}
          </button>
        </div>

        {/* End */}
        <div>
          <p style={labelStyle}>End (optional)</p>
          <button
            type="button"
            onClick={() => setShowEndPicker(true)}
            style={{
              ...inputStyle,
              textAlign: 'left',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
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
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: '1px solid rgba(52,211,153,0.4)',
            background: savingEvent
              ? 'rgba(52,211,153,0.1)'
              : 'linear-gradient(135deg, rgba(52,211,153,0.9) 0%, rgba(16,185,129,0.9) 100%)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: savingEvent ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            opacity: savingEvent ? 0.7 : 1,
            boxShadow: savingEvent ? 'none' : '0 4px 14px rgba(52,211,153,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {savingEvent ? (
            <>
              <IonSpinner name="crescent" style={{ width: 18, height: 18 }} />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>

        {/* PUBLIC LISTING */}
        {isAdmin && (
          <div
            style={{
              marginTop: 4,
              paddingTop: 16,
              borderTop: '1px solid rgba(148,163,184,0.1)',
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
                gap: 4,
              }}
            >
              <p style={{ ...labelStyle, marginBottom: 0 }}>Public listing</p>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#9ca3af',
                }}
              >
                Show on your public band page
              </p>
            </div>

            <IonToggle
              checked={!!event?.is_public}
              color="success"
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
