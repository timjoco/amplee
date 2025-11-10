/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonContent, IonPage, IonSpinner, IonText } from '@ionic/react';
import * as React from 'react';
import BandGridMobile, {
  BandWithRole,
} from '../components/Bands/BandGridMobile';
import EventInboxListMobile from '../components/Events/EventsInboxListMobile';
import { supabase } from '../lib/supabase';

/** Flatten band_members rows into BandWithRole[], handling both object and array relation shapes */
function flattenMembershipRows(rows: any[]): BandWithRole[] {
  const out: BandWithRole[] = [];
  for (const r of rows ?? []) {
    const role = r?.role === 'admin' ? 'admin' : 'member';
    const rel = r?.bands;

    // bands can be:
    // 1) an object: { id, name, avatar_url }
    // 2) an array:  [{ id, name, avatar_url }, ...]
    if (!rel) continue;

    if (Array.isArray(rel)) {
      for (const b of rel) {
        if (b?.id) {
          out.push({
            id: String(b.id),
            name: String(b.name ?? ''),
            role,
            avatar_url: (b.avatar_url ?? null) as string | null,
          });
        }
      }
    } else if (rel && rel.id) {
      out.push({
        id: String(rel.id),
        name: String(rel.name ?? ''),
        role,
        avatar_url: (rel.avatar_url ?? null) as string | null,
      });
    }
  }
  return out;
}

export default function Home() {
  const [bands, setBands] = React.useState<BandWithRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const user = userRes?.user;
        if (!user) {
          // Not logged in → show empty state instead of rendering nothing
          if (alive) {
            setBands([]);
            setLoading(false);
          }
          return;
        }

        // IMPORTANT: request relation as "bands(id,name,avatar_url)"
        const { data, error } = await supabase
          .from('band_members')
          .select('role, bands(id,name,avatar_url)')
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('[mobile] band_members raw →', data);
        const flat = flattenMembershipRows(data ?? []);
        console.log('[mobile] bands flattened →', flat);

        if (alive) {
          setBands(flat);
          setLoading(false);
        }
      } catch (e: any) {
        console.error('[Home load error]', e);
        if (alive) {
          setErr(e?.message ?? 'Failed to load your bands');
          setBands([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="ion-padding"
        style={
          {
            // add safe-area + extra pixels for comfy spacing
            '--padding-top': 'calc(env(safe-area-inset-top) + 16px)',
          } as React.CSSProperties
        }
      >
        {/* BANDS */}
        <IonText color="light">
          <h4 style={{ margin: '0 0 8px', fontWeight: 800 }}>Bands</h4>
        </IonText>

        {/* Optional tiny status row below the header */}
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <IonSpinner name="dots" />
            <IonText color="medium">Loading your bands…</IonText>
          </div>
        ) : err ? (
          <div style={{ marginBottom: 8 }}>
            <IonText color="danger">{err}</IonText>
          </div>
        ) : null}

        {/* Bands grid */}
        <BandGridMobile
          bands={bands}
          selectedId={undefined}
          onSelect={() => {}}
        />

        {/* EVENTS */}
        <div style={{ marginTop: 24 }}>
          <IonText color="light">
            <h4 style={{ margin: '0 0 8px', fontWeight: 800 }}>Events</h4>
          </IonText>

          <EventInboxListMobile showAvatars onLoaded={() => {}} />

          {!loading && bands.length === 0 && !err ? (
            <div style={{ marginTop: 8 }}>
              <IonText color="medium">
                You’re not in any bands yet. Join or create one to see events.
              </IonText>
            </div>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
}
