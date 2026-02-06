import * as React from 'react';
import { supabase } from '../lib/supabase';

type VendorSummary = {
  id: string;
  name: string;
  is_public: boolean;
  subscription_status: string;
};

export function useUserVendor() {
  const [loading, setLoading] = React.useState(true);
  const [vendor, setVendor] = React.useState<VendorSummary | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadVendor = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, is_public, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        setVendor(data);
      } else {
        setVendor(null);
      }

      setLoading(false);
    };

    loadVendor();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, is_public, subscription_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setVendor(data);
    } else {
      setVendor(null);
    }
  }, []);

  return { loading, vendor, hasVendor: !!vendor, refresh };
}
