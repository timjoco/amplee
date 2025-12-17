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
  chevronBackOutline,
  chevronForwardOutline,
  listOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Theme Colors (Pink/Magenta for Library/Setlists)
// ─────────────────────────────────────────────────────────────

const PINK = {
  primary: '#ec4899',
  primaryHover: '#db2777',
  light: '#f472b6',
  lighter: '#f9a8d4',
  dark: '#be185d',
  glow: 'rgba(236, 72, 153, 0.4)',
  subtle: 'rgba(236, 72, 153, 0.08)',
  border: 'rgba(236, 72, 153, 0.25)',
};

// ─────────────────────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────────────────────

const glassCard = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type TemplateRow = {
  id: string;
  name: string;
  created_at: string | null;
};

type RouteParams = {
  bandId: string;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function BandSetlistPageMobile() {
  const nav = useNavigate();
  const { bandId } = useParams<RouteParams>();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [bandName, setBandName] = useState('');

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
      console.warn('[setlist page haptic error]', e);
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

  // Get band info, user role, and setlists
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

        // Get setlists
        const { data, error } = await supabase
          .from('setlist_templates')
          .select('id,name,created_at')
          .eq('band_id', bandId)
          .order('created_at', { ascending: false });

        if (!alive) return;

        if (error) {
          console.error('[BandSetlistsPageMobile] load error', error);
          setTemplates([]);
        } else {
          setTemplates((data || []) as TemplateRow[]);
        }
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

  const handleCreateSetlist = async () => {
    if (!bandId || creating || !isAdmin) return;
    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('setlist_templates')
        .insert({
          band_id: bandId,
          name: 'New Setlist',
        } as any)
        .select('id')
        .single();

      if (error) {
        console.error('[BandSetlistsPageMobile] create setlist error', error);
        return;
      }

      const id = (data as any)?.id as string;
      if (id) {
        nav(`/bands/${bandId}/setlists/${id}`);
      }
    } finally {
      setCreating(false);
    }
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
                  icon={listOutline}
                  style={{ color: PINK.light, fontSize: 20 }}
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
                  Setlists
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
                    ? PINK.subtle
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isAdmin ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                }}
              >
                <IonIcon
                  icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                  style={{
                    fontSize: 14,
                    color: isAdmin ? PINK.light : '#6b7280',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isAdmin ? PINK.light : '#6b7280',
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
                  '--color': PINK.primary,
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
                Loading setlists...
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
                    background: PINK.primary,
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
                  Your Setlists
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
                  {templates.length}
                </span>
              </div>

              {/* Create Button (Admin Only) */}
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
                  Only band admins can create or edit setlists
                </span>
              </div>
            )}

            {/* Empty State */}
            {templates.length === 0 ? (
              <div
                style={{
                  ...glassCard,
                  border: `1px solid ${PINK.border}`,
                  padding: 32,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: PINK.subtle,
                    border: `1px solid ${PINK.border}`,
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <IonIcon
                    icon={listOutline}
                    style={{ fontSize: 28, color: PINK.light }}
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
                  No Setlists Yet
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
                    ? 'Create a setlist and drag songs into the perfect order for your show.'
                    : 'No setlists have been created yet. Ask a band admin to create one.'}
                </p>

                {isAdmin && (
                  <button
                    onClick={handleCreateSetlist}
                    disabled={creating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 20px',
                      borderRadius: 12,
                      background: PINK.primary,
                      border: 'none',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      boxShadow: `0 4px 14px ${PINK.glow}`,
                      opacity: creating ? 0.7 : 1,
                    }}
                  >
                    {creating ? (
                      <IonSpinner
                        style={{ '--color': '#fff', width: 16, height: 16 }}
                      />
                    ) : (
                      <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                    )}
                    {creating ? 'Creating...' : 'Create your first setlist'}
                  </button>
                )}
              </div>
            ) : (
              /* Setlist List */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {templates.map((t) => {
                  const created = t.created_at
                    ? new Date(t.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : null;

                  const isPressed = pressedId === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => nav(`/bands/${bandId}/setlists/${t.id}`)}
                      onTouchStart={(ev) => handlePressStart(t.id, ev)}
                      onTouchMove={handlePressMove}
                      onTouchEnd={handlePressEnd}
                      onTouchCancel={handlePressEnd}
                      onMouseDown={(ev) => handlePressStart(t.id, ev)}
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
                        border: `1px solid ${PINK.border}`,
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
                          background: PINK.subtle,
                          border: `1px solid ${PINK.border}`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={listOutline}
                          style={{ fontSize: 22, color: PINK.light }}
                        />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                          {t.name}
                        </div>
                        {created && (
                          <div
                            style={{
                              fontSize: 13,
                              color: '#6b7280',
                              marginTop: 4,
                            }}
                          >
                            Created {created}
                          </div>
                        )}
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
                {isAdmin && templates.length > 0 && (
                  <button
                    onClick={handleCreateSetlist}
                    disabled={creating}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '12px 16px',
                      marginTop: 4,
                      borderRadius: 12,
                      background: 'transparent',
                      border: `1px dashed ${PINK.border}`,
                      color: PINK.light,
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: creating ? 0.6 : 1,
                    }}
                  >
                    <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                    {creating ? 'Creating...' : 'Add another setlist'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
