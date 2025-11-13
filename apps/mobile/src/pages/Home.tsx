/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonContent, IonPage, IonText } from '@ionic/react';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import BandGridMobile from '../components/Bands/BandGridMobile';
import EventInboxListMobile from '../components/Events/EventsInboxListMobile';
import {
  getBandsCache,
  needsBandsRefresh,
  setBandsCache,
} from '../lib/bandCache';
import { supabase } from '../lib/supabase';
import type { BandWithRole } from '../types/bands';

export default function Home() {
  const nav = useNavigate();

  // cache-first
  const initial = getBandsCache();
  const [bands, setBands] = React.useState<BandWithRole[]>(initial.bands);
  const [refreshing, setRefreshing] = React.useState(needsBandsRefresh());

  React.useEffect(() => {
    if (!needsBandsRefresh()) return;

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
      <IonContent
        fullscreen
        className="ion-padding" // ← drop ion-padding
        style={{
          ['--padding-top' as any]:
            'max(16px, calc(env(safe-area-inset-top) + 16px))',
          ['--padding-start' as any]: '12px',
          ['--padding-end' as any]: '12px',
          ['--padding-bottom' as any]: '16px',
          paddingTop: 'max(16px, calc(env(safe-area-inset-top) + 16px))',
          paddingInline: '12px',
          paddingBottom: '16px',
        }}
      >
        <IonText color="light">
          <h4
            style={{
              margin: '0 0 10px',
              fontWeight: 800,
              letterSpacing: 0.2,
            }}
          >
            Bands
          </h4>
        </IonText>

        <BandGridMobile
          bands={bands}
          selectedId={undefined}
          onSelect={(b) => nav(`/bands/${b.id}`)}
          gapPx={8}
          avatarSize={80}
        />

        {/* Events header */}
        <div style={{ marginTop: 18 }}>
          <IonText color="light">
            <h4
              style={{
                margin: '0 0 10px',
                fontWeight: 800,
                letterSpacing: 0.2,
              }}
            >
              Events
            </h4>
          </IonText>

          {/* Unified inbox (cache-first inside component) */}
          <EventInboxListMobile showAvatars onLoaded={() => {}} />

          {!refreshing && bands.length === 0 && (
            <IonText color="medium">
              You’re not in any bands yet. Join or create one to see events.
            </IonText>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
