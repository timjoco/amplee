/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { supabase } from '../../../lib/supabase';
import { exportEventToCalendar } from '../../../utils/exportEventToCalendar';
import EventChatCTA from './components/EventChatCTA';
import EventDetailsCard from './components/EventDetailsCard';
import EventQuickTiles from './components/EventQuickTiles';
import EventSheetModal from './components/EventSheetModal';
import { useEventDashboard } from './hooks/useEventDashboard';

export default function EventSheetMobile() {
  const nav = useNavigate();
  const routerLocation = useLocation();
  const pageRef = useRef<HTMLElement | null>(null);

  const { bandId, eventId } = useParams<{ bandId: string; eventId: string }>();

  // Consolidated data hook with access control
  const {
    event,
    loading,
    isAdmin,
    canAccess,
    isBandMember,
    isInvited,
    attendanceStats,
    inviteeTotal,
    setlistCount,
    filesCount,
    hasNotes,
    setEvent,
  } = useEventDashboard(eventId, bandId);

  // Local UI state
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [unreadMessages] = useState(0); // TODO: wire up unread count

  const cameFromSettings = (routerLocation.state as any)?.fromSettings;
  const hasStart = !!event?.starts_at;

  // Haptic feedback
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

  // Computed values for modal
  const startsAtLabel = useMemo(() => {
    if (!event?.starts_at) return '';
    try {
      const d = new Date(event.starts_at);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Chicago',
        hour12: true,
      }).format(d);
    } catch {
      return event.starts_at;
    }
  }, [event?.starts_at]);

  // Actions
  const handleBack = () => {
    if (cameFromSettings && bandId) {
      nav(`/bands/${bandId}`);
    } else {
      nav(-1);
    }
  };

  const handleExportGoogle = useCallback(async () => {
    if (!event?.starts_at) return;
    try {
      await exportEventToCalendar(
        {
          title: event.title || 'Event',
          startsAt: event.starts_at,
          location: event.location || undefined,
          notes: undefined,
          durationMinutes: 120,
        },
        'google'
      );
    } catch (err) {
      console.error('Failed to export to Google Calendar', err);
    }
  }, [event]);

  const handleTogglePublic = async () => {
    if (!event || !isAdmin || savingPublic) return;

    const next = !event.is_public;
    setSavingPublic(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({ is_public: next })
        .eq('id', event.id);

      if (error) {
        console.error('[event public toggle] error', error.message);
        return;
      }

      setEvent((prev) => (prev ? { ...prev, is_public: next } : prev));
    } finally {
      setSavingPublic(false);
    }
  };

  const handleStatusChange = async (
    isBooked: boolean,
    isCancelled: boolean
  ) => {
    if (!event || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({
          is_booked: isBooked,
          is_cancelled: isCancelled,
        })
        .eq('id', event.id);

      if (error) {
        console.error('[event status change] error', error.message);
        throw error;
      }

      setEvent((prev) =>
        prev
          ? {
              ...prev,
              is_booked: isBooked,
              is_cancelled: isCancelled,
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to update event status', err);
      throw err;
    }
  };

  // Show loading while determining access OR while loading event data (if access granted)
  if (loading || canAccess === null || (canAccess === true && !event)) {
    return (
      <IonPage ref={pageRef as any}>
        <IonHeader translucent>
          <IonToolbar
            style={{
              '--background': 'rgba(8,8,12,0.98)',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
                onClick={handleBack}
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
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent
          fullscreen
          style={{
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          }}
        >
          <div
            style={{ display: 'grid', placeItems: 'center', height: '100%' }}
          >
            <div style={{ display: 'grid', placeItems: 'center', gap: 12 }}>
              <IonSpinner name="crescent" />
              <IonText color="medium">
                <p style={{ margin: 0 }}>Loading event…</p>
              </IonText>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Handle access denied - only show after access is confirmed false
  if (canAccess === false) {
    return (
      <IonPage ref={pageRef as any}>
        <IonHeader translucent>
          <IonToolbar
            style={{
              '--background': 'rgba(8,8,12,0.98)',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
                onClick={handleBack}
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
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent
          fullscreen
          style={{
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <div>
              <IonText color="medium">
                <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>
                  Access Denied
                </h2>
                <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                  You don't have permission to view this event. Only band
                  members and invited users can access event details.
                </p>
              </IonText>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // At this point: !loading && canAccess === true && event exists
  // (The loading check above handles the case where event is still null)

  // TypeScript safety check - this should never hit due to loading condition above
  if (!event) {
    return (
      <IonPage ref={pageRef as any}>
        <IonHeader translucent>
          <IonToolbar
            style={{
              '--background': 'rgba(8,8,12,0.98)',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
                onClick={handleBack}
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
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent
          fullscreen
          style={{
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          }}
        >
          <div
            style={{ display: 'grid', placeItems: 'center', height: '100%' }}
          >
            <IonText color="medium">
              <p>Event not found.</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Main UI - now TypeScript knows event is definitely not null
  return (
    <IonPage ref={pageRef as any}>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
              onClick={handleBack}
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
                setShowInfoSheet(true);
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
                    ? 'rgba(52, 211, 153, 0.12)'
                    : 'rgba(255,255,255,0.04)',
                border:
                  pressedButton === 'header'
                    ? '1px solid rgba(52, 211, 153, 0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
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
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {event.title ?? 'Event'}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: pressedButton === 'header' ? '#34d399' : '#6b7280',
                    transition: 'color 100ms ease-out',
                  }}
                >
                  Tap for details
                </span>
              </div>
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <EventSheetModal
        isOpen={showInfoSheet}
        onDismiss={() => setShowInfoSheet(false)}
        event={event}
        isAdmin={isAdmin}
        savingPublic={savingPublic}
        hasStart={hasStart}
        startsAtLabel={startsAtLabel}
        onExportGoogle={handleExportGoogle}
        onTogglePublic={handleTogglePublic}
        onGotoSettings={() => {
          setShowInfoSheet(false);
          if (event) {
            nav(`/bands/${event.band_id}/events/${event.id}/settings`);
          }
        }}
      />

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        <div
          style={{
            padding: '16px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <EventDetailsCard
            event={event}
            inviteeTotal={inviteeTotal}
            acceptedCount={attendanceStats.accepted}
            isAdmin={isAdmin}
            onStatusChange={handleStatusChange}
          />
          <EventChatCTA
            onPress={() =>
              handleButtonPress('chat', () =>
                nav(`/bands/${event.band_id}/events/${event.id}/chat`)
              )
            }
            isPressed={pressedButton === 'chat'}
            unreadCount={unreadMessages}
          />

          <EventQuickTiles
            attendanceStats={attendanceStats}
            inviteeTotal={inviteeTotal}
            setlistCount={setlistCount}
            filesCount={filesCount}
            hasNotes={hasNotes}
            pressedButton={pressedButton}
            onPressRollCall={() =>
              handleButtonPress('rollcall', () =>
                nav(`/bands/${event.band_id}/events/${event.id}/rollcall`)
              )
            }
            onPressSetlist={() =>
              handleButtonPress('setlist', () =>
                nav(`/bands/${event.band_id}/events/${event.id}/setlist`)
              )
            }
            onPressNotes={() =>
              handleButtonPress('notes', () =>
                nav(`/bands/${event.band_id}/events/${event.id}/notes`)
              )
            }
            onPressFiles={() =>
              handleButtonPress('files', () =>
                nav(`/bands/${event.band_id}/events/${event.id}/files`)
              )
            }
          />
        </div>
      </IonContent>
    </IonPage>
  );
}
