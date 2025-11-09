import { supabaseServer } from '../../lib/supabaseServer';
import AppFrameClient from './AppFrameClient';

export default async function AppFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialAuthed = !!user;

  return (
    <AppFrameClient initialAuthed={initialAuthed}>{children}</AppFrameClient>
  );
}
