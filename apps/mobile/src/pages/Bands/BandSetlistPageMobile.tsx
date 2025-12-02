/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  listOutline,
} from 'ionicons/icons';
import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type TemplateRow = {
  id: string;
  name: string;
  created_at: string | null;
};

type RouteParams = {
  bandId: string;
};

// this is the list of setlists, each one is clickable and takes us to the SetlistTemplateEditorMobile.tsx
export default function BandSetlistPageMobile() {
  const nav = useNavigate();
  const { bandId } = useParams<RouteParams>();

  const [loading, setLoading] = React.useState(true);
  const [templates, setTemplates] = React.useState<TemplateRow[]>([]);
  const [creating, setCreating] = React.useState(false);

  // Long-press haptic state
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

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
      e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
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

  const handlePressMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
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
  }, []);

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

  React.useEffect(() => {
    let alive = true;
    if (!bandId) return;

    (async () => {
      setLoading(true);
      try {
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
  }, [bandId]);

  const handleCreateSetlist = async () => {
    if (!bandId || creating) return;
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

  const renderBody = () => {
    /* Loading State */
    if (loading && templates.length === 0) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '40px 16px',
          }}
        >
          <IonSpinner
            name="dots"
            style={{ '--color': 'rgba(244, 114, 182, 0.8)' } as any}
          />
          <IonText style={{ color: 'rgba(156, 163, 175, 0.9)', fontSize: 14 }}>
            Loading setlists…
          </IonText>
        </div>
      );
    }

    /* Empty State */
    if (!loading && templates.length === 0) {
      return (
        <div
          style={{
            padding: '16px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              background: 'transparent',
              border: '1px solid rgba(244, 114, 182, 0.2)',
              borderRadius: 20,
              padding: '32px 24px',
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(244, 114, 182, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: '1px solid rgba(244, 114, 182, 0.2)',
              }}
            >
              <IonIcon
                icon={listOutline}
                style={{ fontSize: 32, color: 'rgba(244, 114, 182, 0.9)' }}
              />
            </div>
            <IonText color="light">
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'rgba(241, 245, 249, 0.95)',
                  letterSpacing: '-0.01em',
                }}
              >
                No Setlists Yet
              </h2>
              <p
                style={{
                  margin: 0,
                  color: 'rgba(148, 163, 184, 0.9)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Create a setlist and drag songs into the perfect order for your
                show.
              </p>
            </IonText>

            <button
              type="button"
              onClick={handleCreateSetlist}
              disabled={creating}
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 12,
                border: '1px solid rgba(244, 114, 182, 0.25)',
                background: 'rgba(244, 114, 182, 0.1)',
                color: 'rgba(244, 114, 182, 0.95)',
                fontSize: 14.5,
                fontWeight: 700,
                cursor: creating ? 'not-allowed' : 'pointer',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: creating ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!creating) {
                  e.currentTarget.style.background =
                    'rgba(244, 114, 182, 0.15)';
                  e.currentTarget.style.borderColor =
                    'rgba(244, 114, 182, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 114, 182, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(244, 114, 182, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
              {creating ? 'Creating…' : 'New setlist'}
            </button>
          </div>
        </div>
      );
    }

    /* Setlist List */
    return (
      <div
        style={{
          padding: 16,
          paddingBottom: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
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
            <div
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
                background: 'transparent',
                border: '1px solid rgba(244, 114, 182, 0.2)',
                borderRadius: 16,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                transform: isPressed ? 'scale(0.99)' : 'scale(1)',
                opacity: isPressed ? 0.7 : 1,
                transition: 'all 120ms ease-out',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(244, 114, 182, 0.1)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IonIcon
                  icon={listOutline}
                  style={{
                    fontSize: 22,
                    color: 'rgba(244, 114, 182, 0.9)',
                  }}
                />
              </div>

              {/* Name + created */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'rgba(241, 245, 249, 0.95)',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={t.name}
                >
                  {t.name}
                </span>
                {created && (
                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 12,
                      color: 'rgba(148, 163, 184, 0.7)',
                    }}
                  >
                    Created {created}
                  </span>
                )}
              </div>

              {/* Chevron */}
              <IonIcon
                icon={chevronForwardOutline}
                style={{
                  fontSize: 18,
                  color: 'rgba(148, 163, 184, 0.6)',
                  flexShrink: 0,
                }}
              />
            </div>
          );
        })}

        {/* Add setlist button */}
        <div style={{ padding: '12px 0' }}>
          <button
            type="button"
            onClick={handleCreateSetlist}
            disabled={creating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'rgba(148, 163, 184, 0.7)',
              fontSize: 13,
              fontWeight: 500,
              cursor: creating ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
              opacity: creating ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!creating) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.color = 'rgba(244, 114, 182, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(148, 163, 184, 0.7)';
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            {creating ? 'Creating…' : 'Add setlist'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <IonButtons slot="start">
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                '--padding-start': '8px',
                '--padding-end': '8px',
                minHeight: 44,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 22 }}
              />
            </IonButton>
          </IonButtons>

          <IonTitle
            style={{
              color: '#F9FAFB',
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 0.25,
            }}
          >
            Setlists
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background':
            'linear-gradient(180deg, #050509 0%, #020109 55%, #050509 100%)',
        }}
      >
        {renderBody()}
      </IonContent>
    </IonPage>
  );
}
