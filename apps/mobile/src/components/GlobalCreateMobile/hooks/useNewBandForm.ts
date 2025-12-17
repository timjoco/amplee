/* eslint-disable @typescript-eslint/no-explicit-any */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
} from 'react';
import { useCreateBand } from '../../../hooks/useCreateBand';
import { isUserCancelled } from '../../../lib/nativeErrors';

export type BandLite = { id: string; name: string; avatar_url?: string | null };
export type ShowToast = (msg: string) => void;

export function useNewBandForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string | null) => void;
}) {
  const { showToast, onError } = opts;

  const {
    createBand,
    loading: creatingBand,
    error: createBandErr,
    resetError,
  } = useCreateBand();

  const [bandName, setBandName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearPreview = useCallback(() => {
    if (!avatarPreview) return;
    try {
      URL.revokeObjectURL(avatarPreview);
    } catch {}
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }
    };
  }, [avatarPreview]);

  const setAvatarFromFile = useCallback(
    (f: File) => {
      if (!f.type || !f.type.startsWith('image/')) {
        showToast('Please choose an image file.');
        return;
      }
      if (f.size > 3 * 1024 * 1024) {
        showToast('Max file size is 3MB.');
        return;
      }

      clearPreview();
      const url = URL.createObjectURL(f);
      setAvatarFile(f);
      setAvatarPreview(url);
    },
    [clearPreview, showToast]
  );

  const pickAvatar: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      try {
        const input = e.currentTarget;
        const f = input.files?.[0];
        if (!f) return;

        setAvatarFromFile(f);
        input.value = '';
      } catch (err) {
        console.error('[pickAvatar]', err);
        showToast('Could not load image.');
      }
    },
    [setAvatarFromFile, showToast]
  );

  const pickAvatarNative = useCallback(
    async (source: 'camera' | 'library') => {
      if (!Capacitor.isNativePlatform()) {
        fileInputRef.current?.click();
        return;
      }

      try {
        const photo = await Camera.getPhoto({
          quality: 85,
          allowEditing: true,
          resultType: CameraResultType.Uri,
          source:
            source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        });

        const webPath = photo.webPath;
        if (!webPath) throw new Error('No photo path returned');

        const res = await fetch(webPath);
        if (!res.ok) throw new Error('Failed to read photo');
        const blob = await res.blob();

        const mime = blob.type || 'image/jpeg';
        const ext = mime.includes('png')
          ? 'png'
          : mime.includes('webp')
          ? 'webp'
          : 'jpg';
        const file = new File([blob], `band-avatar.${ext}`, { type: mime });

        setAvatarFromFile(file);
      } catch (err) {
        if (isUserCancelled(err)) return;
        console.error('[pickAvatarNative]', err);
        showToast((err as any)?.message || 'Could not load image.');
      }
    },
    [setAvatarFromFile, showToast]
  );

  const reset = useCallback(() => {
    resetError?.();
    setBandName('');
    setAvatarFile(null);
    clearPreview();
    setAvatarPreview(null);
  }, [clearPreview, resetError]);

  const submit = useCallback(async () => {
    const name = bandName.trim();
    if (!name) {
      showToast('Enter a band name.');
      return null;
    }

    try {
      onError?.(null);
      const created = await createBand({ name, avatarFile });
      if (!created?.id) throw new Error('Could not create band');
      return created as BandLite;
    } catch (e: any) {
      const msg = e?.message ?? 'Could not create band';
      onError?.(msg);
      return null;
    }
  }, [avatarFile, bandName, createBand, onError, showToast]);

  return {
    bandName,
    avatarFile,
    avatarPreview,
    creatingBand,
    createBandErr,
    fileInputRef,
    setBandName,
    setAvatarFile,
    setAvatarPreview,
    pickAvatar,
    pickAvatarNative,
    reset,
    submit,
  };
}
