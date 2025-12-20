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

/**
 * useNewBandForm (GlobalCreateMobile)
 *
 * This hook powers the "New Band" step inside GlobalCreateMobile.
 *
 * How GlobalCreateMobile uses it:
 * - <NewBandStep /> reads `bandName`, `avatarPreview`, `creatingBand`, `createBandErr`
 * - <NewBandStep /> calls setters + pick handlers (pickAvatar/pickAvatarNative)
 * - GlobalCreateMobile calls `submit()` when user taps "Create"
 * - GlobalCreateMobile calls `reset()` inside closeAll() on modal dismiss/success
 *
 */
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

  // ─────────────────────────────────────────────────────────────
  // Core band fields (bound to inputs in <NewBandStep />)
  // ─────────────────────────────────────────────────────────────
  const [bandName, setBandName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Used on web as a fallback when user taps "Upload" in a native-like UI
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Cleans up the existing preview ObjectURL to avoid memory leaks.
   * Used whenever we replace the selected avatar, and during cleanup/unmount.
   */
  const clearPreview = useCallback(() => {
    if (!avatarPreview) return;
    try {
      URL.revokeObjectURL(avatarPreview);
    } catch {}
  }, [avatarPreview]);

  /**
   * Cleanup on unmount: ensures ObjectURLs are revoked.
   */
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }
    };
  }, [avatarPreview]);

  /**
   * Shared file validator + preview creator.
   *
   * Used by:
   * - pickAvatar (web file input)
   * - pickAvatarNative (camera/library)
   */
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

      // Replace the preview safely (DRY: one place handles revoke + create)
      clearPreview();
      const url = URL.createObjectURL(f);

      setAvatarFile(f);
      setAvatarPreview(url);
    },
    [clearPreview, showToast]
  );

  /**
   * Web handler: user picks an image via <input type="file" />
   * - validates file
   * - sets avatarFile + avatarPreview
   */
  const pickAvatar: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      try {
        const input = e.currentTarget;
        const f = input.files?.[0];
        if (!f) return;

        setAvatarFromFile(f);

        // Allow re-selecting the same file (important UX detail)
        input.value = '';
      } catch (err) {
        console.error('[pickAvatar]', err);
        showToast('Could not load image.');
      }
    },
    [setAvatarFromFile, showToast]
  );

  /**
   * Native handler: camera or photo library
   * - uses Capacitor Camera plugin
   * - converts returned photo to a File
   * - routes into setAvatarFromFile for consistent validation/preview behavior
   */
  const pickAvatarNative = useCallback(
    async (source: 'camera' | 'library') => {
      // If not native, fall back to the web file picker
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
        // User cancelled camera/library picker — don’t show an error toast
        if (isUserCancelled(err)) return;

        console.error('[pickAvatarNative]', err);
        showToast((err as any)?.message || 'Could not load image.');
      }
    },
    [setAvatarFromFile, showToast]
  );

  /**
   * Resets local form state back to defaults.
   *
   * Used by GlobalCreateMobile.closeAll() when:
   * - modal is dismissed
   * - creation succeeds and we want a clean slate next open
   */
  const reset = useCallback(() => {
    resetError?.();
    setBandName('');
    setAvatarFile(null);

    // Revoke preview URL + clear it
    clearPreview();
    setAvatarPreview(null);
  }, [clearPreview, resetError]);

  /**
   * Creates the band via your existing `useCreateBand` hook.
   *
   * Called by GlobalCreateMobile.handleSubmitCreateBand():
   * - Returns created band (BandLite) on success
   * - Returns null on validation failure or server error
   */
  const submit = useCallback(async () => {
    const name = bandName.trim();
    if (!name) {
      showToast('Enter a band name.');
      return null;
    }

    try {
      // Clear shared modal error banner before attempting submit
      onError?.(null);

      // Delegate creation to the existing band creation flow
      const created = await createBand({ name, avatarFile });
      if (!created?.id) throw new Error('Could not create band');

      return created as BandLite;
    } catch (e: any) {
      const msg = e?.message ?? 'Could not create band';
      onError?.(msg);
      return null;
    }
  }, [avatarFile, bandName, createBand, onError, showToast]);

  /**
   * Returned API is consumed by:
   * - <NewBandStep /> for rendering/binding inputs (reads fields, calls handlers)
   * - GlobalCreateMobile for submit/reset + optimistic update + navigation
   */
  return {
    // fields (UI reads)
    bandName,
    avatarFile,
    avatarPreview,
    creatingBand,
    createBandErr,
    fileInputRef,

    // setters/handlers (UI writes)
    setBandName,
    setAvatarFile,
    setAvatarPreview,
    pickAvatar,
    pickAvatarNative,

    // lifecycle
    reset,
    submit,
  };
}
