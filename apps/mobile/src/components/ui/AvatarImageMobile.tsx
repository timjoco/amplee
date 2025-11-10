import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

export type AvatarImageMobileProps = {
  name: string;
  bucket: string;
  avatarPath?: string;
  srcGuess?: string;
  size?: number;
  style?: React.CSSProperties;
};

export default function AvatarImageMobile({
  name,
  bucket,
  avatarPath,
  srcGuess,
  size = 90,
  style,
}: AvatarImageMobileProps) {
  const [src, setSrc] = useState<string | undefined>(
    srcGuess && /^https?:\/\//.test(srcGuess) ? srcGuess : undefined
  );
  const lastGood = useRef<string | undefined>(src);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (srcGuess && /^https?:\/\//.test(srcGuess)) {
        if (!cancelled) setSrc(srcGuess);
        return;
      }

      const path = avatarPath ?? srcGuess;
      if (!bucket || !path) return;

      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      if (!cancelled && data?.signedUrl) {
        lastGood.current = data.signedUrl;
        setSrc(data.signedUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bucket, avatarPath, srcGuess]);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        letterSpacing: 0.5,
        color: '#fff',
        background:
          'radial-gradient(120% 120% at 20% 15%, rgba(139,92,246,0.16) 0%, transparent 55%)',
        border: '2px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}
