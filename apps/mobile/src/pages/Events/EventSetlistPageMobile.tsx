/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, musicalNotesOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventSetlistTabMobile from '../../components/Events/EventSetlistTabMobile';
import { useEventShell } from '../../hooks/useEventShell';

type RouteParams = {
  eventId: string;
};

type SetlistSummary = {
  songCount: number;
};

type Props = {
  embedded?: boolean;
};

export default function EventSetlistPageMobile({ embedded = false }: Props) {
  const nav = useNavigate();
  const { eventId } = useParams<RouteParams>();
  const { event, isAdmin, loading } = useEventShell(eventId);

  const [summary, setSummary] = useState<SetlistSummary | null>(null);

  const title = event?.title ?? 'Setlist';
  const bandId = event?.band_id ?? '';

  const songCountLabel =
    summary && summary.songCount > 0
      ? `${summary.songCount} ${summary.songCount === 1 ? 'song' : 'songs'}`
      : 'No songs yet';

  // Embedded mode - just render the content without page wrapper
  if (embedded) {
    return (
      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': '#050509',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {loading || !eventId || !bandId ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            Loading setlist...
          </div>
        ) : (
          <EventSetlistTabMobile
            eventId={eventId}
            bandId={bandId}
            isAdmin={isAdmin}
            onSummaryChange={(next) => setSummary(next)}
          />
        )}
      </IonContent>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
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
                padding: '8px',
                margin: '-4px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                minWidth: '44px',
                minHeight: '44px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{
                  color: '#F9FAFB',
                  fontSize: 24,
                  pointerEvents: 'none',
                }}
              />
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  background:
                    'linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(244, 114, 182, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{ fontSize: 16, color: '#f472b6' }}
                />
              </div>
              <IonText>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    letterSpacing: -0.2,
                  }}
                >
                  Setlist
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
                <p
                  style={{
                    margin: 0,
                    marginTop: 2,
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  {songCountLabel}
                </p>
              </IonText>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': '#050509',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {loading || !eventId || !bandId ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            Loading setlist…
          </div>
        ) : (
          <EventSetlistTabMobile
            eventId={eventId}
            bandId={bandId}
            isAdmin={isAdmin}
            onSummaryChange={(next) => setSummary(next)}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
