/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

type Props = {
  bandId: string;
  bandName: string;
  initialPath?: string;
};

export default function BandAvatarCardMobile({
  bandId,
  bandName,
  initialPath,
}: Props) {
  const [currentPath, setCurrentPath] = useState<string | undefined>(
    initialPath
  );
  const [signedUrl, setSignedUrl] = useState<string | undefined>(undefined);
  const [signErr, setSignErr] = useState<string | undefined>(undefined);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const BAND_AVATAR_BUCKET = 'band-avatars';

  function generateBandAvatarKey(bandId: string, ext: string) {
    const anyCrypto: any = (globalThis as any).crypto;
    const id =
      anyCrypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return `${bandId}/${id}.${ext}`;
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setSignErr(undefined);
      setSignedUrl(undefined);

      if (!currentPath) return;

      // 👇 1) If currentPath is already a full URL, just use it directly
      const isFullUrl =
        currentPath.startsWith('http://') || currentPath.startsWith('https://');

      if (isFullUrl) {
        if (!cancelled) {
          setSignedUrl(currentPath);
        }
        return;
      }

      // 👇 2) Otherwise treat it as a path inside band-avatars
      // Normalize in case we accidentally stored "band-avatars/foo/bar.png"
      let normalizedPath = currentPath;
      if (normalizedPath.startsWith(`${BAND_AVATAR_BUCKET}/`)) {
        normalizedPath = normalizedPath.slice(BAND_AVATAR_BUCKET.length + 1);
      }

      const { data, error } = await supabase.storage
        .from(BAND_AVATAR_BUCKET)
        .createSignedUrl(normalizedPath, 3600);

      if (cancelled) return;

      if (error) {
        console.warn('[BandAvatarCardMobile] signed URL error:', {
          error,
          currentPath,
          normalizedPath,
        });
        setSignErr(error.message);
        setSignedUrl(undefined);
      } else {
        setSignedUrl(data?.signedUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPath]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image.');
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      setError('Max size is 3MB.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    e.currentTarget.value = '';
  }

  async function onSave() {
    if (!pendingFile) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const ext = pendingFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = generateBandAvatarKey(bandId, ext);

      const { error: upErr } = await supabase.storage
        .from('band-avatars')
        .upload(path, pendingFile, {
          upsert: true,
          cacheControl: '3600',
        });
      if (upErr) throw new Error(upErr.message);

      const { error: updErr } = await supabase
        .from('bands')
        .update({ avatar_url: path })
        .eq('id', bandId);
      if (updErr) throw new Error(updErr.message);

      setCurrentPath(path);
      setPendingFile(null);
      setPreviewUrl(null);
      setSuccessMsg('Avatar updated!');
    } catch (e: any) {
      setError(e?.message || 'Failed to update avatar');
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    setPendingFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccessMsg(null);
  }

  const avatarSrc = previewUrl || signedUrl || undefined;
  const initials = bandName.trim().slice(0, 2).toUpperCase();
  const avatarSize = 72;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'rgba(196,181,253,0.9)',
          }}
        >
          Add a logo or photo so everyone recognizes your band.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Avatar preview */}
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '999px',
            border: '2px solid rgba(168,85,247,0.85)',
            background:
              'radial-gradient(circle at 30% 0%, rgba(196,181,253,0.35), #020617)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={bandName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#F9FAFB',
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Actions + status */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <label
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.7)',
                backgroundColor: '#050816',
                fontSize: 13,
                fontWeight: 600,
                color: '#E5E7EB',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {previewUrl
                ? 'Choose another'
                : currentPath
                ? 'Change avatar'
                : 'Add avatar'}
              <input hidden type="file" accept="image/*" onChange={onPick} />
            </label>

            {previewUrl && (
              <>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    cursor: saving ? 'default' : 'pointer',
                    background:
                      'linear-gradient(135deg, rgba(147,51,234,0.98), rgba(107,58,157,0.98))',
                    color: '#F5F3FF',
                    opacity: saving ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.6)',
                    backgroundColor: 'transparent',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#E5E7EB',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Status + errors */}
          {signErr && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#F97373',
              }}
            >
              Signed URL error: {signErr}
            </p>
          )}
          {error && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#FCA5A5',
              }}
            >
              {error}
            </p>
          )}
          {successMsg && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#BBF7D0',
              }}
            >
              {successMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
