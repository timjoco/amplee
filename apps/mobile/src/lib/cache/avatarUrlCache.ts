import { supabase } from '../supabase';

type CachedUrl = {
  url: string;
};

const cache = new Map<string, CachedUrl>();

export async function getAvatarUrl(
  bucket: string,
  path: string | null | undefined
): Promise<string | null> {
  if (!bucket || !path) return null;

  const key = `${bucket}:${path}`;

  // 1) In-memory cache
  const cached = cache.get(key);
  if (cached) {
    return cached.url;
  }

  // 2) Fetch signed URL from Supabase once
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) {
    console.warn('[avatar signedUrl error]', error);
    return null;
  }

  const url = data.signedUrl;
  cache.set(key, { url });
  return url;
}
