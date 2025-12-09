import { supabase } from '../supabase';

type CachedUrl = {
  url: string;
};

const cache = new Map<string, CachedUrl>();

function isFullUrl(value: string | null | undefined): boolean {
  return (
    !!value && (value.startsWith('http://') || value.startsWith('https://'))
  );
}

export async function getAvatarUrl(
  bucket: string,
  path: string | null | undefined
): Promise<string | null> {
  if (!bucket || !path) return null;

  // 0) If it's already a full URL, just use it
  if (isFullUrl(path)) {
    return path;
  }

  // 1) Normalize path so we don't send "bucket/bucket/..."
  let normalizedPath = path;
  if (normalizedPath.startsWith(`${bucket}/`)) {
    normalizedPath = normalizedPath.slice(bucket.length + 1);
  }

  const key = `${bucket}:${normalizedPath}`;

  // 2) In-memory cache
  const cached = cache.get(key);
  if (cached) {
    return cached.url;
  }

  // 3) Fetch signed URL from Supabase once
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedPath, 60 * 60 * 24 * 7); // 7 days

  if (error || !data?.signedUrl) {
    console.warn('[avatar signedUrl error]', {
      error,
      bucket,
      rawPath: path,
      normalizedPath,
    });
    return null;
  }

  const url = data.signedUrl;
  cache.set(key, { url });
  return url;
}
