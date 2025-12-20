/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import {
  getAvatarSigned,
  setAvatarSigned,
  type EventRow,
} from '../../../../lib/cache/eventInboxCache';

import { supabase } from '../../../../lib/supabase';

export function useSignedBandAvatar({ showAvatars }: { showAvatars: boolean }) {
  const renderAvatarInitials = (name?: string | null) => {
    const initials =
      name
        ?.split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || '?';

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 14,
          color: 'rgba(148, 163, 184, 0.9)',
          background: 'rgba(30, 41, 59, 0.8)',
        }}
      >
        {initials}
      </div>
    );
  };

  const getAvatar = useCallback(
    async (bandId: string, path: string | null | undefined) => {
      if (!showAvatars || !bandId || !path) return undefined;

      const cached = getAvatarSigned(bandId, path);
      if (cached) return cached;

      if (path.startsWith('http://') || path.startsWith('https://')) {
        setAvatarSigned(bandId, path, path, 60 * 60);
        return path;
      }

      let normalizedPath = path;
      if (normalizedPath.startsWith('band-avatars/')) {
        normalizedPath = normalizedPath.slice('band-avatars/'.length);
      }

      const { data, error } = await supabase.storage
        .from('band-avatars')
        .createSignedUrl(normalizedPath, 60 * 60);

      if (!error && data?.signedUrl) {
        setAvatarSigned(bandId, path, data.signedUrl, 60 * 60);
        return data.signedUrl;
      }

      return undefined;
    },
    [showAvatars]
  );

  const getAvatarSrc = (e: EventRow) => {
    if (!showAvatars) return undefined;
    const band = e.bands;
    if (!band?.id || !band.avatar_url) return undefined;

    const cached = getAvatarSigned(band.id, band.avatar_url);
    if (cached) return cached;

    void getAvatar(band.id, band.avatar_url);
    return undefined;
  };

  return { getAvatarSrc, renderAvatarInitials };
}
