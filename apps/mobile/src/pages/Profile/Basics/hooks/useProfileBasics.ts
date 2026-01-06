/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

import { supabase } from '../../../../lib/supabase';
import type { ProfileRow } from '../types';

export function useProfileBasics() {
  const [loading, setLoading] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [authUser, setAuthUser] = React.useState<any | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Load profile on mount
  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user ?? null;

      if (!user) {
        if (alive) setError('You are not signed in.');
        setLoading(false);
        return;
      }

      setAuthUser(user);
      const uid = user.id;
      const fallbackName = user.user_metadata?.full_name ?? user.email ?? '';

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

      const row: ProfileRow = {
        id: uid,
        display_name: data?.display_name ?? null,
        first_name: data?.first_name ?? null,
        last_name: data?.last_name ?? null,
        location: data?.location ?? null,
        avatar_url: data?.avatar_url ?? null,
      };

      setProfile(row);
      setDisplayName(
        row.display_name ??
          [row.first_name, row.last_name].filter(Boolean).join(' ') ??
          fallbackName ??
          ''
      );
      setFirstName(row.first_name ?? '');
      setLastName(row.last_name ?? '');
      setLocation(row.location ?? '');
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Computed display name
  const computedDisplayName = React.useMemo(() => {
    if (displayName.trim()) return displayName.trim();
    const names = [firstName, lastName]
      .filter(Boolean)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length) return names.join(' ');
    const metaName = authUser?.user_metadata?.full_name as string | undefined;
    if (metaName && metaName.trim()) return metaName;
    const email = authUser?.email as string | undefined;
    if (email) return email;
    return 'Your profile';
  }, [displayName, firstName, lastName, authUser]);

  // Save profile handler
  const onSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        location: location.trim() || null,
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setToastMessage('Profile updated successfully');

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
            }
          : prev
      );

      (document.activeElement as HTMLElement | null)?.blur?.();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  return {
    loading,
    savingProfile,
    saveSuccess,
    error,
    profile,
    setProfile,
    displayName,
    setDisplayName,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    location,
    setLocation,
    toastMessage,
    setToastMessage,
    computedDisplayName,
    onSaveProfile,
    setError,
  };
}
