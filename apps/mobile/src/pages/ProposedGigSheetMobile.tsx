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
  calendarOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  closeCircleOutline,
  createOutline,
  locationOutline,
  personOutline,
  trashOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import EventDateTimePicker from '../components/ui/EventDateTimePicker';
import {
  EventAvailabilityConflict,
  getEventAvailabilityConflicts,
} from '../lib/events/getEventAvailabilityConflicts';
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
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [showConvertAlert, setShowConvertAlert] = useState(false);
  const [proposedByName, setProposedByName] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditProposal, setShowEditProposal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [savingProposal, setSavingProposal] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingOptionDate, setEditingOptionDate] = useState<string | null>(
    null
  );
  type AvailabilityForOption = {
    conflicts: EventAvailabilityConflict[];
    conflictCount: number;
  };

  const [availabilityByOptionId, setAvailabilityByOptionId] = useState<
    Record<string, AvailabilityForOption>
  >({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const fetchAvailabilityForOptions = useCallback(
    async (opts: Option[]) => {
      if (!bandId) return;

      setLoadingAvailability(true);
      try {
        const entries = await Promise.all(
          opts.map(async (o) => {
            const startsAt = new Date(o.starts_at);
            if (Number.isNaN(startsAt.getTime())) {
              return [
                o.id,
                { conflicts: [], conflictCount: 0 } as AvailabilityForOption,
              ] as const;
            }

            const conflicts = await getEventAvailabilityConflicts({
              bandId,
              startsAt,
            });

            return [
              o.id,
              { conflicts, conflictCount: conflicts.length },
            ] as const;
          })
        );

        setAvailabilityByOptionId(Object.fromEntries(entries));
      } catch (e) {
        console.warn('[proposal availability] failed', e);
        setAvailabilityByOptionId({});
      } finally {
        setLoadingAvailability(false);
      }
    },
    [bandId]
  );

  const fetchData = useCallback(async () => {
    if (!bandId || !proposalId) return;

    try {
      setLoading(true);
      setError(null);

      // 1) auth first
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const uid = user?.id ?? '';
      setMyId(uid || null);

      // 2) fetch everything else in parallel
      const [membersResult, propResult, myMemberResult] = await Promise.all([
        supabase
          .from('band_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('band_id', bandId),
        supabase
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
          .maybeSingle(),
        uid
          ? supabase
              .from('band_members')
              .select('role')
              .eq('band_id', bandId)
              .eq('user_id', uid)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
      ]);

      setMembersCount(membersResult.count ?? 0);

      // ✅ real admin check
      setIsAdmin(myMemberResult.data?.role === 'admin');

      if (propResult.error) throw propResult.error;
      const data = propResult.data;

      if (!data) {
        setError('Proposal not found');
        setProposal(null);
        return;
      }

      const options: Option[] = (data.gig_proposal_options ?? []).map(
        (o: any) => {
          const votes = o.gig_proposal_votes ?? [];
          return {
            id: o.id,
            starts_at: o.starts_at,
            yes: votes.filter((v: any) => v.vote === 'yes').length,
            no: votes.filter((v: any) => v.vote === 'no').length,
            myVote: votes.find((v: any) => v.user_id === uid)?.vote,
          };
        }
      );

      const sortedOptions = sortOptionsByDate(options);
      void fetchAvailabilityForOptions(sortedOptions);
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
        options: sortedOptions,
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [bandId, proposalId, fetchAvailabilityForOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function vote(optionId: string, voteVal: 'yes' | 'no') {
    if (!proposalId || !myId) {
      console.error('No user id or proposal id available for vote');
      return;
    }

    try {
      setSaving(true);

      await supabase.from('gig_proposal_votes').upsert(
        {
          proposal_id: proposalId,
          option_id: optionId,
          user_id: myId,
          vote: voteVal,
        },
        { onConflict: 'proposal_id,option_id,user_id' }
      );

      // Update local state instead of refetching
      setProposal((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          options: prev.options.map((o) => {
            if (o.id !== optionId) return o;

            let yes = o.yes;
            let no = o.no;

            // remove previous vote impact
            if (o.myVote === 'yes') yes--;
            if (o.myVote === 'no') no--;

            // add new vote
            if (voteVal === 'yes') yes++;
            if (voteVal === 'no') no++;

            return {
              ...o,
              yes,
              no,
              myVote: voteVal,
            };
          }),
        };
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function addOption(iso: string | null) {
    try {
      if (!iso || !proposalId) return;
      setSaving(true);

      const { data: inserted, error: insertErr } = await supabase
        .from('gig_proposal_options')
        .insert({
          proposal_id: proposalId,
          starts_at: iso,
        })
        .select('id, starts_at')
        .single();

      if (insertErr) throw insertErr;

      setNewDate(null);

      if (inserted) {
        setProposal((prev) => {
          if (!prev) return prev;

          const updatedOptions = [
            ...prev.options,
            {
              id: inserted.id,
              starts_at: inserted.starts_at,
              yes: 0,
              no: 0,
            },
          ];

          // Sort options by date
          const sortedOptions = sortOptionsByDate(updatedOptions);
          void fetchAvailabilityForOptions(sortedOptions);

          return {
            ...prev,
            options: sortedOptions, // ← Use sorted options
          };
        });
      }
    } catch (e: any) {
      console.error(e);
      setError('Failed to add date option');
    } finally {
      setSaving(false);
    }
  }

  async function convert(optionId: string) {
    try {
      if (!proposal) {
        throw new Error('No proposal loaded');
      }
      if (!myId) {
        throw new Error('Not signed in');
      }

      const opt = proposal.options.find((o) => o.id === optionId);
      if (!opt) {
        throw new Error('Option not found for this proposal');
      }

      setError(null);
      setConverting(optionId);

      const { error: insErr } = await supabase.from('events').insert({
        band_id: bandId,
        title: proposal.title ?? 'Show',
        location: proposal.venue ?? null,
        starts_at: opt.starts_at,
        type: 'show',
        is_cancelled: false,
        created_by: myId,
      });

      if (insErr) {
        throw insErr;
      }

      // delete proposal
      await supabase.from('gig_proposals').delete().eq('id', proposal.id);

      // show the alert; navigation handled in onDidDismiss
      setShowConvertAlert(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to convert to event');
    } finally {
      setConverting(null);
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

      // remove from local state instead of refetching
      setProposal((prev) => {
        if (!prev) return prev;

        const nextOptions = prev.options.filter((o) => o.id !== optionId);

        // ✅ refresh availability after option removed
        void fetchAvailabilityForOptions(nextOptions);

        return {
          ...prev,
          options: nextOptions,
        };
      });
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

  function sortOptionsByDate(options: Option[]): Option[] {
    return [...options].sort((a, b) => {
      const dateA = new Date(a.starts_at).getTime();
      const dateB = new Date(b.starts_at).getTime();
      return dateA - dateB;
    });
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
    setEditingOptionDate(option.starts_at);
    setShowEditDatePicker(true);
  }

  async function saveOptionEdit(iso: string | null) {
    if (!editingOptionId || !iso) {
      setEditingOptionId(null);
      setEditingOptionDate(null);
      return;
    }

    try {
      setSaving(true);

      const { error: updErr } = await supabase
        .from('gig_proposal_options')
        .update({ starts_at: iso })
        .eq('id', editingOptionId);

      if (updErr) throw updErr;

      // update local state instead of refetching
      setProposal((prev) => {
        if (!prev) return prev;

        const updatedOptions = prev.options.map((o) =>
          o.id === editingOptionId ? { ...o, starts_at: iso } : o
        );

        // Sort options by date after updating
        const sortedOptions = sortOptionsByDate(updatedOptions);
        void fetchAvailabilityForOptions(sortedOptions);

        return {
          ...prev,
          options: sortedOptions, // ← Use sorted options
        };
      });

      setEditingOptionId(null);
      setEditingOptionDate(null);
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
          <IonSpinner
            name="crescent"
            style={{ color: 'rgba(251, 191, 36, 0.95)' }}
          />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: 16 }}>
          <div
            style={{
              borderRadius: 16,
              padding: 16,
              background:
                'linear-gradient(135deg, rgba(127, 29, 29, 0.2), rgba(127, 29, 29, 0.1))',
              border: '1px solid rgba(248,113,113,0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <IonText color="danger">
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
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

    const locationText = proposal.venue?.trim() || 'Location TBD';
    const proposedByText = proposal.created_by
      ? proposal.created_by === myId
        ? 'You'
        : proposedByName || 'Bandmate'
      : 'Unknown';

    // Highest YES percentage across options
    // In case of tie, choose the earliest date
    const bestYes =
      membersCount > 0 && proposal.options.length > 0
        ? proposal.options.reduce(
            (acc, o) => {
              const pct = (o.yes / membersCount) * 100;
              // If this option has more yes votes, it wins
              if (pct > acc.pct) {
                return { pct, yes: o.yes, option: o };
              }
              // If tied, choose the earlier date (tie-breaker)
              if (pct === acc.pct && acc.option) {
                const thisDate = new Date(o.starts_at);
                const accDate = new Date(acc.option.starts_at);
                if (thisDate < accDate) {
                  return { pct, yes: o.yes, option: o };
                }
              }
              return acc;
            },
            { pct: 0, yes: 0, option: null as Option | null }
          )
        : { pct: 0, yes: 0, option: null as Option | null };

    const bestYesPct = Math.round(bestYes.pct);

    // Format the best date for display
    const bestDateLabel = bestYes.option
      ? new Date(bestYes.option.starts_at).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      : null;

    return (
      <div
        style={{
          padding: '16px 16px 80px 16px',
          background:
            'linear-gradient(180deg, rgba(5,5,9,0) 0%, rgba(5,5,9,0.3) 100%)',
        }}
      >
        {/* STATS HEADER */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(251, 191, 36, 0.04))',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'rgba(251, 191, 36, 0.95)',
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {bestYes.yes}/{membersCount}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: bestDateLabel ? 8 : 0,
              }}
            >
              Front Runner
            </div>
            {bestDateLabel && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(251, 191, 36, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IonIcon icon={calendarOutline} style={{ fontSize: 14 }} />
                {bestDateLabel}
              </div>
            )}
          </div>

          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: `conic-gradient(
                rgba(251, 191, 36, 0.8) 0% ${bestYesPct}%, 
                rgba(15, 23, 42, 0.8) ${bestYesPct}% 100%
              )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: 'rgba(251, 191, 36, 0.95)',
              }}
            >
              {bestYesPct}%
            </div>
          </div>
        </div>

        {/* GIG DETAILS CARD */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background:
                  'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IonIcon
                icon={calendarOutline}
                style={{
                  fontSize: 20,
                  color: 'rgba(251, 191, 36, 0.95)',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Proposed Gig
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#e5e7eb',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {proposal.title || 'Proposed Gig'}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon
                icon={locationOutline}
                style={{ fontSize: 16, color: 'rgba(251, 191, 36, 0.7)' }}
              />
              <span style={{ fontSize: 14, color: '#9ca3af' }}>
                {locationText}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon
                icon={personOutline}
                style={{ fontSize: 16, color: 'rgba(251, 191, 36, 0.7)' }}
              />
              <span style={{ fontSize: 14, color: '#9ca3af' }}>
                Proposed by {proposedByText}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                display: 'flex',
                gap: 8,
              }}
            >
              <IonButton
                size="small"
                fill="outline"
                expand="block"
                style={
                  {
                    flex: 1,
                    '--border-color': 'rgba(251, 191, 36, 0.5)',
                    '--color': 'rgba(251, 191, 36, 0.95)',
                    '--background-activated': 'rgba(251, 191, 36, 0.15)',
                    borderRadius: 12,
                  } as any
                }
                onClick={startEditProposal}
              >
                <IonIcon icon={createOutline} slot="start" />
                Edit
              </IonButton>
              <IonButton
                size="small"
                fill="outline"
                style={
                  {
                    '--border-color': 'rgba(248, 113, 113, 0.5)',
                    '--color': 'rgba(248, 113, 113, 0.95)',
                    '--background-activated': 'rgba(248, 113, 113, 0.15)',
                    borderRadius: 12,
                  } as any
                }
                onClick={() => setShowDeleteConfirm(true)}
              >
                <IonIcon icon={trashOutline} slot="icon-only" />
              </IonButton>
            </div>
          )}
        </div>

        {/* DATE OPTIONS */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: 16,
            padding: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 14,
              fontSize: 15,
              fontWeight: 700,
              color: 'rgba(251, 191, 36, 0.95)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            📅 Vote on Dates
          </h3>

          {proposal.options.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))',
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <IonIcon
                  icon={calendarOutline}
                  style={{ fontSize: 28, color: 'rgba(251, 191, 36, 0.95)' }}
                />
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>
                No date options yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {proposal.options.map((o) => {
                const allYes =
                  membersCount > 0 && o.yes === membersCount && o.no === 0;

                const dt = new Date(o.starts_at);
                const label = dt.toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });
                const avail = availabilityByOptionId[o.id];
                const conflictCount = avail?.conflictCount;

                const isCheckingThis = conflictCount == null;

                let slidingRef: HTMLIonItemSlidingElement | null = null;

                return (
                  <IonItemSliding
                    key={o.id}
                    ref={(el) => {
                      slidingRef = el;
                    }}
                    disabled={!isAdmin}
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
                          position: 'relative',
                          width: '100%',
                          borderRadius: 14,
                          padding: 14,
                          background: allYes
                            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.08))'
                            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9))',
                          border: allYes
                            ? '1px solid rgba(52, 211, 153, 0.4)'
                            : '1px solid rgba(148, 163, 184, 0.2)',
                          paddingRight: isAdmin ? 24 : 14,
                        }}
                      >
                        {isAdmin && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              bottom: 8,
                              right: 0,
                              width: 6,
                              background: 'rgba(251, 191, 36, 0.4)',
                              borderTopLeftRadius: 4,
                              borderBottomLeftRadius: 4,
                            }}
                          />
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#e5e7eb',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {label}
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 10px',
                                borderRadius: 999,
                                border: isCheckingThis
                                  ? '1px solid rgba(148, 163, 184, 0.25)'
                                  : conflictCount > 0
                                  ? '1px solid rgba(248, 113, 113, 0.25)'
                                  : '1px solid rgba(52, 211, 153, 0.25)',
                                background: isCheckingThis
                                  ? 'rgba(148, 163, 184, 0.06)'
                                  : conflictCount > 0
                                  ? 'rgba(248, 113, 113, 0.08)'
                                  : 'rgba(52, 211, 153, 0.08)',
                                color: isCheckingThis
                                  ? 'rgba(148, 163, 184, 0.85)'
                                  : conflictCount > 0
                                  ? 'rgba(248, 113, 113, 0.9)'
                                  : 'rgba(52, 211, 153, 0.9)',
                                fontSize: 12.5,
                                fontWeight: 700,
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isCheckingThis ? (
                                <>
                                  <IonSpinner
                                    name="dots"
                                    style={{ width: 16, height: 16 }}
                                  />
                                  Availability
                                </>
                              ) : (
                                <>
                                  <IonIcon
                                    icon={
                                      conflictCount > 0
                                        ? closeCircleOutline
                                        : checkmarkCircleOutline
                                    }
                                    style={{ fontSize: 14 }}
                                  />
                                  {conflictCount > 0
                                    ? `${conflictCount} unavailable`
                                    : 'All available'}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => vote(o.id, 'yes')}
                            disabled={saving}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              borderRadius: 10,
                              border:
                                o.myVote === 'yes'
                                  ? '2px solid rgba(251, 191, 36, 0.6)'
                                  : '1px solid rgba(251, 191, 36, 0.3)',
                              background:
                                o.myVote === 'yes'
                                  ? 'rgba(251, 191, 36, 0.95)'
                                  : 'rgba(15, 23, 42, 0.8)',
                              color:
                                o.myVote === 'yes'
                                  ? '#000000'
                                  : 'rgba(251, 191, 36, 0.95)',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              transition: 'all 0.2s',
                            }}
                          >
                            <IonIcon
                              icon={checkmarkCircleOutline}
                              style={{ fontSize: 16 }}
                            />
                            Yes ({o.yes})
                          </button>

                          <button
                            type="button"
                            onClick={() => vote(o.id, 'no')}
                            disabled={saving}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              borderRadius: 10,
                              border:
                                o.myVote === 'no'
                                  ? '2px solid rgba(248, 113, 113, 0.6)'
                                  : '1px solid rgba(248, 113, 113, 0.3)',
                              background:
                                o.myVote === 'no'
                                  ? 'rgba(248, 113, 113, 0.95)'
                                  : 'rgba(15, 23, 42, 0.8)',
                              color:
                                o.myVote === 'no'
                                  ? '#000000'
                                  : 'rgba(248, 113, 113, 0.95)',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              transition: 'all 0.2s',
                            }}
                          >
                            <IonIcon
                              icon={closeCircleOutline}
                              style={{ fontSize: 16 }}
                            />
                            No ({o.no})
                          </button>
                        </div>

                        {isAdmin && allYes && (
                          <button
                            type="button"
                            onClick={() => convert(o.id)}
                            disabled={saving || converting === o.id}
                            style={{
                              width: '100%',
                              marginTop: 12,
                              padding: '12px 14px',
                              borderRadius: 10,
                              border: '1px solid rgba(52, 211, 153, 0.5)',
                              background: 'rgba(52, 211, 153, 0.95)',
                              color: '#000000',
                              fontSize: 14,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                            }}
                          >
                            {converting === o.id ? (
                              <IonSpinner
                                name="crescent"
                                style={{ width: 16, height: 16 }}
                              />
                            ) : (
                              '✓ Convert to Event'
                            )}
                          </button>
                        )}
                      </div>
                    </IonItem>

                    {isAdmin && (
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
                              gap: 8,
                            }}
                          >
                            <IonButton
                              size="small"
                              fill="solid"
                              onClick={() => {
                                startEditOption(o);
                                slidingRef?.closeOpened?.();
                              }}
                              style={
                                {
                                  '--background': 'rgba(15, 23, 42, 0.95)',
                                  '--color': 'rgba(251, 191, 36, 0.95)',
                                  borderRadius: 10,
                                } as any
                              }
                            >
                              <IonIcon icon={createOutline} slot="start" />
                              Edit
                            </IonButton>

                            <IonButton
                              size="small"
                              fill="solid"
                              onClick={() => {
                                slidingRef?.closeOpened?.();
                                deleteOption(o.id);
                              }}
                              style={
                                {
                                  '--background': 'rgba(127, 29, 29, 0.95)',
                                  '--color': '#fecaca',
                                  borderRadius: 10,
                                } as any
                              }
                            >
                              <IonIcon icon={trashOutline} slot="start" />
                              Delete
                            </IonButton>
                          </div>
                        </IonItemOption>
                      </IonItemOptions>
                    )}
                  </IonItemSliding>
                );
              })}
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: 16 }}>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowAddDatePicker(true)}
                disabled={saving}
                style={
                  {
                    '--border-color': 'rgba(251, 191, 36, 0.5)',
                    '--color': 'rgba(251, 191, 36, 0.95)',
                    '--background-activated': 'rgba(251, 191, 36, 0.15)',
                    borderRadius: 12,
                  } as any
                }
              >
                <IonIcon icon={addCircleOutline} slot="start" />
                Add Date Option
              </IonButton>
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
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </IonButton>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#F9FAFB',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {headerTitle}
            </div>

            <div
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                background:
                  'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: 'rgba(251, 191, 36, 0.95)',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Proposed
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {renderBody()}
      </IonContent>

      {/* Add Date Picker */}
      <EventDateTimePicker
        open={showAddDatePicker}
        label="Add Date Option"
        value={newDate || undefined}
        onChange={(iso) => {
          if (iso) {
            addOption(iso);
          }
          setShowAddDatePicker(false);
        }}
        onDismiss={() => setShowAddDatePicker(false)}
      />

      {/* Edit Date Picker */}
      <EventDateTimePicker
        open={showEditDatePicker}
        label="Edit Date Option"
        value={editingOptionDate || undefined}
        onChange={(iso) => {
          saveOptionEdit(iso);
          setShowEditDatePicker(false);
        }}
        onDismiss={() => {
          setShowEditDatePicker(false);
          setEditingOptionId(null);
          setEditingOptionDate(null);
        }}
      />

      <IonAlert
        isOpen={showConvertAlert}
        onDidDismiss={() => {
          setShowConvertAlert(false);
          if (bandId) {
            nav(`/bands/${bandId}`);
            window.dispatchEvent(
              new CustomEvent('amplee:band-tab', {
                detail: { tab: 'events' },
              })
            );
          } else {
            nav(-1);
          }
        }}
        header="✓ Converted!"
        cssClass="custom-dark-alert delete-event-alert"
        message="This proposed gig is now a confirmed event."
        buttons={['OK']}
      />

      <IonModal
        isOpen={showDeleteConfirm}
        onDidDismiss={() => !deleting && setShowDeleteConfirm(false)}
      >
        <IonContent
          style={{
            '--background':
              'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
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
                borderRadius: 20,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'rgba(248, 113, 113, 0.95)',
                }}
              >
                Delete Proposal?
              </h3>
              <p
                style={{
                  margin: 0,
                  marginBottom: 20,
                  fontSize: 15,
                  color: '#9ca3af',
                  lineHeight: 1.5,
                }}
              >
                This will remove the proposal and all date options. This action
                cannot be undone.
              </p>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <button
                  type="button"
                  disabled={deleting}
                  onClick={deleteProposal}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(248, 113, 113, 0.5)',
                    background: 'rgba(248, 113, 113, 0.95)',
                    color: '#000000',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#9ca3af',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </IonContent>
      </IonModal>

      <IonModal
        isOpen={showEditProposal}
        onDidDismiss={() => {
          if (!savingProposal) setShowEditProposal(false);
        }}
      >
        <IonContent
          style={{
            '--background':
              'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
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
                maxWidth: 380,
                borderRadius: 20,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: 20,
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'rgba(251, 191, 36, 0.95)',
                }}
              >
                Edit Proposal
              </h3>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                    }}
                  >
                    Title
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Gig title"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      padding: 12,
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#e5e7eb',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                    }}
                  >
                    Location
                  </label>
                  <input
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    placeholder="Venue"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      padding: 12,
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#e5e7eb',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <button
                  type="button"
                  disabled={savingProposal}
                  onClick={saveProposalEdits}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(251, 191, 36, 0.5)',
                    background: 'rgba(251, 191, 36, 0.95)',
                    color: '#000000',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {savingProposal ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  disabled={savingProposal}
                  onClick={() => setShowEditProposal(false)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#9ca3af',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
}
