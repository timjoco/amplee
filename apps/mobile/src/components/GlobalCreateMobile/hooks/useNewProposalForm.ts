/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ShowToast } from './useNewBandForm';

export function useNewProposalForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string | null) => void;
}) {
  const { showToast, onError } = opts;

  const [bandId, setBandId] = useState('');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');

  const reset = useCallback(() => {
    setTitle('');
    setVenue('');
  }, []);

  const submit = useCallback(async () => {
    if (!bandId) return showToast('Choose a band.'), null;
    if (!title.trim()) return showToast('Add a proposal title.'), null;

    try {
      onError?.(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user)
        return showToast('Please sign in first.'), null;

      const { data, error } = await supabase
        .from('gig_proposals')
        .insert({
          band_id: bandId,
          title: title.trim(),
          venue: venue.trim() || null,
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
  }, [bandId, title, venue, onError, showToast]);

  return { bandId, title, venue, setBandId, setTitle, setVenue, reset, submit };
}
