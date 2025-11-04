/* eslint-disable @typescript-eslint/no-explicit-any */
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

const BUCKET = 'profile-avatars';

async function resolveAvatarUrl(sb: any, storedPathOrUrl: string | null) {
  if (!storedPathOrUrl) return null;
  // allow http(s), blob:, data: to pass through as-is
  if (
    /^https?:\/\//i.test(storedPathOrUrl) ||
    storedPathOrUrl.startsWith('blob:') ||
    storedPathOrUrl.startsWith('data:')
  ) {
    return storedPathOrUrl;
  }
  const { data } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(storedPathOrUrl, 60 * 60);
  return data?.signedUrl ?? null;
}

type Props = {
  userId?: string;
  initialUrl?: string | null; // storage path OR https
  onSaved?: (urlOrPath: string) => void;
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

  const [stored, setStored] = useState<string | null>(initialUrl ?? null); // path or url
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null); // actual <img src>
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Resolve the actual render URL whenever stored value changes
  useEffect(() => {
    let alive = true;
    (async () => {
      const url = await resolveAvatarUrl(sb, stored);
      if (alive) setResolvedUrl(url);
    })();
    return () => {
      alive = false;
    };
  }, [sb, stored]);

  // Keep in sync with prop
  useEffect(() => {
    if (initialUrl !== undefined) setStored(initialUrl ?? null);
  }, [initialUrl]);

  const onPick = () => fileRef.current?.click();

  const onFile = async (file?: File | null) => {
    setErr(null);
    if (!userId || !file) return;

    if (!file.type.startsWith('image/')) {
      setErr('Please choose an image file.');
      return;
    }

    // --- NEW: optimistic preview (instant UI) ---------------------
    const previewUrl = URL.createObjectURL(file);
    setStored(previewUrl); // triggers resolver -> <Avatar src=preview>
    window.dispatchEvent(
      new CustomEvent('profiles:avatar_changed', {
        detail: { avatar_url: previewUrl, isPreview: true },
      })
    );
    // --------------------------------------------------------------

    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await sb.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });
      if (upErr) throw upErr;

      // Save the PATH to profiles (works for public or private)
      const { error: upProfileErr } = await sb
        .from('profiles')
        .update({
          avatar_url: path,
          updated_at: new Date().toISOString(), // good for cache-busting if you use it
        })
        .eq('id', userId);
      if (upProfileErr) throw upProfileErr;

      setStored(path); // triggers signing -> final URL
      onSaved?.(path);

      // --- NEW: broadcast final (authoritative) value --------------
      window.dispatchEvent(
        new CustomEvent('profiles:avatar_changed', {
          detail: { avatar_url: path, isPreview: false },
        })
      );
      // --------------------------------------------------------------
    } catch (e: any) {
      setErr(e?.message || 'Upload failed.');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
      // optional: free preview blob URL later
      setTimeout(() => {
        try {
          if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        } catch {}
      }, 5000);
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
            src={resolvedUrl ?? undefined}
            alt="Profile avatar"
            imgProps={{
              crossOrigin: 'anonymous',
              referrerPolicy: 'no-referrer',
            }}
            sx={{
              width: compact ? 64 : 96,
              height: compact ? 64 : 96,
              border: '2px solid',
              borderColor: 'rgba(255,255,255,0.12)',
              fontWeight: 800,
            }}
            onError={() =>
              setErr('Failed to load image (check bucket policy or URL).')
            }
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              onClick={onPick}
              disabled={loading || !userId}
              sx={{ borderRadius: 2, fontWeight: 800 }}
            >
              {loading ? 'Uploading…' : 'Upload new'}
            </Button>
            {loading && <CircularProgress size={18} />}
          </Stack>
        </Stack>

        {err && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
            {err}
          </Typography>
        )}

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
