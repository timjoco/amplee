/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon, IonItem, IonList, IonSpinner, IonText } from '@ionic/react';
import {
  addOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  clipboardOutline,
  timeOutline,
} from 'ionicons/icons';
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
  optionsCount: number;
  totalVotes: number;
  userHasVoted: boolean;
};

export default function BandProposalsTabMobile({ bandId, isAdmin }: Props) {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalLite[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  // --- Long-press haptic / puff state  --- //
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

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setMyId(uid);

      // Fetch proposals with options and votes
      const { data, error } = await supabase
        .from('gig_proposals')
        .select(
          `
          id, 
          title, 
          venue, 
          created_at,
          gig_proposal_options!gig_proposal_options_proposal_id_fkey (
            id,
            gig_proposal_votes!gig_proposal_votes_option_id_fkey (
              user_id
            )
          )
        `
        )
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to calculate stats
      const processed: ProposalLite[] = (data ?? []).map((p: any) => {
        const options = p.gig_proposal_options ?? [];
        const optionsCount = options.length;

        // Count total votes and check if user voted
        let totalVotes = 0;
        let userHasVoted = false;

        options.forEach((opt: any) => {
          const votes = opt.gig_proposal_votes ?? [];
          totalVotes += votes.length;

          if (uid && votes.some((v: any) => v.user_id === uid)) {
            userHasVoted = true;
          }
        });

        return {
          id: p.id,
          title: p.title,
          venue: p.venue,
          created_at: p.created_at,
          optionsCount,
          totalVotes,
          userHasVoted,
        };
      });

      setProposals(processed);
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

  const openCreateProposal = () => {
    window.dispatchEvent(
      new CustomEvent('amplee:global-create', {
        detail: {
          kind: 'proposal',
          bandId,
        },
      })
    );
  };

  return (
    <div style={{ paddingBottom: 16, paddingTop: 8, paddingInline: 4 }}>
      {err && (
        <div style={{ padding: 16 }}>
          <IonText style={{ color: 'rgba(248, 113, 113, 0.95)', fontSize: 14 }}>
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
          <IonSpinner style={{ '--color': 'rgba(251, 191, 36, 0.8)' } as any} />
        </div>
      ) : proposals.length === 0 ? (
        /* Empty state - unified card style */
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
              border: '1px solid rgba(245, 158, 11, 0.2)',
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
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <IonIcon
                icon={clipboardOutline}
                style={{ fontSize: 32, color: 'rgba(251, 191, 36, 0.9)' }}
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
                No Proposals Yet
              </h2>
              <p
                style={{
                  margin: 0,
                  color: 'rgba(148, 163, 184, 0.9)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {isAdmin
                  ? 'Create your first proposal to let your band vote on possible gig dates and venues.'
                  : 'Your band admin can propose gigs for everyone to vote on.'}
              </p>
            </IonText>

            {/* Admin-only create button inside card */}
            {isAdmin && (
              <button
                type="button"
                onClick={openCreateProposal}
                style={{
                  marginTop: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: 'rgba(251, 191, 36, 0.95)',
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                  e.currentTarget.style.borderColor =
                    'rgba(251, 191, 36, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                Propose new gig
              </button>
            )}
          </div>
        </div>
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
              rowGap: 8,
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

              const isPressed = pressedId === p.id;

              // Determine subtitle based on state
              let subtitle = '';
              let subtitleIcon = null;
              let subtitleColor = 'rgba(203, 213, 225, 0.85)';

              if (p.optionsCount === 0) {
                subtitle = isAdmin
                  ? 'Tap to add date options'
                  : 'No dates added yet';
                subtitleIcon = timeOutline;
                subtitleColor = 'rgba(251, 191, 36, 0.75)';
              } else if (!p.userHasVoted) {
                subtitle = `${p.optionsCount} ${
                  p.optionsCount === 1 ? 'date' : 'dates'
                } • Tap to vote`;
                subtitleIcon = timeOutline;
                subtitleColor = 'rgba(251, 191, 36, 0.85)';
              } else {
                subtitle = `${p.optionsCount} ${
                  p.optionsCount === 1 ? 'date' : 'dates'
                } • You voted`;
                subtitleIcon = checkmarkCircleOutline;
                subtitleColor = 'rgba(52, 211, 153, 0.85)';
              }

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
                    ['--background-activated' as any]: 'transparent',
                    ['--ripple-color' as any]: 'transparent',
                    paddingInline: 0,
                    paddingBlock: 0,
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
                      borderRadius: 16,
                      paddingInline: 16,
                      paddingBlock: 14,
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center',
                      columnGap: 12,
                      background: 'transparent',
                      border: p.userHasVoted
                        ? '1px solid rgba(52, 211, 153, 0.2)'
                        : '1px solid rgba(71, 85, 105, 0.2)',
                      transform: isPressed ? 'scale(0.99)' : 'scale(1)',
                      opacity: isPressed ? 0.7 : 1,
                      transition: 'all 120ms ease-out',
                    }}
                  >
                    {/* Text column */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 15.5,
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'rgba(241, 245, 249, 0.95)',
                        }}
                        title={title}
                      >
                        {title}
                      </span>

                      {venueText && (
                        <span
                          style={{
                            fontSize: 12.5,
                            color: 'rgba(148, 163, 184, 0.8)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3,
                          }}
                          title={venueText}
                        >
                          {venueText}
                        </span>
                      )}

                      {/* Status line with icon */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 12.5,
                          color: subtitleColor,
                          fontWeight: 600,
                        }}
                      >
                        {subtitleIcon && (
                          <IonIcon
                            icon={subtitleIcon}
                            style={{ fontSize: 14 }}
                          />
                        )}
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {subtitle}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          color: 'rgba(148, 163, 184, 0.7)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
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
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          color: 'rgba(251, 191, 36, 0.95)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          whiteSpace: 'nowrap',
                          background: 'rgba(245, 158, 11, 0.1)',
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
                      }}
                    >
                      <IonIcon
                        icon={chevronForwardOutline}
                        style={{
                          fontSize: 18,
                          color: 'rgba(148, 163, 184, 0.6)',
                        }}
                      />
                    </div>
                  </div>
                </IonItem>
              );
            })}
          </IonList>

          {/* Admin-only subtle add button when list has items - matches events style */}
          {isAdmin && (
            <div style={{ padding: '12px 16px' }}>
              <button
                type="button"
                onClick={openCreateProposal}
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
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'rgba(251, 191, 36, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(148, 163, 184, 0.7)';
                }}
              >
                <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
                Add proposal
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
