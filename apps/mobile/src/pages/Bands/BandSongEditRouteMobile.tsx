/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SongEditPage from './SongEditPage';

export default function BandSongEditRouteMobile() {
  const nav = useNavigate();
  const { bandId, songId } = useParams<{ bandId: string; songId?: string }>();

  const onBack = useCallback(() => {
    // If you came from list or sheet, -1 feels native
    nav(-1);
  }, [nav]);

  if (!bandId) return null;

  return (
    <SongEditPage
      bandId={bandId}
      songId={songId}
      onBack={onBack}
      onSaved={(id) => {
        // optional: after creating, you can bounce to the sheet route
        // nav(`/bands/${bandId}/songs/${id}`, { replace: true });
      }}
      onDeleted={() => {
        // optional: after delete, you can ensure you land on list
        // nav(`/bands/${bandId}/songs`, { replace: true });
      }}
    />
  );
}
