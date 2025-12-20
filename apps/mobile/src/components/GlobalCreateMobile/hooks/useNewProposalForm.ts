/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ShowToast } from './useNewBandForm';

/**
 * useNewProposalForm (GlobalCreateMobile)
 *
 * This hook powers the "New Proposal" step inside GlobalCreateMobile.
 *
 * How GlobalCreateMobile uses it:
 * - <NewProposalStep /> reads `title`, `venue` to render inputs
 * - <NewProposalStep /> calls setters (`setTitle`, `setVenue`, `setBandId`) on changes
 * - GlobalCreateMobile calls `submit()` when the user taps "Create"
 * - GlobalCreateMobile calls `reset()` inside closeAll() on modal dismiss/success
 *
 */
export function useNewProposalForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string | null) => void;
}) {
  const { showToast, onError } = opts;

  // ─────────────────────────────────────────────────────────────
  // Core proposal fields (bound to inputs in <NewProposalStep />)
  // ─────────────────────────────────────────────────────────────
  const [bandId, setBandId] = useState(''); // selected band the proposal belongs to
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');

  /**
   * Normalize user-entered text:
   * - trim edges
   * - collapse repeated whitespace
   * Helps keep DB data consistent without adding complexity.
   */
  const cleanText = useCallback(
    (s: string) => s.trim().replace(/\s+/g, ' '),
    []
  );

  /**
   * Resets local form state back to defaults.
   *
   * Used by GlobalCreateMobile.closeAll() when:
   * - modal is dismissed
   * - creation succeeds and we want a clean slate next open
   *
   * NOTE:
   * - We intentionally do NOT reset bandId here by default because GlobalCreateMobile
   *   often sets a default band when entering this step (goToStep).
   *   If you want it to always reset, add: setBandId('');
   */
  const reset = useCallback(() => {
    setTitle('');
    setVenue('');
  }, []);

  /**
   * Creates the proposal row in Supabase.
   *
   * Called by GlobalCreateMobile.handleSubmitCreateProposal():
   * - Returns proposalId (string) on success
   * - Returns null on validation failure or server error
   *
   * Server side effect:
   * - Inserts into `gig_proposals`
   */
  const submit = useCallback(async () => {
    if (!bandId) return showToast('Choose a band.'), null;

    const titleClean = cleanText(title);
    const venueClean = cleanText(venue);

    if (!titleClean) return showToast('Add a proposal title.'), null;

    try {
      // Clear shared modal error banner before attempting submit
      onError?.(null);

      // Auth required (created_by is set)
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        return showToast('Please sign in first.'), null;
      }

      const { data, error } = await supabase
        .from('gig_proposals')
        .insert({
          band_id: bandId,
          title: titleClean,
          venue: venueClean || null,
          created_by: userData.user.id,
        } as any)
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    } catch (e: any) {
      onError?.(String(e?.message ?? 'Could not create proposal'));
      return null;
    }
  }, [bandId, title, venue, cleanText, onError, showToast]);

  /**
   * Returned API is consumed by:
   * - <NewProposalStep /> for rendering/binding inputs (reads fields, calls setters)
   * - GlobalCreateMobile for submit/reset + navigation decisions
   */
  return {
    bandId,
    title,
    venue,

    setBandId,
    setTitle,
    setVenue,

    reset,
    submit,
  };
}
