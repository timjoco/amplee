/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonModal,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  addCircleOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  closeCircleOutline,
  createOutline,
  helpCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Option = {
  id: string;
  starts_at: string;
  yes: number;
  no: number;
  myVote?: 'yes' | 'no';
};

type Proposal = {
  id: string;
  title: string | null;
  venue: string | null;
  created_at: string;
  created_by: string | null;
  options: Option[];
};

type RouteParams = {
  bandId: string;
  proposalId: string;
};

const APP_URL = import.meta.env.VITE_APP_URL as string | undefined;

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function ProposedGigSheetMobile() {
  const nav = useNavigate();
  const { bandId, proposalId } = useParams<RouteParams>();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [myId, setMyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [showConvertAlert, setShowConvertAlert] = useState(false);

  // proposal meta
  const [proposedByName, setProposedByName] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // delete proposal flow
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // edit proposal details
  const [showEditProposal, setShowEditProposal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [savingProposal, setSavingProposal] = useState(false);

  // edit individual time option
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingOptionDate, setEditingOptionDate] = useState('');

  const fetchData = useCallback(async () => {
    if (!bandId || !proposalId) return;
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id ?? '';
      setMyId(uid);

      const { count: memCount } = await supabase
        .from('band_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('band_id', bandId);
      setMembersCount(memCount ?? 0);

      const { data, error: propErr } = await supabase
        .from('gig_proposals')
        .select(
          `
          id,
          title,
          venue,
          created_at,
          created_by,
          gig_proposal_options!gig_proposal_options_proposal_id_fkey (
            id,
            starts_at,
            gig_proposal_votes!gig_proposal_votes_option_id_fkey (
              user_id,
              vote
            )
          )
        `
        )
        .eq('id', proposalId)
        .maybeSingle();

      if (propErr) throw propErr;
      if (!data) {
        setError('Proposal not found');
        setProposal(null);
        return;
      }

      const options = (data.gig_proposal_options ?? []).map((o: any) => {
        const votes = o.gig_proposal_votes ?? [];
        return {
          id: o.id,
          starts_at: o.starts_at,
          yes: votes.filter((v: any) => v.vote === 'yes').length,
          no: votes.filter((v: any) => v.vote === 'no').length,
          myVote: votes.find((v: any) => v.user_id === uid)?.vote,
        } as Option;
      });

      // lookup "proposed by"
      if (data.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, first_name, last_name')
          .eq('id', data.created_by)
          .maybeSingle();

        if (profile) {
          const full =
            [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
            null;
          setProposedByName(profile.display_name || full || 'Bandmate');
        } else {
          setProposedByName('Bandmate');
        }
      } else {
        setProposedByName(null);
      }

      setProposal({
        id: data.id,
        title: data.title,
        venue: data.venue,
        created_at: data.created_at,
        created_by: data.created_by ?? null,
        options,
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [bandId, proposalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdmin = !!(proposal && myId && proposal.created_by === myId);

  async function vote(optionId: string, voteVal: 'yes' | 'no') {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      await supabase.from('gig_proposal_votes').upsert(
        {
          proposal_id: proposalId,
          option_id: optionId,
          user_id: user.id,
          vote: voteVal,
        },
        { onConflict: 'proposal_id,option_id,user_id' }
      );

      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function addOption() {
    try {
      if (!newDate || !proposalId) return;
      setSaving(true);

      const iso = new Date(newDate).toISOString();
      const { error: insertErr } = await supabase
        .from('gig_proposal_options')
        .insert({
          proposal_id: proposalId,
          starts_at: iso,
        });

      if (insertErr) throw insertErr;

      setNewDate('');
      setAdding(false);
      await fetchData();
    } catch (e: any) {
      console.error(e);
      setError('Failed to add date option');
    } finally {
      setSaving(false);
    }
  }

  async function convert(optionId: string) {
    try {
      if (!APP_URL) {
        throw new Error('Missing VITE_APP_URL for convert endpoint');
      }

      setSaving(true);

      const res = await fetch(
        `${APP_URL}/api/bands/${bandId}/proposals/${proposalId}/convert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionId }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to convert to event');
      }

      setShowConvertAlert(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to convert to event');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProposal() {
    try {
      if (!bandId || !proposalId) return;
      setDeleting(true);

      const { error: delErr } = await supabase
        .from('gig_proposals')
        .delete()
        .eq('id', proposalId)
        .eq('band_id', bandId);

      if (delErr) throw delErr;

      setShowDeleteConfirm(false);
      nav(-1);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to delete proposal');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteOption(optionId: string) {
    try {
      if (!proposalId) return;
      setSaving(true);

      const { error: delErr } = await supabase
        .from('gig_proposal_options')
        .delete()
        .eq('id', optionId)
        .eq('proposal_id', proposalId);

      if (delErr) throw delErr;

      await fetchData();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to delete date option');
    } finally {
      setSaving(false);
    }
  }

  function startEditProposal() {
    if (!proposal) return;
    setEditTitle(proposal.title ?? '');
    setEditVenue(proposal.venue ?? '');
    setShowEditProposal(true);
  }

  async function saveProposalEdits() {
    if (!proposal || !bandId) return;

    try {
      setSavingProposal(true);

      const updates: { title: string | null; venue: string | null } = {
        title: editTitle.trim() || null,
        venue: editVenue.trim() || null,
      };

      const { error: updErr } = await supabase
        .from('gig_proposals')
        .update(updates)
        .eq('id', proposal.id)
        .eq('band_id', bandId);

      if (updErr) throw updErr;

      setProposal((prev) =>
        prev
          ? {
              ...prev,
              title: updates.title,
              venue: updates.venue,
            }
          : prev
      );
      setShowEditProposal(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to update proposed gig');
    } finally {
      setSavingProposal(false);
    }
  }

  function startEditOption(option: Option) {
    setEditingOptionId(option.id);
    setEditingOptionDate(toLocalInputValue(option.starts_at));
  }

  async function saveOptionEdit() {
    if (!editingOptionId || !editingOptionDate) {
      setEditingOptionId(null);
      setEditingOptionDate('');
      return;
    }

    try {
      setSaving(true);
      const iso = new Date(editingOptionDate).toISOString();

      const { error: updErr } = await supabase
        .from('gig_proposal_options')
        .update({ starts_at: iso })
        .eq('id', editingOptionId);

      if (updErr) throw updErr;

      setEditingOptionId(null);
      setEditingOptionDate('');
      await fetchData();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to update date option');
    } finally {
      setSaving(false);
    }
  }

  const renderBody = () => {
    if (loading) {
      return (
        <div
          style={{
            padding: 24,
            display: 'flex',
            justifyContent: 'center',
            marginTop: 48,
          }}
        >
          <IonSpinner name="crescent" />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: 16 }}>
          <div
            style={{
              borderRadius: 12,
              padding: 12,
              backgroundColor: 'rgba(239,68,68,0.16)',
              border: '1px solid rgba(239,68,68,0.4)',
            }}
          >
            <IonText color="danger">
              <p style={{ margin: 0 }}>{error}</p>
            </IonText>
          </div>
        </div>
      );
    }

    if (!proposal) return null;

    const createdLabel = new Date(proposal.created_at).toLocaleDateString(
      undefined,
      { month: 'short', day: 'numeric', year: 'numeric' }
    );

    const locationText = proposal.venue?.trim()
      ? proposal.venue
      : 'Location TBD';

    const proposedByText = proposal.created_by
      ? proposal.created_by === myId
        ? 'You'
        : proposedByName || 'Bandmate'
      : 'Unknown';

    return (
      <div
        style={{
          padding: 16,
          paddingBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* SECTION 1: Proposed gig details (amber shell) */}
        <div
          style={{
            borderRadius: 18,
            padding: 16,
            border: '1px solid rgba(245, 158, 11, 0.25)', // amber
          }}
        >
          <IonText>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                letterSpacing: 0.14,
                textTransform: 'uppercase',
                color: 'rgba(245,158,11,0.95)',
                marginBottom: 4,
              }}
            >
              Proposed gig
            </p>
          </IonText>

          <h2
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 800,
              color: '#EDEBFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {proposal.title || 'Proposed Gig'}
          </h2>

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 13,
              color: '#E5E7EB',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={{ opacity: 0.7 }}>Location</span>
              <span
                style={{
                  fontWeight: 500,
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '60%',
                }}
              >
                {locationText}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={{ opacity: 0.7 }}>Proposed by</span>
              <span
                style={{
                  fontWeight: 500,
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '60%',
                }}
              >
                {proposedByText}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={{ opacity: 0.7 }}>Created</span>
              <span
                style={{
                  fontWeight: 500,
                  textAlign: 'right',
                }}
              >
                {createdLabel}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 8,
                borderTop: '1px solid rgba(31,41,55,0.9)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <IonButton
                size="small"
                fill="outline"
                style={{
                  '--border-color': 'rgba(245,158,11,0.85)',
                  '--color': 'rgba(245,158,11,0.95)',
                  '--background-activated': 'rgba(245,158,11,0.85)',
                  borderRadius: 999,
                }}
                onClick={startEditProposal}
              >
                <IonIcon icon={createOutline} slot="start" />
                Edit proposed gig
              </IonButton>
              <IonButton
                size="small"
                fill="outline"
                color="danger"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  borderRadius: 999,
                }}
              >
                <IonIcon icon={trashOutline} slot="start" />
                Delete proposed gig
              </IonButton>
            </div>
          )}
        </div>

        {/* SECTION 2: Proposed gig time options (amber + teal accent) */}
        <div
          style={{
            borderRadius: 18,
            padding: 14,
            border: '1px solid rgba(245, 158, 11, 0.25)', // amber
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <IonText>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  letterSpacing: 0.14,
                  textTransform: 'uppercase',
                  color: 'rgba(245, 158, 11)', // amber label
                }}
              >
                Time options
              </p>
            </IonText>

            {/* ? helper button */}
            <IonButton
              onClick={() => setShowHelp(true)}
              fill="clear"
              size="small"
              style={{
                minWidth: 0,
                paddingInline: 6,
                paddingBlock: 4,
                borderRadius: 999,
              }}
            >
              <IonIcon
                icon={helpCircleOutline}
                style={{ fontSize: 18, color: 'rgba(45,212,191,0.95)' }} // teal icon
              />
            </IonButton>
          </div>

          {/* If there are NO options yet */}
          {proposal.options.length === 0 ? (
            <IonText color="light">
              <p
                style={{
                  marginTop: 2,
                  marginBottom: 10,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Your band admin will add time options for this proposed gig.
                Once times are added, you&apos;ll be able to vote{' '}
                <strong>Yes</strong> on dates that work and <strong>No</strong>{' '}
                on dates that don&apos;t.
              </p>
            </IonText>
          ) : (
            <>
              {/* Normal explanation when there ARE options */}
              <IonText color="medium">
                <p
                  style={{
                    marginTop: 2,
                    marginBottom: 10,
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  Tap <strong>Yes</strong> for any dates that work for you and{' '}
                  <strong>No</strong> for dates that don&apos;t. When every
                  member says <strong>Yes</strong> to an option, your admin can
                  convert it into a confirmed event.
                </p>
              </IonText>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {proposal.options.map((o) => {
                  const allYes =
                    membersCount > 0 && o.yes === membersCount && o.no === 0;

                  const dt = new Date(o.starts_at);
                  const label = dt.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  const isEditingThis = editingOptionId === o.id;

                  let slidingRef: HTMLIonItemSlidingElement | null = null;

                  return (
                    <IonItemSliding
                      key={o.id}
                      ref={(el) => {
                        slidingRef = el;
                      }}
                      disabled={!isAdmin || isEditingThis}
                    >
                      <IonItem
                        lines="none"
                        style={{
                          '--background': 'transparent',
                          '--padding-start': '0px',
                          '--inner-padding-end': '0px',
                          paddingInline: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            borderRadius: 12,
                            padding: 10,
                            border: '1px solid rgba(45,212,191,0.25)',
                            background:
                              'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(3,7,18,0.98))',
                            position: 'relative',
                            overflow: 'hidden',
                            paddingRight: 18,
                          }}
                        >
                          {isAdmin && !isEditingThis && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 6,
                                bottom: 6,
                                right: 0,
                                width: 6,
                                background: 'rgba(70, 71, 73, 0.9)',
                                opacity: 0.7,
                                pointerEvents: 'none',
                                borderTopLeftRadius: 999,
                                borderBottomLeftRadius: 999,
                              }}
                            />
                          )}

                          {/* HEADER ROW */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                fontSize: 15,
                                color: '#E5E7EB',
                                maxWidth: '55%',
                              }}
                            >
                              {label}
                            </p>

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  gap: 6,
                                }}
                              >
                                {/* YES = teal */}
                                <IonButton
                                  size="small"
                                  fill={
                                    o.myVote === 'yes' ? 'solid' : 'outline'
                                  }
                                  onClick={() => vote(o.id, 'yes')}
                                  disabled={saving}
                                  style={
                                    o.myVote === 'yes'
                                      ? {
                                          '--background':
                                            'rgba(45,212,191,0.95)',
                                          '--background-activated':
                                            'rgba(45,212,191,1)',
                                          '--color': '#022c22',
                                        }
                                      : {
                                          '--border-color':
                                            'rgba(45,212,191,0.85)',
                                          '--color': 'rgba(45,212,191,0.95)',
                                        }
                                  }
                                >
                                  <IonIcon
                                    icon={checkmarkCircleOutline}
                                    slot="start"
                                  />
                                  Yes ({o.yes})
                                </IonButton>

                                {/* NO = amber-ish danger for proposals */}
                                <IonButton
                                  size="small"
                                  fill={o.myVote === 'no' ? 'solid' : 'outline'}
                                  onClick={() => vote(o.id, 'no')}
                                  disabled={saving}
                                  style={
                                    o.myVote === 'no'
                                      ? {
                                          '--background':
                                            'rgba(251, 191, 36, 0.95)',
                                          '--background-activated':
                                            'rgba(251, 191, 36, 1)',
                                          '--color': '#451a03',
                                        }
                                      : {
                                          '--border-color':
                                            'rgba(251, 191, 36, 0.9)',
                                          '--color': 'rgba(251, 191, 36, 0.95)',
                                        }
                                  }
                                >
                                  <IonIcon
                                    icon={closeCircleOutline}
                                    slot="start"
                                  />
                                  No ({o.no})
                                </IonButton>
                              </div>
                            </div>
                          </div>

                          {/* INLINE EDITOR WHEN EDITING THIS OPTION */}
                          {isEditingThis && (
                            <div
                              style={{
                                marginTop: 10,
                                paddingTop: 8,
                                borderTop: '1px solid rgba(31,41,55,0.9)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                              }}
                            >
                              <IonText color="medium">
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 12,
                                  }}
                                >
                                  Edit date &amp; time for this option
                                </p>
                              </IonText>

                              <input
                                type="datetime-local"
                                value={editingOptionDate}
                                onChange={(e) =>
                                  setEditingOptionDate(e.target.value)
                                }
                                style={{
                                  width: '100%',
                                  borderRadius: 10,
                                  border: '1px solid rgba(148,163,184,0.8)',
                                  padding: 8,
                                  backgroundColor: '#020617',
                                  color: '#E5E7EB',
                                }}
                              />

                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  gap: 8,
                                }}
                              >
                                <IonButton
                                  size="small"
                                  expand="block"
                                  onClick={saveOptionEdit}
                                  disabled={!editingOptionDate || saving}
                                  style={{
                                    '--background': 'rgba(45,212,191,0.95)',
                                    '--background-activated':
                                      'rgba(45,212,191,1)',
                                    '--color': '#022c22',
                                    borderRadius: 999,
                                  }}
                                >
                                  Save
                                </IonButton>
                                <IonButton
                                  size="small"
                                  expand="block"
                                  fill="outline"
                                  color="medium"
                                  onClick={() => {
                                    setEditingOptionId(null);
                                    setEditingOptionDate('');
                                  }}
                                  style={{
                                    borderRadius: 999,
                                  }}
                                >
                                  Cancel
                                </IonButton>
                              </div>
                            </div>
                          )}

                          {allYes && (
                            <IonButton
                              size="small"
                              expand="block"
                              style={{
                                '--background': 'rgba(22,163,74,0.95)',
                                '--background-activated': 'rgba(22,163,74,1)',
                                '--color': '#022c22',
                                marginTop: 10,
                              }}
                              onClick={() => convert(o.id)}
                              disabled={saving}
                            >
                              Convert to Event
                            </IonButton>
                          )}
                        </div>
                      </IonItem>

                      {/* SWIPE ACTIONS — HIDDEN WHILE EDITING */}
                      {isAdmin && !isEditingThis && (
                        <IonItemOptions
                          side="end"
                          style={{
                            background: 'transparent',
                            paddingInline: 4,
                            paddingBlock: 2,
                          }}
                        >
                          <IonItemOption
                            style={{
                              '--background': 'transparent',
                              padding: 0,
                              margin: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 2,
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                              }}
                            >
                              {/* EDIT */}
                              <IonButton
                                size="small"
                                fill="outline"
                                color="light"
                                onClick={() => {
                                  startEditOption(o);
                                  slidingRef?.closeOpened?.();
                                }}
                                style={{
                                  borderRadius: 999,
                                  paddingInline: 8,
                                  minHeight: 30,
                                  '--border-color': 'rgba(148,163,184,0.7)',
                                  '--color': '#E5E7EB',
                                  '--background': 'rgba(15,23,42,0.96)',
                                  '--background-activated': 'rgba(6,10,24,1)',
                                }}
                              >
                                <IonIcon
                                  icon={createOutline}
                                  slot="start"
                                  style={{ fontSize: 16 }}
                                />
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.6,
                                  }}
                                >
                                  Edit
                                </span>
                              </IonButton>

                              {/* DELETE */}
                              <IonButton
                                size="small"
                                fill="solid"
                                color="danger"
                                onClick={() => {
                                  slidingRef?.closeOpened?.();
                                  deleteOption(o.id);
                                }}
                                style={{
                                  borderRadius: 999,
                                  paddingInline: 8,
                                  minHeight: 30,
                                  '--background': 'rgba(127,29,29,0.96)',
                                  '--background-activated': 'rgba(68,16,16,1)',
                                  '--color': '#FECACA',
                                }}
                              >
                                <IonIcon
                                  icon={trashOutline}
                                  slot="start"
                                  style={{ fontSize: 16 }}
                                />
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.6,
                                  }}
                                >
                                  Delete
                                </span>
                              </IonButton>
                            </div>
                          </IonItemOption>
                        </IonItemOptions>
                      )}
                    </IonItemSliding>
                  );
                })}
              </div>
            </>
          )}

          {/* Admin add option (teal create) */}
          {isAdmin && (
            <div style={{ marginTop: 16 }}>
              {!adding ? (
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setAdding(true)}
                  disabled={saving}
                  style={{
                    '--background': 'rgba(15,23,42,0.98)',
                    '--border-color': 'rgba(45,212,191,0.8)',
                    '--color': 'rgba(45,212,191,0.95)',
                    '--background-activated': 'rgba(27, 124, 111, 1)',
                    borderRadius: 999,
                    boxShadow:
                      '0 0 0 1px rgba(15,23,42,0.9), 0 8px 22px rgba(0,0,0,0.9)',
                  }}
                >
                  <IonIcon icon={addCircleOutline} slot="start" />
                  Add date option
                </IonButton>
              ) : (
                <div
                  style={{
                    borderRadius: 14,
                    padding: '12px 12px 14px 12px',
                    marginTop: 4,
                    border: '1px solid rgba(148,163,184,0.6)',
                    background:
                      'linear-gradient(180deg, rgba(15,23,42,0.97), rgba(3,7,18,0.97))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    overflow: 'hidden',
                  }}
                >
                  <IonText>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: '#E5E7EB',
                      }}
                    >
                      Add a date option
                    </p>
                  </IonText>

                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      display: 'block',
                      boxSizing: 'border-box',
                      borderRadius: 10,
                      border: '1px solid rgba(148,163,184,0.8)',
                      padding: '10px 12px',
                      backgroundColor: '#020617',
                      color: '#E5E7EB',
                      fontSize: 14,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <IonButton
                      size="small"
                      expand="block"
                      onClick={addOption}
                      disabled={!newDate || saving}
                      style={{
                        '--background': 'rgba(45,212,191,0.95)',
                        '--background-activated': 'rgba(45,212,191,1)',
                        '--background-hover': 'rgba(45,212,191,1)',
                        '--color': '#022c22',
                        borderRadius: 999,
                        boxShadow: '0 0 18px rgba(45,212,191,0.45)',
                      }}
                    >
                      Save
                    </IonButton>

                    <IonButton
                      size="small"
                      expand="block"
                      fill="outline"
                      color="medium"
                      onClick={() => {
                        setAdding(false);
                        setNewDate('');
                      }}
                      style={{
                        borderRadius: 999,
                      }}
                    >
                      Cancel
                    </IonButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const headerTitle = proposal?.title || 'Proposed Gig';

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: '100%',
              paddingInline: 12,
              paddingBlock: 6,
            }}
          >
            {/* Top card: back, centered title, proposed pill */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 20,
                background: 'rgba(14, 15, 16, 0.98)',
                border: '.5px solid rgba(60, 56, 56, 0.8)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
              }}
            >
              <IonButton
                onClick={() => nav(-1)}
                fill="clear"
                style={{
                  flex: '0 0 auto',
                  minWidth: 0,
                  padding: 6,
                  borderRadius: 999,
                }}
              >
                <IonIcon
                  icon={chevronBackOutline}
                  style={{ color: '#F9FAFB', fontSize: 22 }}
                />
              </IonButton>

              <div
                style={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    textAlign: 'center',
                  }}
                >
                  {headerTitle}
                </span>
              </div>

              {/* Amber "Proposed" pill */}
              <div
                style={{
                  flex: '0 0 auto',
                  marginLeft: 10,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(245, 158, 11, 0.25)', // amber
                  color: 'rgba(245,158,11,0.97)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.7,
                  whiteSpace: 'nowrap',
                  background:
                    'radial-gradient(circle at top, rgba(245,158,11,0.18), transparent)',
                }}
              >
                Proposed
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        forceOverscroll={true}
        style={{
          '--background':
            'radial-gradient(circle at top, rgba(76,29,149,0.32), #050509 45%, #020109 100%)',
        }}
      >
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {renderBody()}
        </div>
      </IonContent>

      <IonAlert
        isOpen={showConvertAlert}
        onDidDismiss={() => {
          setShowConvertAlert(false);
          nav(-1);
        }}
        header="Converted!"
        message="This proposed gig has been converted to an event. Check your Events tab."
        buttons={['OK']}
      />

      {/* helper popup explaining voting */}
      {/* helper popup explaining voting */}
      <IonModal isOpen={showHelp} onDidDismiss={() => setShowHelp(false)}>
        <IonContent
          style={{
            '--background':
              'radial-gradient(circle at top,  rgba(34, 15, 42, 0.98), #020617 55%)',
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 360,
                borderRadius: 18,
                padding: 18,

                border: '1px solid rgba(245, 158, 11, 0.75)',
                boxShadow: '0 18px 60px rgba(0,0,0,0.9)',
              }}
            >
              <IonText>
                <p
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#FBBF24', // amber title
                  }}
                >
                  How Proposed Gigs Work
                </p>
              </IonText>

              <IonText color="light">
                <p
                  style={{
                    marginTop: 8,
                    marginBottom: 18,
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Each proposed date is a possible time for this gig.
                  <br />
                  <br />
                  Tap <strong>Yes</strong> for any dates that work for you, and{' '}
                  <strong>No</strong> for dates that don&apos;t.
                  <br />
                  <br />
                  When every member has said <strong>Yes</strong> to a time,
                  your band admin can convert that option into a confirmed event
                  in the Events tab.
                  <br />
                  <br />
                  All proposed gigs live on your band overview and in the
                  Proposals tab.
                </p>
              </IonText>

              <IonButton
                expand="block"
                onClick={() => setShowHelp(false)}
                style={{
                  '--background': 'rgba(15,23,42,0.98)',
                  '--background-activated': 'rgba(27, 124, 111, 1)',
                  '--border-color': 'rgba(45,212,191,0.8)',
                  '--color': 'rgba(45,212,191,0.95)',
                  borderRadius: 999,
                }}
              >
                Got it
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Dark delete popup */}
      <IonModal
        isOpen={showDeleteConfirm}
        onDidDismiss={() => !deleting && setShowDeleteConfirm(false)}
      >
        <IonContent
          style={{
            '--background':
              'radial-gradient(circle at top, rgba(76,29,149,0.4), #020617 55%)',
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 360,
                borderRadius: 18,
                padding: 18,
                background:
                  'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(3,7,18,0.98))',
                border: '1px solid rgba(248,113,113,0.6)',
                boxShadow: '0 18px 60px rgba(0,0,0,0.9)',
              }}
            >
              <IonText color="danger">
                <p
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  Delete proposed gig?
                </p>
              </IonText>
              <IonText>
                <p
                  style={{
                    marginTop: 8,
                    marginBottom: 16,
                    fontSize: 14,
                    color: '#E5E7EB',
                  }}
                >
                  This will remove the proposal and all its time options. This
                  can&apos;t be undone.
                </p>
              </IonText>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  disabled={deleting}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  color="danger"
                  disabled={deleting}
                  onClick={deleteProposal}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </IonButton>
              </div>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Edit proposed gig modal */}
      <IonModal
        isOpen={showEditProposal}
        onDidDismiss={() => {
          if (!savingProposal) setShowEditProposal(false);
        }}
      >
        <IonContent
          style={{
            '--background':
              'radial-gradient(circle at top, rgba(76,29,149,0.4), #020617 55%)',
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 360,
                borderRadius: 18,
                padding: 18,
                background:
                  'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(3,7,18,0.98))',
                border: '1px solid rgba(129,140,248,0.7)',
                boxShadow: '0 18px 60px rgba(0,0,0,0.9)',
              }}
            >
              <IonText>
                <p
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#EDEBFF',
                  }}
                >
                  Edit proposed gig
                </p>
              </IonText>

              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div>
                  <IonText color="medium">
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      Title
                    </p>
                  </IonText>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Proposed gig title"
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1px solid rgba(148,163,184,0.8)',
                      padding: 8,
                      backgroundColor: '#020617',
                      color: '#E5E7EB',
                    }}
                  />
                </div>

                <div>
                  <IonText color="medium">
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      Location
                    </p>
                  </IonText>
                  <input
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    placeholder="Venue / location"
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1px solid rgba(148,163,184,0.8)',
                      padding: 8,
                      backgroundColor: '#020617',
                      color: '#E5E7EB',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 18,
                }}
              >
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  disabled={savingProposal}
                  onClick={() => setShowEditProposal(false)}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  disabled={savingProposal}
                  onClick={saveProposalEdits}
                >
                  {savingProposal ? 'Saving…' : 'Save changes'}
                </IonButton>
              </div>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
}
