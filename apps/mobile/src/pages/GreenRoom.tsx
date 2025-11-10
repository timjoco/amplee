import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Message = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export default function GreenRoom() {
  const { eventId } = useParams<{ eventId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('event_messages')
      .select('id,user_id,body,created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`event:${eventId}:messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    await supabase.from('event_messages').insert({
      event_id: eventId,
      user_id: userRes.user.id,
      body: text.trim(),
    });
    setText('');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/event/${eventId}`} />
          </IonButtons>
          <IonTitle>Green Room</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div ref={listRef}>
          <IonList>
            {messages.map((m) => (
              <IonItem key={m.id}>
                <IonLabel>
                  <h3>{new Date(m.created_at).toLocaleTimeString()}</h3>
                  <p>{m.body}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonContent>
      <IonFooter>
        <IonItem>
          <IonInput
            value={text}
            placeholder="Message…"
            onIonChange={(e) => setText(e.detail.value ?? '')}
          />
          <IonButton slot="end" onClick={send}>
            Send
          </IonButton>
        </IonItem>
      </IonFooter>
    </IonPage>
  );
}
