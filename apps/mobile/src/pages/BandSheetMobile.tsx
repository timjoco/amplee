/* eslint-disable react-hooks/rules-of-hooks */
// apps/mobile/src/components/Bands/BandSheetMobile.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonModal,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import BandTitleMenuMobile from '../../../mobile/src/components/Bands/BandTitleMenuMobile';
import EventInboxListMobile from '../../../mobile/src/components/Events/EventsInboxListMobile';
import AvatarImageMobile from '../../../mobile/src/components/ui/AvatarImageMobile';
import { supabase } from '../../../mobile/src/lib/supabase';

type MembershipRole = 'admin' | 'member';

export default function BandSheetMobile() {
  // ---- Route param ----
  const { id: maybeId } = useParams<{ id?: string }>();
  if (!maybeId) return null; // guard until router provides the id
  const bandId = maybeId as string;

  // ---- Local state ----
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [bandName, setBandName] = React.useState<string>('Band');
  const [bandAvatarPath, setBandAvatarPath] = React.useState<string | null>(
    null
  );
  const [myRole, setMyRole] = React.useState<MembershipRole>('member');

  // Invitation UI (opened from BandTitleMenuMobile → onInvite)
  const [inviteOpen, setInviteOpen] = React.useState(false);

  // ---- Load band + role ----
  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // ensure user
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!alive) return;
        if (!user) {
          setError('You must be signed in to view this band.');
          return;
        }

        // membership role
        const { data: mem, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band.');
          return;
        }
        setMyRole((mem.role as MembershipRole) ?? 'member');

        // band record
        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('id, name, avatar_url')
          .eq('id', bandId)
          .maybeSingle();
        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found.');
          return;
        }

        setBandName(band.name ?? 'Band');
        setBandAvatarPath(band.avatar_url ?? null);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load band');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  return (
    <IonPage>
      {/* Header keeps the surface consistent with app; title area left blank (menu handles name) */}
      <IonHeader translucent>
        <IonToolbar color="dark">
          <IonTitle />
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding"
        style={{
          // give breathing room; aligns with your dashboard spacing
          ['--padding-top' as any]: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        {/* Status / error */}
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <IonSpinner name="dots" />
            <IonText color="medium">Loading band…</IonText>
          </div>
        ) : error ? (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(255,0,0,0.25)',
              background: 'rgba(255,0,0,0.06)',
            }}
          >
            <IonText color="danger">{error}</IonText>
          </div>
        ) : null}

        {/* Header strip (avatar + title menu trigger) */}
        {!loading && !error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <AvatarImageMobile
              name={bandName}
              bucket="band-avatars"
              avatarPath={bandAvatarPath ?? undefined}
              size={56}
              style={{
                border: '2px solid rgba(255,255,255,0.06)',
                backgroundImage:
                  'radial-gradient(120% 120% at 20% 15%, rgba(139,92,246,0.16) 0%, transparent 55%)',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Band name is clickable → shows the band menu (invite, settings, leave, etc.) */}
              <BandTitleMenuMobile
                bandId={bandId}
                bandName={bandName}
                isAdmin={myRole === 'admin'}
                onInvite={() => setInviteOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Events list (for this band only) */}
        {!loading && !error && (
          <>
            <IonText color="light">
              <h4 style={{ margin: '0 0 10px', fontWeight: 800 }}>Events</h4>
            </IonText>
            <EventInboxListMobile bandId={bandId} showAvatars />
          </>
        )}

        {/* -------- Invite Modal (placeholder) -------- */}
        <IonModal isOpen={inviteOpen} onDidDismiss={() => setInviteOpen(false)}>
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0 }}>Invite member</h2>
            {/* Replace with your real invite form */}
            <IonText color="medium">
              Coming soon — plug in your invite form here.
            </IonText>
            <IonButton onClick={() => setInviteOpen(false)}>Close</IonButton>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
