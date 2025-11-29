/* eslint-disable @typescript-eslint/no-explicit-any */
import logo from '@amplee/assets/logo.png';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonToolbar,
} from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';
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

  const isEmpty = bands.length === 0;

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
      if (!alive) return;
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

  const handleCreateFirstBand = () => {
    window.dispatchEvent(
      new CustomEvent('amplee:global-create', {
        detail: { kind: 'band' },
      })
    );
  };

  return (
    <IonPage>
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
            '--background': isEmpty
              ? 'rgba(15, 7, 32, 0.7)'
              : 'rgba(5, 5, 9, 0.7)',
            '--border-width': '0',
            paddingTop: 'env(safe-area-inset-top)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        ></IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          ['--background' as any]: isEmpty
            ? 'linear-gradient(to bottom, #0f0720, #1a0a2e, #050509)'
            : '#050509',
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

        {isEmpty && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
              }}
            ></div>
          </>
        )}

        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: isEmpty ? '40px 16px 24px' : '12px 16px 24px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {isEmpty && !refreshing && (
            <div
              style={{
                textAlign: 'center',
                paddingTop: 40,
                paddingBottom: 60,
                animation: 'ampFadeInUp 0.8s ease-out forwards',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  marginBottom: 28,
                  boxShadow: '0 12px 40px rgba(147, 51, 234, 0.4)',
                  background: 'rgba(137, 35, 232, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(147, 51, 234, 0.3)',
                  animation: 'ampScaleIn 0.6s ease-out forwards',
                  position: 'relative',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <img
                  src={logo}
                  alt="Amplee"
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(147, 51, 234, 0.5))',
                  }}
                />
              </div>

              <h1
                style={{
                  margin: '0 0 16px',
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  animation: 'ampFadeInUp 0.8s ease-out 0.1s forwards',
                  opacity: 0,
                }}
              >
                <div style={{ color: '#ffffff', marginBottom: 4 }}>
                  WELCOME TO
                </div>
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #c084fc 0%, #9333ea 50%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AMPLEE
                </div>
              </h1>

              <p
                style={{
                  margin: '0 auto 36px',
                  fontSize: 17,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                  maxWidth: 380,
                  lineHeight: 1.6,
                  animation: 'ampFadeInUp 0.8s ease-out 0.2s forwards',
                  opacity: 0,
                }}
              >
                Your journey starts here. Create your first band to connect,
                collaborate, and amplify your music together.
              </p>

              <div
                style={{
                  maxWidth: 420,
                  margin: '0 auto',
                  background: 'rgba(15, 7, 32, 0.6)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(147, 51, 234, 0.25)',
                  borderRadius: 24,
                  padding: '32px 28px',
                  boxShadow:
                    '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 80px rgba(147, 51, 234, 0.08)',
                  animation: 'ampFadeInUp 0.8s ease-out 0.3s forwards',
                  opacity: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '16px 24px',
                    background:
                      'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                    borderRadius: 16,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(147, 51, 234, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={handleCreateFirstBand}
                >
                  <IonIcon icon={addCircleOutline} style={{ fontSize: 24 }} />
                  <span>Create Your First Band</span>
                </div>

                <p
                  style={{
                    margin: '20px 0 0',
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.5)',
                    lineHeight: 1.5,
                  }}
                >
                  Or tap the{' '}
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    +
                  </span>{' '}
                  button in the bottom bar to get started.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 48,
                  animation: 'ampFadeIn 1s ease-out 0.5s forwards',
                  opacity: 0,
                }}
              >
                <div
                  style={{
                    height: 4,
                    width: 100,
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          )}

          {!isEmpty && (
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
            </div>
          )}

          {/* Event Chats Section */}
          {!isEmpty && (
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
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 20,
                    letterSpacing: -0.3,
                    color: '#E5E7EB',
                  }}
                >
                  Event
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
          )}
        </div>

        <style>{`


          @keyframes ampScaleIn {
            from {
              opacity: 0;
              transform: scale(0.85);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes ampFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes ampFadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
}
