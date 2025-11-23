/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventShell } from '../hooks/useEventShell';

type RouteParams = {
  eventId: string;
};

export default function EventFilesPageMobile() {
  const nav = useNavigate();
  const { eventId } = useParams<RouteParams>();
  const { event, loading } = useEventShell(eventId);

  const title = event?.title ?? 'Event Files';

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
                Files
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
            Loading files…
          </div>
        ) : (
          <div style={{ padding: 16, color: '#e5e7eb' }}>
            {/* TODO: plug in your real files UI here */}
            Files UI goes here.
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
