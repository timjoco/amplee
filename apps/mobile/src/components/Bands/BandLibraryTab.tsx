/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon, IonSpinner, IonText } from '@ionic/react';
import {
  chevronForwardOutline,
  listOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type BandLibraryTabProps = {
  bandId: string;
};

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

  const handleOpenSetlists = React.useCallback(() => {
    if (!bandId) {
      console.warn('[BandLibraryTab] Missing bandId for setlists nav');
      return;
    }
    nav(`/bands/${bandId}/setlists`);
  }, [bandId, nav]);

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

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '24px 16px',
        }}
      >
        <IonSpinner
          name="dots"
          style={{ '--color': 'rgba(244, 114, 182, 0.8)' } as any}
        />
        <IonText style={{ color: 'rgba(156, 163, 175, 0.9)', fontSize: 14 }}>
          Loading library…
        </IonText>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16, paddingTop: 8, paddingInline: 16 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingTop: 8,
        }}
      >
        {/* Songs Card */}
        <div
          onClick={() => nav(`/bands/${bandId}/songs`)}
          onTouchStart={(ev) => handlePressStart('songs', ev)}
          onTouchMove={handlePressMove}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          onMouseDown={(ev) => handlePressStart('songs', ev)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          style={{
            background: 'transparent',
            border: '1px solid rgba(244, 114, 182, 0.2)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transform: pressedId === 'songs' ? 'scale(0.99)' : 'scale(1)',
            opacity: pressedId === 'songs' ? 0.7 : 1,
            transition: 'all 120ms ease-out',
          }}
        >
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
              icon={musicalNotesOutline}
              style={{ fontSize: 22, color: 'rgba(244, 114, 182, 0.9)' }}
            />
          </div>

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
                  fontWeight: 700,
                  fontSize: 15.5,
                  color: 'rgba(241, 245, 249, 0.95)',
                  letterSpacing: '-0.01em',
                }}
              >
                Songs
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(244, 114, 182, 0.1)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  color: 'rgba(244, 114, 182, 0.9)',
                }}
              >
                {songCount ?? 0}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'rgba(148, 163, 184, 0.8)',
                lineHeight: 1.4,
              }}
            >
              Open your band's full song library
            </p>
          </div>

          <IonIcon
            icon={chevronForwardOutline}
            style={{
              fontSize: 18,
              color: 'rgba(148, 163, 184, 0.6)',
              flexShrink: 0,
            }}
          />
        </div>

        {/* Setlists Card */}
        <div
          onClick={handleOpenSetlists}
          onTouchStart={(ev) => handlePressStart('setlists', ev)}
          onTouchMove={handlePressMove}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          onMouseDown={(ev) => handlePressStart('setlists', ev)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          style={{
            background: 'transparent',
            border: '1px solid rgba(244, 114, 182, 0.2)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transform: pressedId === 'setlists' ? 'scale(0.99)' : 'scale(1)',
            opacity: pressedId === 'setlists' ? 0.7 : 1,
            transition: 'all 120ms ease-out',
          }}
        >
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
              style={{ fontSize: 22, color: 'rgba(244, 114, 182, 0.9)' }}
            />
          </div>

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
                  fontWeight: 700,
                  fontSize: 15.5,
                  color: 'rgba(241, 245, 249, 0.95)',
                  letterSpacing: '-0.01em',
                }}
              >
                Setlists
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(244, 114, 182, 0.1)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  color: 'rgba(244, 114, 182, 0.9)',
                }}
              >
                {setlistCount ?? 0}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'rgba(148, 163, 184, 0.8)',
                lineHeight: 1.4,
              }}
            >
              Build and reuse setlists for your shows
            </p>
          </div>

          <IonIcon
            icon={chevronForwardOutline}
            style={{
              fontSize: 18,
              color: 'rgba(148, 163, 184, 0.6)',
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
