// apps/web/src/app/bands/[id]/events/page.tsx (or your path)
import { notFound, redirect } from 'next/navigation';
import BandEventsList from '../../../../components/Bands/BandEventsList';
import { createClient } from '../../../../utils/supabase/server';

type RouteParams = { id: string };

export default async function BandEventsIndex({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id: bandId } = await params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: band } = await supabase
    .from('bands')
    .select('id, name')
    .eq('id', bandId)
    .maybeSingle();

  if (!band) notFound();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px' }}>
      <BandEventsList bandId={bandId} />
    </div>
  );
}
