/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/react';
import * as React from 'react';
import { supabase } from '../../lib/supabase';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string;
  ends_at: string | null;
  location: string | null;
};

export default function BandEventsListMobile({
  bandId,
  onSelectEvent,
}: {
  bandId: string;
  onSelectEvent?: (eventId: string) => void; // ✅ ADDED
}) {
  const [rows, setRows] = React.useState<EventRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('id, band_id, title, type, starts_at, ends_at, location')
        .eq('band_id', bandId)
        .order('starts_at', { ascending: true });

      if (!alive) return;
      if (!error) setRows((data ?? []) as EventRow[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [bandId]);

  React.useEffect(() => {
    const ch = supabase
      .channel(`events:${bandId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        (p) =>
          setRows((prev) =>
            [...prev, p.new as EventRow].sort((a, b) =>
              a.starts_at.localeCompare(b.starts_at)
            )
          )
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        (p) =>
          setRows((prev) =>
            prev
              .map((r) =>
                r.id === (p.new as any).id ? (p.new as EventRow) : r
              )
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
          )
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        (p) => setRows((prev) => prev.filter((r) => r.id !== (p.old as any).id))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [bandId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IonSpinner name="dots" />
        <IonText color="medium">Loading…</IonText>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <IonText color="medium">
        No events yet. Use “New Event” to add one.
      </IonText>
    );
  }

  return (
    <IonList inset={true}>
      {rows.map((ev) => (
        <IonItem
          key={ev.id}
          button
          detail
          onClick={() => onSelectEvent?.(ev.id)} // ✅ FIXED: no nav here
          style={{ borderRadius: 12, marginBlock: 6 }}
        >
          <IonLabel>
            <h2 style={{ fontWeight: 800, margin: 0 }}>{ev.title}</h2>
            <p style={{ margin: 0 }}>
              {new Date(ev.starts_at).toLocaleString([], {
                hour: '2-digit',
                minute: '2-digit',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {ev.location ? ` · ${ev.location}` : ''}
            </p>
          </IonLabel>
          <IonBadge
            slot="end"
            color="medium"
            style={{ textTransform: 'capitalize' }}
          >
            {ev.type}
          </IonBadge>
        </IonItem>
      ))}
    </IonList>
  );
}
