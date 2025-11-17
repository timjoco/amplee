/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import BandGridMobile from '../components/Bands/BandGridMobile';
import EventInboxListMobile from '../components/Events/EventsInboxListMobile';
import { getBandsCache, setBandsCache } from '../lib/bandCache';
import { supabase } from '../lib/supabase';
import type { BandWithRole } from '../types/bands';

export default function Home() {
  const nav = useNavigate();

  const initial = getBandsCache();
  const [bands, setBands] = React.useState<BandWithRole[]>(initial.bands);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setRefreshing(true);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        if (alive) {
          setBands([]);
          setBandsCache([]);
          setRefreshing(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('band_members')
        .select('role, bands(id, name, avatar_url)')
        .eq('user_id', uid);

      if (!alive) return;
      if (error) {
        console.warn('[Home] band_members error:', error.message);
        setRefreshing(false);
        return;
      }

      const normalized: BandWithRole[] = (data ?? [])
        .map((row: any) => {
          const b = Array.isArray(row.bands) ? row.bands[0] : row.bands;
          if (!b) return null;
          return {
            id: String(b.id),
            name: String(b.name ?? ''),
            role: row.role === 'admin' ? 'admin' : 'member',
            avatar_url: b.avatar_url ?? null,
          } as BandWithRole;
        })
        .filter(Boolean) as BandWithRole[];

      console.log(
        '[Home] normalized bands:',
        normalized.map((b) => ({ id: b.id, name: b.name, role: b.role }))
      );

      setBandsCache(normalized);
      setBands(normalized);
      setRefreshing(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <IonPage>
      {/* Top app header */}
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          ['--padding-top' as any]: '0px',
          ['--padding-start' as any]: '0px',
          ['--padding-end' as any]: '0px',
          ['--padding-bottom' as any]:
            'calc(16px + 56px + env(safe-area-inset-bottom))',
          paddingTop: '0px',
          paddingInline: 0,
          paddingBottom: 'calc(16px + 56px + env(safe-area-inset-bottom))',
          backgroundColor: '#050509',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '8px 16px 24px', // 👈 was 16px top, now 8px
          }}
        >
          {/* Bands section */}
          <IonText color="light">
            <h2
              style={{
                margin: '0 0 10px',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 0.2,
              }}
            >
              Bands
            </h2>
          </IonText>

          <div
            style={{
              paddingInline: 12,
            }}
          >
            <BandGridMobile
              bands={bands}
              selectedId={undefined}
              onSelect={(b) => nav(`/bands/${b.id}`)}
              gapPx={10}
              avatarSize={88}
            />
          </div>

          {/* Margin between bands + events */}
          <div
            style={{
              height: 1,
              margin: '18px 0 12px',
            }}
          />

          {/* Events section */}
          <IonText color="light">
            <h2
              style={{
                margin: '0 0 10px',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 0.2,
              }}
            >
              Events
            </h2>
          </IonText>
          <div
            style={{
              marginInline: -4,
            }}
          >
            <EventInboxListMobile showAvatars onLoaded={() => {}} />
          </div>

          {!refreshing && bands.length === 0 && (
            <IonText color="medium">
              <p
                style={{
                  marginTop: 12,
                  fontSize: 14,
                }}
              >
                You’re not in any bands yet. Join or create one to see events.
              </p>
            </IonText>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
