// apps/mobile/src/components/ui/AvatarImageMobile.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Props = {
  name: string;
  bucket: string;
  avatarPath?: string;
  srcGuess?: string | null;
  updatedAt?: string | null;
  size?: number;
  style?: React.CSSProperties;
};

const avatarUrlCache = new Map<string, string>();

function buildKey(bucket: string, path: string, updatedAt?: string | null) {
  return `${bucket}:${path}:${updatedAt ?? ''}`;
}

export default function AvatarImageMobile({
  name,
  bucket,
  avatarPath,
  srcGuess,
  updatedAt,
  size = 36,
  style,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const isFullUrl = (value: string | null | undefined) =>
      !!value && (value.startsWith('http://') || value.startsWith('https://'));

    // 1) If caller already has a usable URL, just use that and skip storage
    if (srcGuess && isFullUrl(srcGuess)) {
      setUrl(srcGuess);
      return;
    }

    if (!avatarPath) {
      setUrl(null);
      return;
    }

    // 2) If avatarPath itself is a full URL, also use it directly
    if (isFullUrl(avatarPath)) {
      setUrl(avatarPath);
      return;
    }

    // 3) avatarPath is a relative path inside the bucket → sign it

    const key = buildKey(bucket, avatarPath, updatedAt);
    const cached = avatarUrlCache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }

    (async () => {
      // Optional: normalize if you ever accidentally store "bucket/bucket/..."
      let normalizedPath = avatarPath;
      if (normalizedPath.startsWith(`${bucket}/`)) {
        normalizedPath = normalizedPath.slice(bucket.length + 1);
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(normalizedPath, 60 * 60 * 24); // ✅ number, 24h

      if (error) {
        console.warn('[avatar signedUrl error]', {
          error,
          bucket,
          avatarPath,
          normalizedPath,
        });
        if (!cancelled) setUrl(null);
        return;
      }

      const signed = data?.signedUrl ?? null;
      if (!cancelled && signed) {
        avatarUrlCache.set(key, signed);
        setUrl(signed);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bucket, avatarPath, srcGuess, updatedAt]);

  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || '?';

  const dim = size;

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: '999px',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(168,85,247,0.4), rgba(15,23,42,1))',
        border: '1px solid rgba(148,163,184,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dim * 0.4,
        color: '#E5E7EB',
        ...style,
      }}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
