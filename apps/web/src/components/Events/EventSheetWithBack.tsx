'use client';

import { useRouter } from 'next/navigation';
import EventSheet from './EventSheet';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string;
  location: string | null;
  is_booked?: boolean;
  cnt_members?: number;
  cnt_accepted?: number;
};

export default function EventSheetWithBack({
  eventId,
  bandId,
  initialEvent,
}: {
  eventId: string;
  bandId: string;
  initialEvent: EventRow;
}) {
  const router = useRouter();

  return (
    <EventSheet
      eventId={eventId}
      bandId={bandId}
      initialEvent={initialEvent}
      onBack={() => router.push('/dashboard')}
    />
  );
}
