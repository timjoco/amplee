/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  chevronForwardOutline,
  listOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Theme Colors (Pink/Magenta for Library)
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

type BandLibraryTabProps = {
  bandId: string;
};

type LibraryCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  count: number | null;
  route: string;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function BandLibraryTab({ bandId }: BandLibraryTabProps) {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [songCount, setSongCount] = React.useState<number | null>(null);
  const [setlistCount, setSetlistCount] = React.useState<number | null>(null);

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
      console.warn('[library tab haptic error]', e);
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

  React.useEffect(() => {
    if (!bandId) return;

    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const [{ count: songs }, { count: sets }] = await Promise.all([
          supabase
            .from('songs')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId),
          supabase
            .from('setlist_templates')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId),
        ]);

        if (!alive) return;
        setSongCount(songs ?? 0);
        setSetlistCount(sets ?? 0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  // ─────────────────────────────────────────────────────────────
  // Library Cards Config
  // ─────────────────────────────────────────────────────────────

  const libraryCards: LibraryCard[] = [
    {
      id: 'songs',
      title: 'Songs',
      description: 'Your full song library with chords & lyrics',
      icon: musicalNotesOutline,
      count: songCount,
      route: `/bands/${bandId}/songs`,
    },
    {
      id: 'setlists',
      title: 'Setlists',
      description: 'Build and reuse setlists for your shows',
      icon: listOutline,
      count: setlistCount,
      route: `/bands/${bandId}/setlists`,
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '48px 16px',
        }}
      >
        <IonSpinner
          style={{
            '--color': PINK.primary,
            width: 28,
            height: 28,
          }}
        />
        <span
          style={{
            color: '#6b7280',
            fontSize: 13,
          }}
        >
          Loading library...
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        paddingTop: 8,
        paddingBottom: 24,
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
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
          Your Music
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {libraryCards.map((card) => {
          const isPressed = pressedId === card.id;

          return (
            <button
              key={card.id}
              onClick={() => nav(card.route)}
              onTouchStart={(ev) => handlePressStart(card.id, ev)}
              onTouchMove={handlePressMove}
              onTouchEnd={handlePressEnd}
              onTouchCancel={handlePressEnd}
              onMouseDown={(ev) => handlePressStart(card.id, ev)}
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
                cursor: 'pointer',
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
                  icon={card.icon}
                  style={{
                    fontSize: 22,
                    color: PINK.light,
                  }}
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
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#f9fafb',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {card.title}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: PINK.subtle,
                      border: `1px solid ${PINK.border}`,
                      color: PINK.light,
                    }}
                  >
                    {card.count ?? 0}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: '#6b7280',
                    lineHeight: 1.4,
                  }}
                >
                  {card.description}
                </p>
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
      </div>

      {/* Empty State Hint */}
      {songCount === 0 && setlistCount === 0 && (
        <div
          style={{
            ...glassCard,
            marginTop: 16,
            padding: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.5 }}>
            Start by adding songs to your library, then create setlists for your
            upcoming shows.
          </div>
        </div>
      )}
    </div>
  );
}
