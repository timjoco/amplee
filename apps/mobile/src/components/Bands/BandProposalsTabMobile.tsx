/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { addOutline, chevronForwardOutline } from 'ionicons/icons';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Props = { bandId: string; isAdmin: boolean };

type ProposalLite = {
  id: string;
  title: string | null;
  venue: string | null;
  created_at: string;
};

export default function BandProposalsTabMobile({ bandId, isAdmin }: Props) {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalLite[]>([]);

  // --- Long-press haptic / puff state (copied from EventInboxListMobile) --- //
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[proposal list haptic error]', e);
    }
  }, []);

  const handlePressStart = useCallback(
    (
      id: string,
      e:
        | React.TouchEvent<HTMLDivElement>
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0;
      let clientY = 0;

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
    const dx = t.clientX - x;
    const dy = t.clientY - y;

    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
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

  // ------------------------------------------------------------ //

  const fetchAll = useCallback(async () => {
    try {
      setErr(null);
      setLoading(true);
      const { data, error } = await supabase
        .from('gig_proposals')
        .select('id, title, venue, created_at')
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data ?? []);
    } catch (e: any) {
      console.error(e);
      setErr(e.message ?? 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function EmptyListMessage({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ padding: 16 }}>
        <IonText color="medium">
          <p style={{ margin: 0 }}>{children}</p>
        </IonText>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16, paddingTop: 5, paddingInline: 12 }}>
      {err && (
        <div style={{ padding: 16 }}>
          <IonText color="danger">
            <p style={{ margin: 0 }}>{err}</p>
          </IonText>
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: 24,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IonSpinner />
        </div>
      ) : proposals.length === 0 ? (
        <EmptyListMessage>
          No proposed gigs yet.{' '}
          {isAdmin
            ? 'Create one to let your band vote on possible dates.'
            : 'Your band admin can propose gigs for everyone to vote on.'}
        </EmptyListMessage>
      ) : (
        <>
          <IonList
            inset={false}
            style={{
              margin: 0,
              padding: 0,
              paddingTop: 8,
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              rowGap: 4,
            }}
          >
            {proposals.map((p) => {
              const title = p.title || 'Proposed gig';

              const created = new Date(p.created_at);
              const createdLabel = created.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              const venueText = p.venue?.trim();
              const subtitle = venueText
                ? venueText
                : isAdmin
                ? 'Tap to add time options'
                : 'Open to vote on times';

              const isPressed = pressedId === p.id;

              return (
                <IonItem
                  key={p.id}
                  button
                  detail={false}
                  lines="none"
                  onClick={() => nav(`/bands/${bandId}/proposals/${p.id}`)}
                  style={{
                    ['--background' as any]: 'transparent',
                    ['--background-hover' as any]: 'transparent',
                    ['--background-activated' as any]: 'transparent', // ⬅️ remove press highlight
                    ['--ripple-color' as any]: 'transparent', // ⬅️ remove ripple
                    marginInline: -20,
                    paddingInline: 0,
                    paddingBlock: 3,
                  }}
                >
                  <div
                    onTouchStart={(ev) => handlePressStart(p.id, ev)}
                    onTouchMove={handlePressMove}
                    onTouchEnd={handlePressEnd}
                    onTouchCancel={handlePressEnd}
                    onMouseDown={(ev) => handlePressStart(p.id, ev)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    style={{
                      borderRadius: 20,
                      paddingInline: 20,
                      paddingBlock: 12,
                      minHeight: 85,
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center',
                      columnGap: 10,
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                      boxShadow: isPressed
                        ? '0 10px 24px rgba(0,0,0,.32)'
                        : '0 18px 40px rgba(0,0,0,0.9)',
                      // 🔽 this is the important part – match library “shrink”
                      transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                      transition:
                        'transform 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out',
                    }}
                  >
                    {/* Text column */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          letterSpacing: 0.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#E5E7EB',
                        }}
                        title={title}
                      >
                        {title}
                      </span>

                      <span
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          opacity: 0.85,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'rgba(226,232,240,0.9)',
                        }}
                        title={subtitle}
                      >
                        {subtitle}
                      </span>

                      <span
                        style={{
                          marginTop: 4,
                          fontSize: 11.5,
                          color: '#6B7280',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Created {createdLabel}
                      </span>
                    </div>

                    {/* Proposed pill */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        marginLeft: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 7px',
                          borderRadius: 999,
                          border: '1px solid rgba(245, 158, 11, 0.75)',
                          color: 'rgba(245, 158, 11, 0.95)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.7,
                          whiteSpace: 'nowrap',
                          background: 'rgba(24, 20, 11, 0.9)',
                        }}
                      >
                        Proposed
                      </span>
                    </div>

                    {/* Chevron */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingLeft: 4,
                      }}
                    >
                      <IonIcon
                        icon={chevronForwardOutline}
                        style={{ fontSize: 18, opacity: 0.6 }}
                      />
                    </div>
                  </div>
                </IonItem>
              );
            })}
          </IonList>
        </>
      )}

      {isAdmin && (
        <div
          style={{
            padding: 16,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IonButton
            fill="outline"
            size="small"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('amplee:global-create', {
                  detail: {
                    kind: 'proposal',
                    bandId,
                  },
                })
              );
            }}
            style={
              {
                '--color': 'rgba(245, 158, 11, 0.95)',
                '--border-color': 'rgba(245, 158, 11, 0.95)',
                '--background-activated': 'rgba(245, 158, 11, 0.95)',
                '--border-color-activated': 'rgba(245, 158, 11, 0.95)',
                '--color-activated': '#000000',
              } as React.CSSProperties
            }
          >
            <IonIcon icon={addOutline} slot="start" />
            Propose new gig
          </IonButton>
        </div>
      )}
    </div>
  );
}
