// apps/mobile/src/pages/BandSongsRouteMobile.tsx
import { useNavigate, useParams } from 'react-router-dom';
import SongListPage from './Songs/SongListPage';

export default function BandSongsRouteMobile() {
  const { bandId } = useParams<{ bandId: string }>();
  const nav = useNavigate();

  if (!bandId) return null;

  // this is the page for the list of all songs
  return (
    <SongListPage
      bandId={bandId}
      onBack={() => nav(-1)}
      onOpenSong={(songId) => nav(`/bands/${bandId}/songs/${songId}`)}
      onCreateSong={() => {
        window.dispatchEvent(
          new CustomEvent('amplee:global-create', {
            detail: { kind: 'song', bandId },
          })
        );
      }}
    />
  );
}
