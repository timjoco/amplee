/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import type { ProfileRow } from '../types';

export function useProfile() {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [authUser, setAuthUser] = React.useState<any | null>(null);
  const [logoutAlertOpen, setLogoutAlertOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error(authErr);
        if (alive) {
          setError('Unable to load session');
          setLoading(false);
        }
        return;
      }

      const user = auth?.user ?? null;
      setAuthUser(user);

      if (!user) {
        if (alive) {
          setProfile(null);
          setError('You are not signed in.');
          setLoading(false);
        }
        return;
      }

      const uid = user.id;

      const { data, error: profErr } = await supabase
        .from('profiles')
        .select(
          `
        id,
        display_name,
        first_name,
        last_name,
        location,
        avatar_url
      `
        )
        .eq('id', uid)
        .maybeSingle();

      if (!alive) return;

      if (profErr) {
        console.error(profErr);
        setError('Unable to load profile.');
        setLoading(false);
        return;
      }

      setProfile({
        id: uid,
        display_name: data?.display_name ?? null,
        first_name: data?.first_name ?? null,
        last_name: data?.last_name ?? null,
        location: data?.location ?? null,
        avatar_url: data?.avatar_url ?? null,
      });

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleConfirmLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      nav('/login');
    }
  };

  return {
    loading,
    error,
    profile,
    authUser,
    logoutAlertOpen,
    setLogoutAlertOpen,
    handleConfirmLogout,
  };
}
