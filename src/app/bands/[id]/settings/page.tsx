// app/bands/[id]/settings/page.tsx
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import BandSettingsDialog from './BandSettingsDialog';

export default async function BandSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: band } = await supabase
    .from('bands')
    .select('id, name, avatar_url')
    .eq('id', id)
    .maybeSingle();
  if (!band) notFound();

  const { data: mem } = await supabase
    .from('band_members')
    .select('role')
    .eq('band_id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!mem) redirect(`/bands/${id}`);

  const isAdmin = mem.role === 'admin';

  return (
    <BandSettingsDialog
      bandId={band.id}
      bandName={band.name}
      avatarPath={band.avatar_url ?? undefined}
      isAdmin={isAdmin}
    />
  );
}
