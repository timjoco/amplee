/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { getSignedAvatarUrl } from '@/lib/avatarCache';
import { Avatar } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';

type AvatarImageProps = {
  name: string;
  bucket?: string;
  avatarPath?: string; // storage path OR undefined
  srcGuess?: string; // https URL OR storage path (legacy)
  size?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  sx?: SxProps<Theme>;
  signedUrlTTL?: number;
  version?: string | number; // bump when profile changes
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
const isHttp = (s?: string | null) => !!s && /^https?:\/\//i.test(s || '');

export default function AvatarImage({
  name,
  bucket,
  avatarPath,
  srcGuess,
  size,
  sx,
  signedUrlTTL = 3600,
  version,
}: AvatarImageProps) {
  const [src, setSrc] = useState<string | undefined>(() =>
    isHttp(srcGuess) ? srcGuess : undefined
  );
  const lastGood = useRef<string | undefined>(src);

  // resolve once we know the best path to use
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) Direct URL? Use it and keep it.
      if (isHttp(srcGuess)) {
        if (!cancelled) {
          lastGood.current = srcGuess!;
          setSrc(srcGuess!);
        }
        return;
      }

      // 2) Storage path from props (prefer avatarPath, else srcGuess if it's a path)
      const pathToUse =
        avatarPath ?? (!isHttp(srcGuess) ? srcGuess : undefined);
      if (!bucket || !pathToUse) return; // don't clear; keep lastGood src to avoid flash

      // 3) Private bucket (signed URLs) — fetch from cache
      const signed = await getSignedAvatarUrl(
        bucket,
        pathToUse,
        signedUrlTTL,
        version
      );
      if (cancelled || !signed) return;

      // IMPORTANT: only update once we have a new URL → avoids blank → flash
      lastGood.current = signed;
      setSrc(signed);
    })();

    return () => {
      cancelled = true;
    };
    // re-run when inputs change (including version)
  }, [bucket, avatarPath, srcGuess, signedUrlTTL, version]);

  const dims = useMemo(() => {
    if (typeof size === 'number') return { width: size, height: size };
    return size ?? undefined;
  }, [size]);

  return (
    <Avatar
      src={src}
      alt={name}
      imgProps={{
        crossOrigin: 'anonymous',
        referrerPolicy: 'no-referrer',
        decoding: 'async',
      }}
      onError={() => {
        // If an error occurs, keep lastGood if any; otherwise initials will show.
        // We don't forcibly clear src to avoid flicker across rerenders.
      }}
      sx={{
        ...(dims && { width: dims as any, height: dims as any }),
        // Subtle fade-in when image first appears (masks swaps)
        '& img': { transition: 'opacity 120ms ease', opacity: src ? 1 : 0 },
        ...sx,
      }}
    >
      {initials(name)}
    </Avatar>
  );
}
