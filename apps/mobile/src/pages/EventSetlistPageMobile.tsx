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
import { useNavigate, useParams } from 'react-router-dom';
import EventSetlistTabMobile from '../components/Events/EventSetlistTabMobile';
import { useEventShell } from '../hooks/useEventShell';

type RouteParams = {
  eventId: string;
};

export default function EventSetlistPageMobile() {
  const nav = useNavigate();
  const { eventId } = useParams<RouteParams>();
  const { event, isAdmin, loading } = useEventShell(eventId);

  const title = event?.title ?? 'Setlist';
  const bandId = event?.band_id ?? '';

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
              </IonText>
            </div>
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
          />
        )}
      </IonContent>
    </IonPage>
  );
}
