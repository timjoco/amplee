import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
};

export default function Event() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id,title,starts_at,location')
        .eq('id', id)
        .maybeSingle();
      if (alive) setEvent(data ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{event?.title ?? 'Event'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {!event ? (
          'Loading…'
        ) : (
          <>
            <p>{new Date(event.starts_at).toLocaleString()}</p>
            <p>{event.location || 'No location'}</p>
            <IonButton
              expand="block"
              onClick={() => navigate(`/greenroom/${event.id}`)}
            >
              Open Green Room
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
