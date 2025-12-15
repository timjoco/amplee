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
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ManageAttendeesCard } from './components/ManageAttendeesCard';
import { SettingsEventDetailsCard } from './components/SettingsEventDetailsCard';
import './styles/EventSettings.css';
import { EventRow, EventType } from './types';

type EventDetailsUpdates = {
  title: string | null;
  location: string | null;
  type: EventType;
  starts_at: string | null;
  ends_at: string | null;
};

export default function EventSettingsMobile() {
  const { bandId, eventId } = useParams<{ bandId: string; eventId: string }>();
  const nav = useNavigate();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [savingEvent, setSavingEvent] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [busyDanger, setBusyDanger] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  const contentRef = useRef<HTMLIonContentElement | null>(null);

  // Load event
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
          is_cancelled: !!e.is_cancelled,
          is_booked: !!e.is_booked,
        };
        setEvent(row);
      } else {
        setEvent(null);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  // Load admin status
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

  const handleSaveEventDetails = useCallback(
    async (updates: EventDetailsUpdates) => {
      if (!event) return;
      try {
        setSavingEvent(true);
        const { error } = await supabase
          .from('events')
          .update(updates)
          .eq('id', event.id)
          .eq('band_id', event.band_id);
        if (error) return;

        setEvent((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            title: updates.title ?? '',
            location: updates.location ?? null,
            type: updates.type ?? prev.type,
            starts_at: updates.starts_at ?? null,
            ends_at: updates.ends_at ?? null,
          };
        });
        setShowSavedToast(true);
      } finally {
        setSavingEvent(false);
      }
    },
    [event]
  );

  const handleTogglePublic = useCallback(
    async (next: boolean) => {
      if (!event || !isAdmin || savingPublic) return;
      setSavingPublic(true);
      try {
        const { error } = await supabase
          .from('events')
          .update({ is_public: next })
          .eq('id', event.id)
          .eq('band_id', event.band_id);
        if (error) return;

        setEvent((prev) => (prev ? { ...prev, is_public: next } : prev));
      } finally {
        setSavingPublic(false);
      }
    },
    [event, isAdmin, savingPublic]
  );

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

  // prevents page from scrolling when delete is open
  useEffect(() => {
    if (!showDeleteModal) return;

    let prevOverflow = '';
    let prevTouchAction = '';

    (async () => {
      const el = await contentRef.current?.getScrollElement();
      if (!el) return;

      prevOverflow = el.style.overflow;
      prevTouchAction = el.style.touchAction;

      // hard lock the actual scroll element
      el.style.overflow = 'hidden';
      el.style.touchAction = 'none';
    })();

    return () => {
      (async () => {
        const el = await contentRef.current?.getScrollElement();
        if (!el) return;
        el.style.overflow = prevOverflow;
        el.style.touchAction = prevTouchAction;
      })();
    };
  }, [showDeleteModal]);

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
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
              Update details and manage attendees
            </p>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        ref={contentRef}
        scrollY={!showDeleteModal}
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading && (
          <div
            style={{ height: '100%', display: 'grid', placeItems: 'center' }}
          >
            <IonSpinner name="dots" style={{ color: '#34d399' }} />
          </div>
        )}

        {!loading && !event && (
          <div
            style={{ height: '100%', display: 'grid', placeItems: 'center' }}
          >
            <IonText>
              <p style={{ color: '#9ca3af' }}>Event not found.</p>
            </IonText>
          </div>
        )}

        {!loading && event && (
          <div style={{ padding: 16, paddingBottom: 24 }}>
            <SettingsEventDetailsCard
              event={event}
              isAdmin={isAdmin}
              savingEvent={savingEvent}
              savingPublic={savingPublic}
              onSave={handleSaveEventDetails}
              onTogglePublic={handleTogglePublic}
            />

            {isAdmin && eventId && bandId && (
              <ManageAttendeesCard eventId={eventId} bandId={bandId} />
            )}

            {isAdmin && (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(127,29,29,0.15) 0%, rgba(80,20,20,0.1) 100%)',
                  border: '1px solid rgba(248, 113, 113, 0.25)',
                  borderRadius: 20,
                  padding: 20,
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
                    opacity: busyDanger ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />{' '}
                  Delete event
                </button>
              </div>
            )}
          </div>
        )}

        {showDeleteModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              onClick={closeDeleteModal}
              onWheel={(e) => e.preventDefault()}
              onTouchMove={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                touchAction: 'none',
              }}
            />

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
                  outline: 'none',
                }}
              />

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

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
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
                      />{' '}
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
