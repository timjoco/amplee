/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getEventAvailabilityConflicts } from '../../../lib/events/getEventAvailabilityConflicts';
import { supabase } from '../../../lib/supabase';
import type { AvailabilityForOption, Option, Proposal, RouteParams } from '../types';
import { sortOptionsByDate } from '../utils';

export function useProposalData() {
  const nav = useNavigate();
  const { bandId, proposalId } = useParams<RouteParams>();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposedByName, setProposedByName] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingProposal, setSavingProposal] = useState(false);

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

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const uid = user?.id ?? '';
      setMyId(uid || null);

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

      setProposal((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          options: prev.options.map((o) => {
            if (o.id !== optionId) return o;

            let yes = o.yes;
            let no = o.no;

            if (o.myVote === 'yes') yes--;
            if (o.myVote === 'no') no--;

            if (voteVal === 'yes') yes++;
            if (voteVal === 'no') no++;

            return { ...o, yes, no, myVote: voteVal };
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
        .insert({ proposal_id: proposalId, starts_at: iso })
        .select('id, starts_at')
        .single();

      if (insertErr) throw insertErr;

      if (inserted) {
        setProposal((prev) => {
          if (!prev) return prev;

          const updatedOptions = [
            ...prev.options,
            { id: inserted.id, starts_at: inserted.starts_at, yes: 0, no: 0 },
          ];

          const sortedOptions = sortOptionsByDate(updatedOptions);
          void fetchAvailabilityForOptions(sortedOptions);

          return { ...prev, options: sortedOptions };
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
      if (!proposal) throw new Error('No proposal loaded');
      if (!myId) throw new Error('Not signed in');
      if (!bandId) throw new Error('Missing bandId');

      const opt = proposal.options.find((o) => o.id === optionId);
      if (!opt) throw new Error('Option not found for this proposal');

      setError(null);
      setConverting(optionId);

      const { data: created, error: insErr } = await supabase
        .from('events')
        .insert({
          band_id: bandId,
          title: proposal.title ?? 'Show',
          location: proposal.venue ?? null,
          starts_at: opt.starts_at,
          type: 'show',
          is_cancelled: false,
          created_by: myId,
        })
        .select('id')
        .single();

      if (insErr) throw insErr;

      const eventId = created?.id;
      if (!eventId) throw new Error('Event insert did not return an id');

      const { data: members, error: memErr } = await supabase
        .from('band_members')
        .select('user_id')
        .eq('band_id', bandId);

      if (memErr) throw memErr;

      const memberIds = (members ?? [])
        .map((m: any) => m.user_id)
        .filter(Boolean);

      if (memberIds.length > 0) {
        const rows = memberIds.map((user_id: string) => ({
          event_id: eventId,
          user_id,
          status: 'pending',
          needs_sub: false,
          sub_reason: '',
        }));

        const { error: emErr } = await supabase
          .from('event_members')
          .insert(rows);
        if (emErr) throw emErr;
      }

      await supabase.from('gig_proposals').delete().eq('id', proposal.id);

      return { success: true, bandId };
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to convert to event');
      return { success: false };
    } finally {
      setConverting(null);
    }
  }

  async function deleteProposal() {
    try {
      if (!bandId || !proposalId) return false;
      setDeleting(true);

      const { error: delErr } = await supabase
        .from('gig_proposals')
        .delete()
        .eq('id', proposalId)
        .eq('band_id', bandId);

      if (delErr) throw delErr;

      nav(-1);
      return true;
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to delete proposal');
      return false;
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

      setProposal((prev) => {
        if (!prev) return prev;

        const nextOptions = prev.options.filter((o) => o.id !== optionId);
        void fetchAvailabilityForOptions(nextOptions);

        return { ...prev, options: nextOptions };
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to delete date option');
    } finally {
      setSaving(false);
    }
  }

  async function saveProposalEdits(editTitle: string, editVenue: string) {
    if (!proposal || !bandId) return false;

    try {
      setSavingProposal(true);

      const updates = {
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
        prev ? { ...prev, title: updates.title, venue: updates.venue } : prev
      );
      return true;
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to update proposed gig');
      return false;
    } finally {
      setSavingProposal(false);
    }
  }

  async function saveOptionEdit(optionId: string, iso: string) {
    try {
      setSaving(true);

      const { error: updErr } = await supabase
        .from('gig_proposal_options')
        .update({ starts_at: iso })
        .eq('id', optionId);

      if (updErr) throw updErr;

      setProposal((prev) => {
        if (!prev) return prev;

        const updatedOptions = prev.options.map((o) =>
          o.id === optionId ? { ...o, starts_at: iso } : o
        );

        const sortedOptions = sortOptionsByDate(updatedOptions);
        void fetchAvailabilityForOptions(sortedOptions);

        return { ...prev, options: sortedOptions };
      });

      return true;
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to update date option');
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    // Params
    bandId,
    proposalId,
    nav,
    // State
    proposal,
    membersCount,
    myId,
    loading,
    saving,
    error,
    proposedByName,
    converting,
    deleting,
    isAdmin,
    savingProposal,
    availabilityByOptionId,
    loadingAvailability,
    // Actions
    vote,
    addOption,
    convert,
    deleteProposal,
    deleteOption,
    saveProposalEdits,
    saveOptionEdit,
  };
}
