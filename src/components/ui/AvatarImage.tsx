/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Avatar } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

type AvatarImageProps = {
  name: string;
  bucket?: string;
  avatarPath?: string;
  srcGuess?: string;
  size?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  sx?: SxProps<Theme>;
  signedUrlTTL?: number;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

const isAbsoluteUrl = (s?: string) => !!s && /^https?:\/\//i.test(s);

export default function AvatarImage({
  name,
  bucket,
  avatarPath,
  srcGuess,
  size,
  sx,
  signedUrlTTL = 3600,
}: AvatarImageProps) {
  const preferDirect = isAbsoluteUrl(srcGuess);
  const [signedUrl, setSignedUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (preferDirect) return;
      if (!bucket || !avatarPath) {
        setSignedUrl(undefined);
        return;
      }

      try {
        const sb = supabaseBrowser();
        const { data, error } = await sb.storage
          .from(bucket)
          .createSignedUrl(avatarPath, signedUrlTTL);

        if (cancelled) return;
        if (error) setSignedUrl(undefined);
        else setSignedUrl(data?.signedUrl);
      } catch {
        if (!cancelled) setSignedUrl(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preferDirect, bucket, avatarPath, signedUrlTTL]);

  const finalSrc = preferDirect ? srcGuess : signedUrl;

  const dims = useMemo(() => {
    if (typeof size === 'number') return { width: size, height: size };
    return size ?? undefined;
  }, [size]);

  return (
    <Avatar
      src={finalSrc}
      alt={name}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement & { src?: string }).src = '';
      }}
      sx={{
        ...(dims && { width: dims as any, height: dims as any }),
        ...sx,
      }}
    >
      {initials(name)}
    </Avatar>
  );
}
