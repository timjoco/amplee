/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  airplaneOutline,
  chevronBackOutline,
  chevronForwardOutline,
  mapOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { glassCard, TEAL } from './lib/styles';
import { CreateTourModal } from './modals/CreateTourModal';
import type { TourRow, TourStatus, TourWithStats } from './types/tourTypes';
import { TOUR_STATUS_COLORS, TOUR_STATUS_LABELS } from './types/tourTypes';

type RouteParams = {
  bandId: string;
};

export default function BandToursListPage() {
  const nav = useNavigate();
  const { bandId } = useParams<RouteParams>();

  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<TourWithStats[]>([]);
  const [bandName, setBandName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // User permissions
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  // Long-press haptic state
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

  const isAdmin = useMemo(() => myRole === 'admin', [myRole]);

  // ─────────────────────────────────────────────────────────────
  // Haptic Handlers
  // ─────────────────────────────────────────────────────────────

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[tours page haptic error]', e);
    }
  }, []);

  const handlePressStart = useCallback(
    (
      id: string,
      e:
        | React.TouchEvent<HTMLButtonElement>
        | React.MouseEvent<HTMLButtonElement>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0,
        clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };
      longPressTimeoutRef.current = window.setTimeout(() => {
        setPressedId(id);
        void triggerHaptic();
      }, 350);
    },
    [triggerHaptic]
  );

  const handlePressMove = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
      if (e.touches.length !== 1) return;

      const { x, y } = pressStartRef.current;
      const t = e.touches[0];
      if (
        Math.abs(t.clientX - x) > MOVE_THRESHOLD ||
        Math.abs(t.clientY - y) > MOVE_THRESHOLD
      ) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    },
    []
  );

  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;
    if (pressedId != null) {
      setTimeout(() => setPressedId(null), 130);
    }
  }, [pressedId]);

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  // Get current user
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMyUserId(data.user?.id ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Get band info, user role, and tours
  useEffect(() => {
    let alive = true;
    if (!bandId) return;

    (async () => {
      setLoading(true);
      try {
        // Get band name
        const { data: band } = await supabase
          .from('bands')
          .select('name')
          .eq('id', bandId)
          .maybeSingle();

        if (!alive) return;
        if (band) setBandName(band.name ?? '');

        // Get user's role in this band
        if (myUserId) {
          const { data: membership } = await supabase
            .from('band_members')
            .select('role')
            .eq('band_id', bandId)
            .eq('user_id', myUserId)
            .maybeSingle();

          if (!alive) return;
          setMyRole(membership?.role ?? null);
        }

        // Get tours with stop counts
        const { data: toursData, error } = await supabase
          .from('tours')
          .select(`
            id,
            band_id,
            name,
            description,
            start_date,
            end_date,
            status,
            currency,
            notes,
            created_by,
            created_at,
            updated_at
          `)
          .eq('band_id', bandId)
          .order('start_date', { ascending: false, nullsFirst: false });

        if (!alive) return;

        if (error) {
          console.error('[BandToursListPage] load error', error);
          setTours([]);
          return;
        }

        // Get stop counts for each tour
        const tourIds = (toursData || []).map((t: any) => t.id);
        let stopCounts: Record<string, { total: number; confirmed: number }> = {};

        if (tourIds.length > 0) {
          const { data: stops } = await supabase
            .from('tour_stops')
            .select('tour_id, status')
            .in('tour_id', tourIds);

          if (stops) {
            for (const stop of stops) {
              if (!stopCounts[stop.tour_id]) {
                stopCounts[stop.tour_id] = { total: 0, confirmed: 0 };
              }
              stopCounts[stop.tour_id].total++;
              if (stop.status === 'confirmed') {
                stopCounts[stop.tour_id].confirmed++;
              }
            }
          }
        }

        const toursWithStats: TourWithStats[] = (toursData || []).map(
          (t: any) => ({
            ...t,
            stop_count: stopCounts[t.id]?.total ?? 0,
            confirmed_count: stopCounts[t.id]?.confirmed ?? 0,
          })
        );

        setTours(toursWithStats);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId, myUserId]);

  // ─────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────

  const handleTourCreated = (newTour: TourRow) => {
    setShowCreateModal(false);
    // Navigate to the new tour
    nav(`/bands/${bandId}/tours/${newTour.id}`);
  };

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return null;

    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString(undefined, opts) : null;
    const end = endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString(undefined, opts) : null;

    if (start && end) {
      return `${start} - ${end}`;
    }
    return start || end;
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

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
              onClick={() => nav(-1)}
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
                  icon={mapOutline}
                  style={{ color: TEAL.light, fontSize: 20 }}
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
                  Tours
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
            {myUserId && myRole && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: isAdmin
                    ? TEAL.subtle
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isAdmin ? TEAL.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                }}
              >
                <IonIcon
                  icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                  style={{
                    fontSize: 14,
                    color: isAdmin ? TEAL.light : '#6b7280',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isAdmin ? TEAL.light : '#6b7280',
                  }}
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <IonSpinner
                style={{
                  '--color': TEAL.primary,
                  width: 32,
                  height: 32,
                }}
              />
              <div
                style={{
                  color: '#6b7280',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Loading tours...
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              maxWidth: 600,
              margin: '0 auto',
              paddingBottom: 40,
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: TEAL.primary,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Your Tours
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {tours.length}
                </span>
              </div>
            </div>

            {/* Non-admin notice */}
            {!isAdmin && myRole && (
              <div
                style={{
                  ...glassCard,
                  padding: 12,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <IonIcon
                  icon={shieldCheckmarkOutline}
                  style={{ color: '#6b7280', fontSize: 16 }}
                />
                <span style={{ color: '#6b7280', fontSize: 13 }}>
                  Only band admins can create or edit tours
                </span>
              </div>
            )}

            {/* Empty State */}
            {tours.length === 0 ? (
              <div
                style={{
                  ...glassCard,
                  border: `1px solid ${TEAL.border}`,
                  padding: 32,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: TEAL.subtle,
                    border: `1px solid ${TEAL.border}`,
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <IonIcon
                    icon={airplaneOutline}
                    style={{ fontSize: 28, color: TEAL.light }}
                  />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#e5e7eb',
                    marginBottom: 8,
                  }}
                >
                  No Tours Yet
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.5,
                    marginBottom: isAdmin ? 20 : 0,
                  }}
                >
                  {isAdmin
                    ? 'Plan your next tour with venues, lodging, and day sheets all in one place.'
                    : 'No tours have been created yet. Ask a band admin to create one.'}
                </p>

                {isAdmin && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 20px',
                      borderRadius: 12,
                      background: TEAL.primary,
                      border: 'none',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      boxShadow: `0 4px 14px ${TEAL.glow}`,
                    }}
                  >
                    <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                    Create your first tour
                  </button>
                )}
              </div>
            ) : (
              /* Tour List */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {tours.map((tour) => {
                  const dateRange = formatDateRange(tour.start_date, tour.end_date);
                  const isPressed = pressedId === tour.id;
                  const statusColor = TOUR_STATUS_COLORS[tour.status as TourStatus];

                  return (
                    <button
                      key={tour.id}
                      onClick={() => nav(`/bands/${bandId}/tours/${tour.id}`)}
                      onTouchStart={(ev) => handlePressStart(tour.id, ev)}
                      onTouchMove={handlePressMove}
                      onTouchEnd={handlePressEnd}
                      onTouchCancel={handlePressEnd}
                      onMouseDown={(ev) => handlePressStart(tour.id, ev)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      style={{
                        ...glassCard,
                        width: '100%',
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        textAlign: 'left',
                        color: 'inherit',
                        border: `1px solid ${TEAL.border}`,
                        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
                        opacity: isPressed ? 0.8 : 1,
                        transition: 'all 120ms ease-out',
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: TEAL.subtle,
                          border: `1px solid ${TEAL.border}`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={mapOutline}
                          style={{ fontSize: 22, color: TEAL.light }}
                        />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 16,
                              color: '#f9fafb',
                              letterSpacing: '-0.2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {tour.name}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: statusColor,
                              background: `${statusColor}20`,
                              padding: '2px 6px',
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              flexShrink: 0,
                            }}
                          >
                            {TOUR_STATUS_LABELS[tour.status as TourStatus]}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 13,
                            color: '#6b7280',
                          }}
                        >
                          {dateRange && <span>{dateRange}</span>}
                          <span>
                            {tour.stop_count} {tour.stop_count === 1 ? 'stop' : 'stops'}
                          </span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <IonIcon
                        icon={chevronForwardOutline}
                        style={{
                          fontSize: 18,
                          color: '#4b5563',
                          flexShrink: 0,
                        }}
                      />
                    </button>
                  );
                })}

                {/* Add More Button (Admin Only) */}
                {isAdmin && tours.length > 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '12px 16px',
                      marginTop: 4,
                      borderRadius: 12,
                      background: 'transparent',
                      border: `1px dashed ${TEAL.border}`,
                      color: TEAL.light,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                    Add another tour
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </IonContent>

      {/* Create Tour Modal */}
      {showCreateModal && isAdmin && (
        <CreateTourModal
          bandId={bandId!}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTourCreated}
        />
      )}
    </IonPage>
  );
}
