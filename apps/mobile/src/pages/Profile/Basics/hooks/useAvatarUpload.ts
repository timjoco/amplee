/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Capacitor } from '@capacitor/core';

import { isUserCancelled } from '../../../../lib/nativeErrors';
import { supabase } from '../../../../lib/supabase';
import { AVATAR_BUCKET } from '../constants';
import type { ProfileRow } from '../types';
import {
  downscaleToJpeg,
  generateAvatarKey,
  pickNativeAvatarImage,
} from '../utils';

type UseAvatarUploadParams = {
  profile: ProfileRow | null;
  setProfile: React.Dispatch<React.SetStateAction<ProfileRow | null>>;
  setToastMessage: (msg: string | null) => void;
  setError: (error: string | null) => void;
};

export function useAvatarUpload({
  profile,
  setProfile,
  setToastMessage,
  setError,
}: UseAvatarUploadParams) {
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const onPickFile = () => {
    if (Capacitor.isNativePlatform()) {
      setShowAvatarPicker(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) throw new Error('Not signed in');

      if (!file.type.startsWith('image/')) {
        throw new Error('Please choose an image file.');
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = generateAvatarKey(uid, ext);

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadErr) throw uploadErr;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          avatar_url: path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: path,
            }
          : prev
      );

      setToastMessage('Photo updated successfully');

      window.dispatchEvent(
        new CustomEvent('profiles:avatar_changed', {
          detail: { avatar_url: path, isPreview: false },
        })
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update photo.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadAvatarFromNative = async (source: 'camera' | 'library') => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    if (!profile) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) throw new Error('Not signed in');

      const blob = await pickNativeAvatarImage(source);
      const resizedJpeg = await downscaleToJpeg(blob, 1024, 0.85);

      const path = generateAvatarKey(uid, 'jpg');

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, resizedJpeg, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadErr) throw uploadErr;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          avatar_url: path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      setProfile((prev) => (prev ? { ...prev, avatar_url: path } : prev));
      setToastMessage('Photo updated successfully');

      window.dispatchEvent(
        new CustomEvent('profiles:avatar_changed', {
          detail: { avatar_url: path, isPreview: false },
        })
      );
    } catch (err: any) {
      if (isUserCancelled(err)) return;

      console.error(err);
      setError(err?.message || 'Failed to update photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    uploadingAvatar,
    showAvatarPicker,
    setShowAvatarPicker,
    fileInputRef,
    onPickFile,
    onFileChange,
    uploadAvatarFromNative,
  };
}
