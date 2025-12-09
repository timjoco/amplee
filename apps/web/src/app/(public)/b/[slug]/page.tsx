export const dynamic = 'force-dynamic';

import BandPublicPage, {
  BandData,
  Event,
  Photo,
  SocialLink,
  StreamingLink,
  Video,
} from '@/components/Public/BandPublicPage';
import { supabaseServer } from '@/lib/supabaseServer';
import type { Metadata } from 'next';

// Helper function to convert video URLs to embed format
function getVideoEmbedUrl(url: string): string | null {
  if (!url.trim()) return null;

  // YouTube patterns
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo patterns
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

// Next 15: params is a Promise
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await supabaseServer();

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug
    );

  let bandQuery = supabase
    .from('bands')
    .select(
      `
      id,
      name,
      public_bio,
      bio,
      location,
      city,
      state,
      avatar_url,
      public_slug
    `
    )
    .eq('is_public', true);

  bandQuery = isUUID
    ? bandQuery.eq('id', slug)
    : bandQuery.eq('public_slug', slug);

  const { data: band } = await bandQuery.single();

  if (!band) {
    return {
      title: 'Band not found | Amplee',
      description: 'This band page might be private or does not exist.',
    };
  }

  const bio = band.public_bio ?? band.bio ?? '';
  const location =
    band.location ??
    (band.city && band.state
      ? `${band.city}, ${band.state}`
      : band.city ?? band.state ?? '');

  return {
    title: `${band.name} | Amplee`,
    description:
      bio ||
      `Check out ${band.name} on Amplee${location ? ` – ${location}` : ''}`,
    openGraph: {
      title: band.name,
      description: bio || `Music from ${band.name}`,
    },
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await supabaseServer();

  const DEFAULT_BAND_AVATAR = '/images/default-band-avatar.png';

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug
    );

  // --------------------------
  // 1. Fetch band (must be public)
  // --------------------------
  let bandQuery = supabase
    .from('bands')
    .select(
      `
      id,
      name,
      public_bio,
      bio,
      location,
      city,
      state,
      avatar_url,
      public_slug,
      embedded_video_url,
      gallery_images,
      public_theme
    `
    )
    .eq('is_public', true);

  bandQuery = isUUID
    ? bandQuery.eq('id', slug)
    : bandQuery.eq('public_slug', slug);

  const { data: bandRow, error: bandError } = await bandQuery.single();

  if (bandError || !bandRow) {
    console.error('[PublicBandPage] bandError:', bandError);
    return (
      <BandPublicPage
        slug={slug}
        initialData={{
          band: null,
          events: [],
          streamingLinks: [],
          photos: [],
          videos: [],
          socialLinks: [],
        }}
      />
    );
  }

  console.log('[PublicBandPage] bandRow:', {
    embedded_video_url: bandRow.embedded_video_url,
    gallery_images: bandRow.gallery_images,
  });

  // --------------------------
  // 2. Fetch genres from band_genres junction table
  // --------------------------
  const { data: bandGenresData, error: genresError } = await supabase
    .from('band_genres')
    .select('genres(name)')
    .eq('band_id', bandRow.id);

  if (genresError) {
    console.error('[PublicBandPage] genresError:', genresError);
  }

  const genres: string[] =
    bandGenresData
      ?.map((row: any) => row.genres?.name as string | undefined)
      .filter((name): name is string => Boolean(name)) ?? [];

  // Build location string from city/state if location column is empty
  const locationString =
    bandRow.location ??
    (bandRow.city && bandRow.state
      ? `${bandRow.city}, ${bandRow.state}`
      : bandRow.city ?? bandRow.state ?? undefined);

  // Normalize theme to one of the four valid options
  const normalizeTheme = (
    value: string | null
  ):
    | 'cosmic'
    | 'cosmic-light'
    | 'matrix'
    | 'blocky'
    | 'modest'
    | 'modest-dark'
    | 'sakura' => {
    const v = value?.toLowerCase();
    if (
      v === 'cosmic' ||
      v === 'cosmic-light' ||
      v === 'matrix' ||
      v === 'blocky' ||
      v === 'modest' ||
      v === 'modest-dark' ||
      v === 'sakura'
    ) {
      return v;
    }
    // Legacy mappings
    if (v === 'mystical') return 'blocky';
    if (v === 'plain') return 'modest';
    return 'cosmic';
  };

  const band: BandData = {
    id: bandRow.id,
    name: bandRow.name,
    avatar_url:
      (bandRow.avatar_url && bandRow.avatar_url.trim().length > 0
        ? bandRow.avatar_url
        : DEFAULT_BAND_AVATAR) ?? DEFAULT_BAND_AVATAR,
    bio: bandRow.public_bio ?? bandRow.bio ?? undefined,
    location: locationString,
    genres: genres.length > 0 ? genres : undefined,
    public_slug: bandRow.public_slug ?? undefined,
    embedded_video_url: bandRow.embedded_video_url ?? undefined,
    gallery_images: bandRow.gallery_images ?? undefined,
    public_theme: normalizeTheme(bandRow.public_theme),
  };

  // --------------------------
  // 3. Fetch upcoming public shows
  // --------------------------
  const nowIso = new Date().toISOString();

  const { data: eventsRows, error: eventsError } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      public_title,
      starts_at,
      location,
      ticket_url,
      type,
      is_public,
      is_cancelled
    `
    )
    .eq('band_id', band.id)
    .eq('type', 'show')
    .eq('is_public', true)
    .eq('is_cancelled', false)
    .gte('starts_at', nowIso)
    .order('starts_at', { ascending: true });

  if (eventsError) {
    console.error('[PublicBandPage] eventsError:', eventsError);
  }

  const events: Event[] =
    eventsRows?.map((e) => ({
      id: e.id,
      title: e.public_title || e.title,
      date: e.starts_at,
      venue: undefined,
      location: e.location ?? '',
      ticket_url: e.ticket_url ?? undefined,
    })) ?? [];

  // --------------------------
  // 4. Streaming + Social links from band_streaming_links
  // --------------------------
  type BandStreamingLinkRow = {
    platform_type: string | null;
    url: string | null;
  };

  const { data: streamingRowsRaw, error: streamingError } = await supabase
    .from('band_streaming_links')
    .select('platform_type, url')
    .eq('band_id', band.id)
    .order('display_order', { ascending: true });

  if (streamingError) {
    console.error('[PublicBandPage] streamingError:', streamingError);
  }

  const streamingRows = (streamingRowsRaw ?? []) as BandStreamingLinkRow[];

  const streamingPlatforms = new Set([
    'spotify',
    'apple',
    'apple-music',
    'apple music',
    'youtube-music',
    'youtube music',
    'youtubemusic',
    'soundcloud',
    'bandcamp',
    'tidal',
    'deezer',
  ]);

  const socialPlatforms = new Set([
    'youtube',
    'instagram',
    'facebook',
    'twitter',
    'x',
    'tiktok',
    'threads',
    'website',
    'site',
    'linktree',
    'homepage',
  ]);

  const streamingLinks: StreamingLink[] = [];
  const socialLinks: SocialLink[] = [];

  for (const row of streamingRows) {
    if (!row.url) continue;

    const platformRaw = row.platform_type ?? 'link';
    const platformKey = platformRaw.toLowerCase();

    const link = {
      platform: platformKey,
      url: row.url,
    };

    if (streamingPlatforms.has(platformKey)) {
      streamingLinks.push(link);
    } else if (socialPlatforms.has(platformKey)) {
      socialLinks.push(link);
    } else {
      // default unknowns to socials so they still show up
      socialLinks.push(link);
    }
  }

  // --------------------------
  // 5. Photos from gallery_images JSONB
  // --------------------------
  const galleryImages = (bandRow.gallery_images ?? []) as string[];
  const photos: Photo[] = galleryImages.map((url: string, index: number) => ({
    id: `gallery-${index}`,
    url,
  }));

  // --------------------------
  // 6. Videos from embedded_video_url
  // --------------------------
  const videos: Video[] = [];
  if (bandRow.embedded_video_url) {
    const embedUrl = getVideoEmbedUrl(bandRow.embedded_video_url);
    if (embedUrl) {
      videos.push({
        id: 'featured-video',
        embed_url: embedUrl,
        title: 'Featured Video',
      });
    }
  }

  return (
    <BandPublicPage
      slug={slug}
      initialData={{
        band,
        events,
        streamingLinks,
        photos,
        videos,
        socialLinks,
      }}
    />
  );
}
