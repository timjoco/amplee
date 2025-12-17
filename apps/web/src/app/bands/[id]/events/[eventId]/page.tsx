import { notFound, redirect } from 'next/navigation';
import EventSheet from '../../../../../components/Events/EventSheet';
import { createClient } from '../../../../../utils/supabase/server';

type Params = { id: string; eventId: string };

export const revalidate = 0;

export default async function EventPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id: bandId, eventId } = await params;

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
  if (event.band_id !== bandId) notFound();

  return (
    <EventSheet
      eventId={event.id}
      bandId={bandId}
      initialEvent={event as any}
    />
  );
}
