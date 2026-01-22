/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonContent, IonSpinner, IonText } from '@ionic/react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../../../lib/supabase';
import { exportEventToCalendar } from '../../../../utils/exportEventToCalendar';
import { useEventDashboard } from '../hooks/useEventDashboard';
import EventDetailsCard from './EventDetailsCard';
import EventQuickTiles from './EventQuickTiles';
import RosterPanelMobile from './RosterPanelMobile';

type Props = {
  eventId: string;
  bandId: string;
  isAdmin: boolean;
  showQuickTiles?: boolean;
};

export default function EventSheetContent({ eventId, bandId, isAdmin: isAdminProp, showQuickTiles = true }: Props) {
  const nav = useNavigate();

  const {
    event,
    accessStatus,
    isAdmin,
    attendanceStats,
    inviteeTotal,
    setlistCount,
    filesCount,
    hasNotes,
    setEvent,
  } = useEventDashboard(eventId, bandId);

  const effectiveIsAdmin = isAdminProp || isAdmin;

  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const hasStart = !!event?.starts_at;

  const handleButtonPress = useCallback(
    (buttonId: string, action: () => void) => {
      setPressedButton(buttonId);
      setTimeout(() => {
        setPressedButton(null);
        action();
      }, 120);
    },
    []
  );

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

  const handleStatusChange = async (isBooked: boolean, isCancelled: boolean) => {
    if (!event || !effectiveIsAdmin) return;

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

  if (accessStatus !== 'granted' || !event) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
        <div style={{ display: 'grid', placeItems: 'center', gap: 12 }}>
          <IonSpinner name="crescent" />
          <IonText color="medium">
            <p style={{ margin: 0 }}>Loading details...</p>
          </IonText>
        </div>
      </div>
    );
  }

  return (
    <IonContent
      style={{
        '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
      }}
    >
      <div
        style={{
          padding: '16px',
          maxWidth: '600px',
          margin: '0 auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Event Name - Prominently displayed */}
        <div
          style={{
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: '#F9FAFB',
              letterSpacing: '-0.5px',
            }}
          >
            {event.title || 'Event'}
          </h1>
        </div>

        {/* Event Details Card */}
        <EventDetailsCard
          event={event}
          inviteeTotal={inviteeTotal}
          acceptedCount={attendanceStats.accepted}
          isAdmin={effectiveIsAdmin}
          onStatusChange={handleStatusChange}
        />

        {/* Add to Google Calendar Button */}
        <div
          style={{
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={handleExportGoogle}
            disabled={!hasStart}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: hasStart
                ? '1px solid rgba(52,211,153,0.4)'
                : '1px solid rgba(148,163,184,0.15)',
              background: hasStart
                ? 'linear-gradient(135deg, rgba(52,211,153,0.9) 0%, rgba(16,185,129,0.9) 100%)'
                : 'rgba(255,255,255,0.02)',
              color: hasStart ? '#fff' : '#6b7280',
              fontSize: 14,
              fontWeight: 600,
              cursor: hasStart ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              boxShadow: hasStart
                ? '0 4px 14px rgba(52,211,153,0.3)'
                : 'none',
            }}
          >
            Add to Google Calendar
          </button>
        </div>

        {/* Lineup Card */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: '#e5e7eb',
              }}
            >
              Lineup
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              See who's in and who's out
            </p>
          </div>

          <RosterPanelMobile eventId={eventId} />
        </div>

        {showQuickTiles && (
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
        )}
      </div>
    </IonContent>
  );
}
