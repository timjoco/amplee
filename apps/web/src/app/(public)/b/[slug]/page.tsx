import BandPublicPage, {
  BandData,
  Event,
  Photo,
  StreamingLink,
  Video,
} from '@/components/Public/BandPublicPage';
import { supabaseServer } from '@/lib/supabaseServer';
import type { Metadata } from 'next';

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
      genres,
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
  const location = band.location ?? '';

  return {
    title: `${band.name} | Amplee`,
    description:
      bio ||
      `Check out ${band.name} on Amplee${location ? ` – ${location}` : ''}`,
    openGraph: {
      title: band.name,
      description: bio || `Music from ${band.name}`,
      // TS-allowed value:
    },
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await supabaseServer();

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
      genres,
      avatar_url,
      public_slug
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
        }}
      />
    );
  }

  const band: BandData = {
    id: bandRow.id,
    name: bandRow.name,
    avatar_url: bandRow.avatar_url ?? undefined,
    bio: bandRow.public_bio ?? bandRow.bio ?? undefined,
    location: bandRow.location ?? undefined,
    genres: bandRow.genres ?? undefined,
    public_slug: bandRow.public_slug ?? undefined,
  };

  // --------------------------
  // 2. Fetch upcoming public shows
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
      // no separate venue column; we just treat `location` as
      // the display string ("The Truman – Kansas City, MO")
      venue: undefined,
      location: e.location ?? '',
      ticket_url: e.ticket_url ?? undefined,
    })) ?? [];

  // --------------------------
  // 3. Streaming links
  // --------------------------
  const { data: streamingRows, error: streamingError } = await supabase
    .from('band_streaming_links')
    .select('platform_type, url')
    .eq('band_id', band.id)
    .order('display_order', { ascending: true });

  if (streamingError) {
    console.error('[PublicBandPage] streamingError:', streamingError);
  }

  const streamingLinks: StreamingLink[] =
    streamingRows?.map((row) => ({
      platform: row.platform_type,
      url: row.url,
    })) ?? [];

  // --------------------------
  // 4. Photos & videos — still empty for now
  // --------------------------
  const photos: Photo[] = [];
  const videos: Video[] = [];

  return (
    <BandPublicPage
      slug={slug}
      initialData={{
        band,
        events,
        streamingLinks,
        photos,
        videos,
      }}
    />
  );
}
