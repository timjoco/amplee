import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] =
    useState<
      Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
    >(null);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;

      // If user was deleted, clear the stale session
      if (error?.code === 'user_not_found') {
        supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) =>
      setSession(s)
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, session };
}
