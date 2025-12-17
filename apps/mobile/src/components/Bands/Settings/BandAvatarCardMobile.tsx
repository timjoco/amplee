/* eslint-disable @typescript-eslint/no-explicit-any */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { IonActionSheet, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import { cameraOutline, imagesOutline } from 'ionicons/icons';
import * as React from 'react';

import { isUserCancelled } from '../../../lib/nativeErrors';
import { supabase } from '../../../lib/supabase';
import AvatarImageMobile from '../../ui/AvatarImageMobile';

// If you already created this helper somewhere else, import it.
// Otherwise, keep the inline helper below.
// import { isUserCancelled } from '../../../lib/nativeErrors';

type Props = {
  bandId: string;
  bandName: string;
  initialPath?: string;
};

const AVATAR_BUCKET = 'band-avatars';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function generateAvatarKey(bandId: string, ext: string) {
  const anyCrypto: any = (globalThis as any).crypto;
  const id =
    anyCrypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `avatars/${bandId}/${id}.${ext}`;
}

async function pickNativeAvatarImage(source: 'camera' | 'library') {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
  });

  if (!photo.webPath) throw new Error('No photo path returned');

  const res = await fetch(photo.webPath);
  const blob = await res.blob();
  return blob;
}

async function downscaleToJpeg(
  input: Blob,
  maxSize = 1024,
  quality = 0.85
): Promise<Blob> {
  const img = document.createElement('img');
  const url = URL.createObjectURL(input);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });

    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;

    const scale = Math.min(1, maxSize / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');
    ctx.drawImage(img, 0, 0, w, h);

    const out: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        quality
      );
    });

    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function BandAvatarCardMobile({
  bandId,
  bandName,
  initialPath,
}: Props) {
  const [avatarPath, setAvatarPath] = React.useState<string | undefined>(
    initialPath
  );

  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const [showPicker, setShowPicker] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setAvatarPath(initialPath);
  }, [initialPath]);

  const onPick = () => {
    if (Capacitor.isNativePlatform()) {
      setShowPicker(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const uploadAndSavePath = async (path: string, contentType?: string) => {
    // store path in bands table
    const { error: updateErr } = await supabase
      .from('bands')
      .update({
        avatar_url: path,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bandId);

    if (updateErr) throw updateErr;

    setAvatarPath(path);
    setToastMessage('Band photo updated');

    // Optional: let other parts of the app refresh cached avatars
    window.dispatchEvent(
      new CustomEvent('bands:avatar_changed', {
        detail: { band_id: bandId, avatar_url: path },
      })
    );
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please choose an image file.');
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = generateAvatarKey(bandId, ext);

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadErr) throw uploadErr;

      await uploadAndSavePath(path, file.type);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update band photo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadFromNative = async (source: 'camera' | 'library') => {
    setUploading(true);
    setError(null);

    try {
      const blob = await pickNativeAvatarImage(source);
      const resizedJpeg = await downscaleToJpeg(blob, 1024, 0.85);

      const path = generateAvatarKey(bandId, 'jpg');

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, resizedJpeg, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadErr) throw uploadErr;

      await uploadAndSavePath(path, 'image/jpeg');
    } catch (err: any) {
      if (isUserCancelled(err)) return;

      console.error(err);
      setError(err?.message || 'Failed to update band photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvatarImageMobile
          name={bandName}
          bucket={AVATAR_BUCKET}
          avatarPath={avatarPath}
          size={54}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'rgba(148, 163, 184, 0.85)',
            }}
          >
            Band avatar
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 15,
              fontWeight: 700,
              color: 'rgba(241,245,249,0.95)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {bandName}
          </p>
        </div>

        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(139, 92, 246, 0.25)',
            background: uploading
              ? 'rgba(139, 92, 246, 0.12)'
              : 'rgba(139, 92, 246, 0.10)',
            color: '#c4b5fd',
            fontSize: 13,
            fontWeight: 700,
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? (
            <>
              <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
              Uploading…
            </>
          ) : (
            <>
              <IonIcon icon={imagesOutline} />
              Change
            </>
          )}
        </button>
      </div>

      {/* Web file input fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(248, 113, 113, 0.10)',
            border: '1px solid rgba(248, 113, 113, 0.20)',
            color: 'rgba(248, 113, 113, 0.95)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Native picker */}
      <IonActionSheet
        isOpen={showPicker}
        onDidDismiss={() => setShowPicker(false)}
        header="Update band photo"
        cssClass="amplee-action-sheet-dark"
        buttons={[
          {
            text: 'Take Photo',
            icon: cameraOutline,
            handler: () => {
              setShowPicker(false);
              void uploadFromNative('camera');
            },
          },
          {
            text: 'Choose from Library',
            icon: imagesOutline,
            handler: () => {
              setShowPicker(false);
              void uploadFromNative('library');
            },
          },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />

      <IonToast
        isOpen={toastMessage !== null}
        message={toastMessage ?? ''}
        duration={2000}
        position="bottom"
        onDidDismiss={() => setToastMessage(null)}
        cssClass="amplee-toast-success"
      />
    </div>
  );
}
