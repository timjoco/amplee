import { useNavigate, useParams } from 'react-router-dom';
import SongSheetPage from './Songs/SongSheetPage';

export default function BandSongSheetRouteMobile() {
  const { bandId, songId } = useParams<{ bandId: string; songId: string }>();
  const nav = useNavigate();

  if (!bandId || !songId) return null;

  // this is the individual page for each song, the song sheet
  return (
    <SongSheetPage
      songId={songId}
      onBack={() => nav(-1)}
      onEdit={(id) => {
        console.log('Edit song', id);
      }}
    />
  );
}
