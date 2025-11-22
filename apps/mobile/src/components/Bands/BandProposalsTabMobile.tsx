/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronForwardOutline,
  closeOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
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
  const [openNew, setOpenNew] = useState(false);

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
                    marginInline: -20,
                    paddingInline: 0,
                    paddingBlock: 3,
                  }}
                >
                  <div
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
                      boxShadow: '0 10px 24px rgba(0,0,0,.32)',
                      transform: 'scale(1)',
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
            size="default"
            onClick={() => setOpenNew(true)}
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

      <AddProposalModalMobile
        bandId={bandId}
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={(proposalId) => {
          setOpenNew(false);
          nav(`/bands/${bandId}/proposals/${proposalId}`);
        }}
      />
    </div>
  );
}

/* ------------------------- ADD PROPOSAL MODAL ------------------------- */

type AddModalProps = {
  bandId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (proposalId: string) => void;
};

function AddProposalModalMobile({
  bandId,
  open,
  onClose,
  onCreated,
}: AddModalProps) {
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetState() {
    setTitle('');
    setVenue('');
    setError(null);
  }

  function handleDismiss() {
    if (saving) return;
    resetState();
    onClose();
  }

  async function handleSave() {
    try {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setError('Give this gig a title.');
        return;
      }

      setSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in.');

      const { data, error: propErr } = await supabase
        .from('gig_proposals')
        .insert({
          band_id: bandId,
          title: trimmedTitle,
          venue: venue.trim() || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (propErr) throw propErr;

      const proposalId = data?.id as string;
      resetState();
      onCreated(proposalId);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Failed to create proposal');
    } finally {
      setSaving(false);
    }
  }

  return (
    <IonModal isOpen={open} onDidDismiss={handleDismiss}>
      <IonHeader
        translucent
        style={{
          '--background':
            'radial-gradient(circle at top, rgba(8,47,73,0.6), #020617 55%)',
        }}
      >
        <IonToolbar
          style={{
            '--background': 'transparent',
          }}
        >
          <IonButtons slot="start">
            <IonButton onClick={handleDismiss} disabled={saving}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>Propose new gig</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background':
            'radial-gradient(circle at top, rgba(8,47,73,0.45), #050509 45%, #020109 100%)',
        }}
      >
        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {error && (
            <div
              style={{
                borderRadius: 12,
                padding: 10,
                backgroundColor: 'rgba(239,68,68,0.16)',
                border: '1px solid rgba(239,68,68,0.4)',
              }}
            >
              <IonText color="danger">
                <p style={{ margin: 0 }}>{error}</p>
              </IonText>
            </div>
          )}

          <IonText color="medium">
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 13,
              }}
            >
              Start a proposed gig with a title and optional venue. You can add
              dates for voting on the next screen.
            </p>
          </IonText>

          {/* Title */}
          <IonItem
            lines="none"
            style={
              {
                '--background': 'rgba(15,23,42,0.96)',
                borderRadius: 10,
                marginBottom: 4,
                fontSize: 16,
              } as any
            }
          >
            <IonLabel position="stacked">Title</IonLabel>
            <IonInput
              value={title}
              placeholder="Friday night at Riverfront"
              onIonChange={(e) => setTitle(e.detail.value ?? '')}
            />
          </IonItem>

          {/* Venue */}
          <IonItem
            lines="none"
            style={
              {
                '--background': 'rgba(15,23,42,0.96)',
                borderRadius: 10,
                fontSize: 16,
              } as any
            }
          >
            <IonLabel position="stacked">Venue (optional)</IonLabel>
            <IonInput
              value={venue}
              placeholder="The Record Bar"
              onIonChange={(e) => setVenue(e.detail.value ?? '')}
            />
          </IonItem>

          {/* Footer buttons */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <IonButton
              expand="block"
              onClick={handleSave}
              disabled={!title.trim() || saving}
              style={{
                '--background': 'rgba(245, 158, 11, 0.95)',
                '--background-activated': 'rgba(245, 158, 11, 0.95)',
                '--background-hover': 'rgba(130, 119, 100, 0.95)',
                '--color': '#022c22',
                borderRadius: 999,
              }}
            >
              {saving ? <IonSpinner name="crescent" /> : 'Create proposal'}
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={handleDismiss}
              disabled={saving}
              style={{
                borderRadius: 999,
              }}
            >
              Cancel
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}
