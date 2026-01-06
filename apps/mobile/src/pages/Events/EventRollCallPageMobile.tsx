/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, peopleOutline } from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import RSVPTabMobile from '../../components/Events/RSVPTabMobile';
import { useEventShell } from '../../hooks/useEventShell';

type RouteParams = {
  eventId: string;
};

export default function EventRollCallPageMobile() {
  const nav = useNavigate();
  const { eventId } = useParams<RouteParams>();
  const { event, loading } = useEventShell(eventId);

  const title = event?.title ?? 'Roll Call';

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
                    'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IonIcon
                  icon={peopleOutline}
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
                  Roll Call
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
          '--background': '#050509',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {loading || !eventId ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              padding: 16,
            }}
          >
            Loading roll call…
          </div>
        ) : (
          <>
            {/* RSVP UI - where user sets their own status */}
            <RSVPTabMobile eventId={eventId} />
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
