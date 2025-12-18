import EventSheetWithBack from '@/components/Events/EventSheetWithBack';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../utils/supabase/server';

type Params = { eventId: string };

export const revalidate = 0;

export default async function StandaloneEventPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { eventId } = await params;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: event, error } = await supabase
    .from('events')
    .select(
      `id, band_id, title, type, starts_at, location, band:bands ( id, name )`
    )
    .eq('id', eventId)
    .maybeSingle();

  if (error || !event) notFound();

  return (
    <EventSheetWithBack
      eventId={event.id}
      bandId={event.band_id}
      initialEvent={event as any}
    />
  );
}
