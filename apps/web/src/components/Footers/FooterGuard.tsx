'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';
import Footer from './Footer';

export default function FooterGuard() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s?.user)
    );
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  if (authed !== false) return null;
  return <Footer />;
}
