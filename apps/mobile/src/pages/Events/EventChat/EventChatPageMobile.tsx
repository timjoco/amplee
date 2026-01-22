/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chatbubblesOutline, chevronBackOutline } from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventShell } from '../../../hooks/useEventShell';
import ChatTabMobile from './ChatTabMobile';

type RouteParams = {
  eventId: string;
};

type Props = {
  embedded?: boolean;
};

export default function EventChatPageMobile({ embedded = false }: Props) {
  const nav = useNavigate();
  const { eventId } = useParams<RouteParams>();
  const { event, isAdmin, loading } = useEventShell(eventId);

  const title = event?.title ?? 'Event Chat';

  // Embedded mode - just render the chat content without page wrapper
  if (embedded) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            Loading chat...
          </div>
        ) : (
          <ChatTabMobile
            eventId={eventId}
            isAdmin={isAdmin}
            bandId={event?.band_id}
          />
        )}
      </div>
    );
  }

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
                    'linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(16, 185, 129, 0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IonIcon
                  icon={chatbubblesOutline}
                  style={{ fontSize: 16, color: '#34D399' }}
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
                  {title}
                </h2>
              </IonText>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={false}
        style={{
          ['--background' as any]: '#050509',
          ['--padding-top' as any]: '0px',
          ['--padding-bottom' as any]: '0px',
          ['--keyboard-offset' as any]: '0px',
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
            Loading chat…
          </div>
        ) : (
          <ChatTabMobile
            eventId={eventId}
            isAdmin={isAdmin}
            bandId={event?.band_id}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
