import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export type PickedImage = {
  blob: Blob;
  contentType: string;
  ext: 'jpg' | 'png' | 'webp';
};

function extFromContentType(ct: string): PickedImage['ext'] {
  const t = (ct || '').toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('webp')) return 'webp';
  return 'jpg';
}

export async function pickAvatarImage(source: 'camera' | 'library') {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('pickAvatarImage is native-only');
  }

  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
  });

  if (!photo.webPath) throw new Error('No photo path returned');

  const res = await fetch(photo.webPath);
  const blob = await res.blob();

  const contentType = blob.type || 'image/jpeg';
  const ext = extFromContentType(contentType);

  return { blob, contentType, ext } satisfies PickedImage;
}
