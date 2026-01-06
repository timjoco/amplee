/* eslint-disable @typescript-eslint/no-explicit-any */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export function generateAvatarKey(userId: string, ext: string) {
  const anyCrypto: any = (globalThis as any).crypto;
  const id =
    anyCrypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `avatars/${userId}/${id}.${ext}`;
}

export async function fetchLocationsFromApi(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`/api/locations?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data.results ?? []) as any[];
    return results
      .map((r) => r.name as string)
      .filter((s) => typeof s === 'string' && s.trim().length > 0);
  } catch {
    return [];
  }
}

export async function pickNativeAvatarImage(source: 'camera' | 'library') {
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
  });

  const webPath = photo.webPath;
  if (!webPath) throw new Error('No photo path returned');

  const res = await fetch(webPath);
  if (!res.ok) throw new Error('Failed to read photo');
  return await res.blob();
}

export async function downscaleToJpeg(
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
