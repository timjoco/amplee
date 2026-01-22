import { notFound, redirect } from 'next/navigation';
import BandSheet from '../../../../../components/Bands/BandSheet';
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

  // Verify event exists and belongs to this band
  const { data: event, error } = await supabase
    .from('events')
    .select('id, band_id')
    .eq('id', eventId)
    .maybeSingle();

  if (error || !event) notFound();
  if (event.band_id !== bandId) notFound();

  // Render BandSheet - it will detect the eventId from the URL path
  // and display the event with the sidebar intact
  return <BandSheet bandId={bandId} />;
}
