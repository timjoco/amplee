/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { addOutline, chevronForward, gridOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import EventInboxListMobile from '../components/Events/EventInbox/EventsInboxListMobile';
import { getAvatarUrl } from '../lib/cache/avatarUrlCache';
import { getBandsCache, setBandsCache } from '../lib/cache/bandCache';
import { supabase } from '../lib/supabase';
import type { BandWithRole } from '../types/bands';

export default function Home() {
  const nav = useNavigate();

  const initial = getBandsCache();
  const [bands, setBands] = React.useState<BandWithRole[]>(initial.bands);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedBandId, setSelectedBandId] = React.useState<string | 'all'>(
    'all'
  );

  const isEmpty = bands.length === 0;

  // If only one band, auto-select it
  React.useEffect(() => {
    if (bands.length === 1 && selectedBandId === 'all') {
      setSelectedBandId(bands[0].id);
    }
  }, [bands, selectedBandId]);

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

  const adminBandIds = React.useMemo(
    () => bands.filter((b) => b.role === 'admin').map((b) => b.id),
    [bands]
  );

  const selectedBand = React.useMemo(
    () => bands.find((b) => b.id === selectedBandId),
    [bands, selectedBandId]
  );

  // Signed avatar URLs - using persistent cache
  const [signedAvatars, setSignedAvatars] = React.useState<
    Record<string, string>
  >({});

  // Load signed URLs for band avatars - only when bands change
  React.useEffect(() => {
    let cancelled = false;

    const loadAvatars = async () => {
      const updates: Record<string, string> = {};

      // Load all avatars in parallel
      await Promise.all(
        bands.map(async (band) => {
          if (!band.avatar_url) return;

          try {
            const url = await getAvatarUrl('band-avatars', band.avatar_url);
            if (url && !cancelled) {
              updates[band.id] = url;
            }
          } catch (e) {
            console.warn('[Home] avatar error', band.id, e);
          }
        })
      );

      if (!cancelled && Object.keys(updates).length > 0) {
        setSignedAvatars(updates);
      }
    };

    loadAvatars();

    return () => {
      cancelled = true;
    };
  }, [bands]);

  // Band colors - you can customize these or pull from band data
  const getBandColor = (bandId: string) => {
    // Generate a consistent color based on band ID
    const colors = [
      '#8B5CF6',
      '#EC4899',
      '#F59E0B',
      '#06B6D4',
      '#EF4444',
      '#84CC16',
    ];
    const index =
      bandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  // Get first letter or emoji for avatar
  const getBandAvatar = (band: BandWithRole) => {
    if (band.avatar_url) return null; // Will show image
    return band.name.charAt(0).toUpperCase();
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        scrollY={false}
        style={
          {
            '--background': '#050509',
            '--padding-top': '0px',
            '--padding-start': '0px',
            '--padding-end': '0px',
            '--padding-bottom': '0px',
          } as any
        }
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Empty State */}
        {isEmpty && !refreshing && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
              background: '#050509',
            }}
          >
            <img
              src="/assets/icon/logo-transparent.png"
              alt="Amplee"
              style={{
                width: 96,
                height: 96,
                marginBottom: 28,
                animation: 'fadeInScale 0.6s ease-out forwards',
                opacity: 0,
              }}
            />

            <h1
              style={{
                margin: '0 0 16px',
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#fff',
                animation: 'fadeInUp 0.6s ease-out 0.15s forwards',
                opacity: 0,
              }}
            >
              Welcome to <span style={{ color: '#9333ea' }}>Amplee</span>
            </h1>

            <p
              style={{
                margin: '0 0 36px',
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.6)',
                maxWidth: 320,
                lineHeight: 1.5,
                animation: 'fadeInUp 0.6s ease-out 0.25s forwards',
                opacity: 0,
              }}
            >
              Create your first band to connect, collaborate, and amplify your
              music together.
            </p>

            <button
              onClick={handleCreateFirstBand}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 28px',
                background: '#9333ea',
                borderRadius: 16,
                border: 'none',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(147, 51, 234, 0.4)',
                animation: 'fadeInUp 0.6s ease-out 0.35s forwards',
                opacity: 0,
              }}
            >
              <IonIcon icon={addOutline} style={{ fontSize: 22 }} />
              Create Your First Band
            </button>

            <style>{`
              @keyframes fadeInScale {
                from {
                  opacity: 0;
                  transform: scale(0.85);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        )}

        {/* Main Layout with Side Nav - ALWAYS RENDERED */}
        <div
          style={{
            display: 'flex',
            height: '100%',
            paddingTop: 'env(safe-area-inset-top)',
            opacity: isEmpty ? 0 : 1,
            pointerEvents: isEmpty ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
          }}
        >
          {/* LEFT SIDE NAV - Always mounted, just hidden when empty */}
          <div
            style={{
              width: 62,
              background: '#0a0a0a',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              overflowY: 'auto',
              flexShrink: 0,
              height: '100%',
            }}
          >
            {/* All Bands Button - Only show if more than 1 band */}
            {bands.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedBandId('all')}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background:
                      selectedBandId === 'all'
                        ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)'
                        : 'rgba(255,255,255,0.08)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow:
                      selectedBandId === 'all'
                        ? '0 4px 12px rgba(147,51,234,0.3)'
                        : 'none',
                  }}
                >
                  <IonIcon
                    icon={gridOutline}
                    style={{ fontSize: 20, color: '#fff' }}
                  />
                  {selectedBandId === 'all' && (
                    <div
                      style={{
                        position: 'absolute',
                        right: -1,
                        width: 3,
                        height: 24,
                        background: '#fff',
                        borderRadius: '3px 0 0 3px',
                      }}
                    />
                  )}
                </button>

                <div
                  style={{
                    width: 28,
                    height: 1,
                    background: 'rgba(255,255,255,0.1)',
                    margin: '4px 0',
                  }}
                />
              </>
            )}

            {/* Band Icons */}
            {bands.map((band) => {
              const isSelected = selectedBandId === band.id;
              const avatarUrl = signedAvatars[band.id];
              const selectedColor = '#8B5CF6';

              return (
                <button
                  key={band.id}
                  onClick={() => setSelectedBandId(band.id)}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    padding: 0,
                    background: avatarUrl
                      ? 'transparent'
                      : isSelected
                      ? `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}bb 100%)`
                      : 'rgba(255,255,255,0.08)',
                    border:
                      isSelected && avatarUrl
                        ? `2px solid ${selectedColor}`
                        : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#fff',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isSelected
                      ? `0 4px 12px ${selectedColor}40`
                      : 'none',
                    overflow: 'hidden',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={band.name}
                      loading="eager"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    band.name.charAt(0).toUpperCase()
                  )}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        right: -1,
                        width: 3,
                        height: 24,
                        background: '#fff',
                        borderRadius: '3px 0 0 3px',
                      }}
                    />
                  )}
                </button>
              );
            })}

            {/* Add Band Button */}
            <button
              onClick={handleCreateFirstBand}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'transparent',
                border: '2px dashed rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              <IonIcon
                icon={addOutline}
                style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }}
              />
            </button>
          </div>

          {/* MAIN CONTENT */}
          <IonContent
            style={{
              '--background': 'transparent',
              flex: 1,
            }}
          >
            {/* Selected Band Header - Sticky */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(5, 5, 9, 0.95)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backdropFilter: 'blur(20px)',
              }}
            >
              <div
                onClick={() => {
                  if (selectedBandId !== 'all' && selectedBand) {
                    nav(`/bands/${selectedBand.id}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: selectedBandId !== 'all' ? 'pointer' : 'default',
                }}
              >
                {/* Only show avatar if viewing "All Bands" or have multiple bands */}
                {selectedBandId !== 'all' &&
                  selectedBand &&
                  bands.length > 1 && (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${getBandColor(
                          selectedBand.id
                        )}30 0%, ${getBandColor(selectedBand.id)}15 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: signedAvatars[selectedBand.id] ? 0 : 16,
                        fontWeight: 600,
                        color: '#fff',
                        overflow: 'hidden',
                      }}
                    >
                      {signedAvatars[selectedBand.id] ? (
                        <img
                          src={signedAvatars[selectedBand.id]}
                          alt={selectedBand.name}
                          loading="eager"
                          decoding="async"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        getBandAvatar(selectedBand)
                      )}
                    </div>
                  )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 17,
                        fontWeight: 600,
                        color: '#fff',
                      }}
                    >
                      {selectedBandId === 'all'
                        ? 'All Bands'
                        : selectedBand?.name}
                    </h2>
                    {selectedBandId !== 'all' && (
                      <IonIcon
                        icon={chevronForward}
                        style={{
                          fontSize: 16,
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {selectedBandId === 'all'
                      ? `${bands.length} band${bands.length !== 1 ? 's' : ''}`
                      : 'Tap to view band'}
                  </span>
                </div>
              </div>
            </div>

            {/* Events List */}
            <div
              style={{
                padding: '0 12px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
              }}
            >
              <EventInboxListMobile
                showAvatars={selectedBandId === 'all'}
                adminBandIds={adminBandIds}
                clientFilterBandId={
                  selectedBandId !== 'all' ? selectedBandId : undefined
                }
              />
            </div>
          </IonContent>
        </div>
      </IonContent>
    </IonPage>
  );
}
