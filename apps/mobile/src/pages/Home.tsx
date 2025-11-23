/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { musicalNotesOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import BandGridMobile from '../components/Bands/BandGridMobile';
import EventInboxListMobile from '../components/Events/EventsInboxListMobile';
import { getBandsCache, setBandsCache } from '../lib/cache/bandCache';
import { supabase } from '../lib/supabase';
import type { BandWithRole } from '../types/bands';

export default function Home() {
  const nav = useNavigate();

  const initial = getBandsCache();
  const [bands, setBands] = React.useState<BandWithRole[]>(initial.bands);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadBands = React.useCallback(async () => {
    setRefreshing(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) {
      setBands([]);
      setBandsCache([]);
      setRefreshing(false);
      return;
    }

    const { data, error } = await supabase
      .from('band_members')
      .select('role, bands(id, name, avatar_url, updated_at)')
      .eq('user_id', uid);

    if (error) {
      console.warn('[Home] band_members error:', error.message);
      setRefreshing(false);
      return;
    }

    const normalized: BandWithRole[] = (data ?? [])
      .map((row: any) => {
        const b = Array.isArray(row.bands) ? row.bands[0] : row.bands;
        if (!b) return null;
        return {
          id: String(b.id),
          name: String(b.name ?? ''),
          role: row.role === 'admin' ? 'admin' : 'member',
          avatar_url: b.avatar_url ?? null,
          updated_at: b.updated_at ?? null,
        } as BandWithRole;
      })
      .filter(Boolean) as BandWithRole[];

    setBandsCache(normalized);
    setBands(normalized);
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      await loadBands();
    })();

    return () => {
      alive = false;
    };
  }, [loadBands]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadBands();
    event.detail.complete();
  };

  return (
    <IonPage>
      {/* Frosted glass header with blur */}
      <IonHeader
        className="ion-no-border"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <IonToolbar
          style={{
            '--background': 'rgba(5, 5, 9, 0.7)',
            '--border-width': '0',
            paddingTop: 'env(safe-area-inset-top)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
          }}
        >
          <IonTitle
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -0.5,
              background: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            amplee
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          ['--background' as any]: '#050509',
          ['--padding-top' as any]: '0px',
          ['--padding-start' as any]: '0px',
          ['--padding-end' as any]: '0px',
          ['--padding-bottom' as any]:
            'calc(24px + 56px + env(safe-area-inset-bottom))',
        }}
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '12px 16px 24px',
          }}
        >
          {/* Bands Section */}
          <div
            style={{
              marginBottom: 36,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
                paddingLeft: 4,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background:
                    'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{
                    fontSize: 18,
                    color: '#A78BFA',
                  }}
                />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: -0.3,
                  color: '#E5E7EB',
                }}
              >
                Bands
              </h2>
            </div>

            {bands.length > 0 ? (
              <div
                style={{
                  paddingLeft: 4,
                }}
              >
                <BandGridMobile
                  bands={bands}
                  selectedId={undefined}
                  onSelect={(b) => nav(`/bands/${b.id}`)}
                  gapPx={12}
                  avatarSize={88}
                />
              </div>
            ) : (
              !refreshing && (
                <div
                  style={{
                    background: 'rgba(17, 24, 39, 0.4)',
                    borderRadius: 16,
                    padding: '32px 20px',
                    border: '1px dashed rgba(139, 92, 246, 0.3)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background:
                        'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}
                  >
                    <IonIcon
                      icon={musicalNotesOutline}
                      style={{
                        fontSize: 24,
                        color: '#A78BFA',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <IonText>
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'rgba(229, 231, 235, 0.9)',
                      }}
                    >
                      No bands yet
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: 'rgba(156, 163, 175, 0.8)',
                      }}
                    >
                      Join or create a band to get started
                    </p>
                  </IonText>
                </div>
              )
            )}
          </div>

          {/* Event Chats Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
                paddingLeft: 4,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background:
                    'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}
              >
                {/* Green Chat Icon SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z"
                    stroke="url(#chat-gradient-header)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 12H8.01M12 12H12.01M16 12H16.01"
                    stroke="url(#chat-gradient-header)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient
                      id="chat-gradient-header"
                      x1="2"
                      y1="2"
                      x2="22"
                      y2="22"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#34D399" />
                      <stop offset="1" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: -0.3,
                  color: '#E5E7EB',
                }}
              >
                Event Chats
              </h2>
            </div>

            <div
              style={{
                marginLeft: 4,
              }}
            >
              <EventInboxListMobile showAvatars onLoaded={() => {}} />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
