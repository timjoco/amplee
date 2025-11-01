'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  userId?: string;
  initialUrl?: string | null; // current profiles.avatar_url (public URL)
  onSaved?: (url: string) => void;
  compact?: boolean;
};

export default function ProfileAvatarCard({
  userId,
  initialUrl,
  onSaved,
  compact,
}: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialUrl !== undefined) setUrl(initialUrl ?? null);
  }, [initialUrl]);

  const onPick = () => fileRef.current?.click();

  const onFile = async (file?: File | null) => {
    if (!userId || !file) return;

    setLoading(true);
    try {
      // optional: validate mime type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please choose an image file.');
      }

      // path: userId/timestamp-filename (avoid collisions)
      const path = `${userId}/${Date.now()}-${file.name}`;

      // upload
      const { error: upErr } = await sb.storage
        .from('profile-avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (upErr) throw upErr;

      // if bucket is public, get public URL
      const { data: pub } = sb.storage
        .from('profile-avatars')
        .getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      // save to profiles.avatar_url (store URL for convenience)
      const { error: upProfileErr } = await sb
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (upProfileErr) throw upProfileErr;

      setUrl(publicUrl);
      onSaved?.(publicUrl);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Box
      sx={(t) => ({
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      })}
    >
      <Stack spacing={compact ? 1.5 : 2}>
        <Typography variant="h6" fontWeight={800} letterSpacing={0.2}>
          Profile picture
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={url ?? undefined}
            alt="Profile avatar"
            sx={{
              width: compact ? 64 : 96,
              height: compact ? 64 : 96,
              border: '2px solid',
              borderColor: 'rgba(255,255,255,0.12)',
              fontWeight: 800,
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={onPick}
              disabled={loading || !userId}
              sx={{ borderRadius: 2, fontWeight: 800 }}
            >
              {loading ? 'Uploading…' : 'Upload new'}
            </Button>
            {loading && (
              <CircularProgress size={18} sx={{ alignSelf: 'center' }} />
            )}
          </Stack>
        </Stack>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </Stack>
    </Box>
  );
}
