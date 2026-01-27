/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  chevronBackOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventsInboxListMobile from '../../components/Events/EventInbox/EventsInboxListMobile';
import { supabase } from '../../lib/supabase';

type EventTab = 'active' | 'declined' | 'archived';

export default function BandEventsPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bandName, setBandName] = useState('');
  const [activeTab, setActiveTab] = useState<EventTab>('active');

  useEffect(() => {
    let alive = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive || !user || !bandId) return;

      // Get band info
      const { data: band } = await supabase
        .from('bands')
        .select('name')
        .eq('id', bandId)
        .maybeSingle();

      if (band) {
        setBandName(band.name);
      }

      // Check admin status
      const { data, error } = await supabase
        .from('band_members')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!alive) return;
      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
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
            {/* Back Button */}
            <button
              onClick={() => navigate(`/bands/${bandId}`)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title Section */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={calendarOutline}
                  style={{ color: '#34d399', fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Events
                </h1>
              </div>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    marginTop: 2,
                    marginLeft: 28,
                  }}
                >
                  {bandName}
                </div>
              )}
            </div>

            {/* Role Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 10,
                background: isAdmin
                  ? 'rgba(52, 211, 153, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  isAdmin ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                }`,
              }}
            >
              <IonIcon
                icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                style={{
                  fontSize: 14,
                  color: isAdmin ? '#34d399' : '#6b7280',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isAdmin ? '#34d399' : '#6b7280',
                }}
              >
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonSpinner />
          </div>
        ) : (
          <div style={{ padding: '8px 16px 0' }}>
            <div style={{ display: 'flex', gap: 10, padding: '8px 0 12px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background:
                    activeTab === 'active'
                      ? 'rgba(52,211,153,0.16)'
                      : 'transparent',
                  color:
                    activeTab === 'active'
                      ? '#34d399'
                      : 'rgba(148,163,184,0.9)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('declined')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background:
                    activeTab === 'declined'
                      ? 'rgba(239,68,68,0.16)'
                      : 'transparent',
                  color:
                    activeTab === 'declined'
                      ? '#ef4444'
                      : 'rgba(148,163,184,0.9)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Declined
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('archived')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background:
                    activeTab === 'archived'
                      ? 'rgba(148,163,184,0.16)'
                      : 'transparent',
                  color:
                    activeTab === 'archived'
                      ? '#94a3b8'
                      : 'rgba(148,163,184,0.9)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Archived
              </button>
            </div>

            <EventsInboxListMobile
              bandId={bandId!}
              showAvatars
              enableCreateForBand
              isAdmin={isAdmin}
              showArchived={activeTab === 'archived'}
              showDeclined={activeTab === 'declined'}
              showActive={activeTab === 'active'}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
