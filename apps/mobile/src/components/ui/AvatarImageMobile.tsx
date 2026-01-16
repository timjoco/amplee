// apps/mobile/src/components/ui/AvatarImageMobile.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  getAvatarUrl,
  getAvatarUrlSync,
} from '../../lib/cache/avatarUrlCache';

type Props = {
  name: string;
  bucket: string;
  avatarPath?: string;
  srcGuess?: string | null;
  updatedAt?: string | null;
  size?: number;
  style?: React.CSSProperties;
};

function isFullUrl(value: string | null | undefined): boolean {
  return (
    !!value && (value.startsWith('http://') || value.startsWith('https://'))
  );
}

export default function AvatarImageMobile({
  name,
  bucket,
  avatarPath,
  srcGuess,
  size = 36,
  style,
}: Props) {
  // Try sync cache first for instant render
  const cachedUrl = avatarPath ? getAvatarUrlSync(bucket, avatarPath) : null;
  const initialUrl = srcGuess && isFullUrl(srcGuess) ? srcGuess : cachedUrl;

  const [url, setUrl] = useState<string | null>(initialUrl);

  useEffect(() => {
    let cancelled = false;

    // 1) If caller already has a usable URL, just use that
    if (srcGuess && isFullUrl(srcGuess)) {
      setUrl(srcGuess);
      return;
    }

    if (!avatarPath) {
      setUrl(null);
      return;
    }

    // 2) If avatarPath itself is a full URL, use it directly
    if (isFullUrl(avatarPath)) {
      setUrl(avatarPath);
      return;
    }

    // 3) Check sync cache (already done in initial state, but recheck on deps change)
    const cached = getAvatarUrlSync(bucket, avatarPath);
    if (cached) {
      setUrl(cached);
      return;
    }

    // 4) Fetch from centralized cache (will sign URL if needed)
    (async () => {
      const signed = await getAvatarUrl(bucket, avatarPath);
      if (!cancelled) {
        setUrl(signed);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bucket, avatarPath, srcGuess]);

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
