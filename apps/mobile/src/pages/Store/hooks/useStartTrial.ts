import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { BandTrialRow } from '../types/subscriptionTypes';
import { TRIAL_DURATION_DAYS } from '../types/subscriptionTypes';

type StartTrialResult = {
  starting: boolean;
  error: string | null;
  startTrial: (bandId: string, productSlug: string) => Promise<BandTrialRow | null>;
};

/**
 * Hook to start a free trial for a band.
 * Only band admins can start trials.
 * Each band can only have one trial per product.
 */
export function useStartTrial(): StartTrialResult {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTrial = useCallback(async (bandId: string, productSlug: string) => {
    setStarting(true);
    setError(null);

    try {
      // Get the current user
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setError('You must be logged in to start a trial');
        return null;
      }

      // Get the product ID
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (productError || !product) {
        setError('Product not found');
        return null;
      }

      // Check if trial already exists
      const { data: existingTrial } = await supabase
        .from('band_trials')
        .select('id')
        .eq('band_id', bandId)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingTrial) {
        setError('This band has already used a trial for this feature');
        return null;
      }

      // Check if subscription already exists
      const { data: existingSub } = await supabase
        .from('band_subscriptions')
        .select('id')
        .eq('band_id', bandId)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingSub) {
        setError('This band already has a subscription for this feature');
        return null;
      }

      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TRIAL_DURATION_DAYS);

      // Create the trial
      const { data: trial, error: trialError } = await supabase
        .from('band_trials')
        .insert({
          band_id: bandId,
          product_id: product.id,
          started_by: userId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (trialError) {
        // Check for common errors
        if (trialError.code === '23505') {
          setError('This band has already used a trial for this feature');
        } else if (trialError.message?.includes('new row violates')) {
          setError('You must be a band admin to start a trial');
        } else {
          setError(trialError.message || 'Failed to start trial');
        }
        return null;
      }

      return trial as BandTrialRow;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start trial';
      setError(msg);
      return null;
    } finally {
      setStarting(false);
    }
  }, []);

  return { starting, error, startTrial };
}
