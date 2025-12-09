import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export function useAuthUser() {
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const userRef = useRef<any | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      setMyUserId(user?.id ?? null);
      userRef.current = user ?? null;
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { myUserId, userRef };
}
