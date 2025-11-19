import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiBase, getErrorMessage } from '../lib/appEnv';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = React.useMemo(() => new URLSearchParams(search), [search]);
  const invite = qs.get('invite') ?? undefined;
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      const api = getApiBase();

      // 1) get (or wait for) session
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr) {
        if (mounted) setError(sessionErr.message);
        return;
      }
      const session = sessionData?.session ?? null;

      // 2) preview invite, fetch invited email
      let inviteEmail: string | undefined;
      if (invite) {
        try {
          const res = await fetch(
            `${api}/api/invites/${encodeURIComponent(invite)}`
          );
          const ct = res.headers.get('content-type') || '';
          const payload = ct.includes('application/json')
            ? await res.json()
            : await res.text();
          if (!res.ok) {
            const msg =
              typeof payload === 'string'
                ? payload
                : payload?.error ||
                  'This invite link is invalid or already used.';
            if (mounted) setError(msg);
            return;
          }
          inviteEmail = (payload?.invite?.email || '').toLowerCase();
        } catch (e) {
          if (mounted) setError(getErrorMessage(e));
          return;
        }
      }

      // 3) if invite but no session, bounce to login prefilled then back here
      if (invite && !session) {
        nav(
          `/login?email=${encodeURIComponent(
            inviteEmail || ''
          )}&next=${encodeURIComponent(`/auth/callback?invite=${invite}`)}`,
          { replace: true }
        );
        return;
      }

      // 4) if logged in mismatch email, sign out and force correct login
      if (invite && session) {
        const userEmail = session.user?.email?.toLowerCase?.() || '';
        if (inviteEmail && userEmail && inviteEmail !== userEmail) {
          await supabase.auth.signOut();
          nav(
            `/login?email=${encodeURIComponent(
              inviteEmail
            )}&next=${encodeURIComponent(`/auth/callback?invite=${invite}`)}`,
            { replace: true }
          );
          return;
        }
      }

      // 5) accept invite
      if (invite && session) {
        try {
          const acceptRes = await fetch(
            `${api}/api/invites/${encodeURIComponent(invite)}/accept`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }
          );
          const ct = acceptRes.headers.get('content-type') || '';
          const payload = ct.includes('application/json')
            ? await acceptRes.json()
            : await acceptRes.text();
          if (!acceptRes.ok) {
            const msg =
              typeof payload === 'string'
                ? payload
                : payload?.error ||
                  `${acceptRes.status} ${acceptRes.statusText}`;
            throw new Error(msg);
          }
        } catch (e) {
          if (mounted)
            setError(getErrorMessage(e) || 'Invite acceptance failed');
          return;
        }
      }

      // 6) route by onboarded
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        nav('/login', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded')
        .maybeSingle();
      if (!profile || profile.onboarded === false) {
        nav('/onboarding', { replace: true });
      } else {
        nav('/home', { replace: true });
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [nav, search, invite]);

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="dark">
            <IonTitle>Login error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div
            className="amp-card"
            style={{ maxWidth: 560, margin: '24px auto' }}
          >
            <p style={{ color: '#ffb3c1' }}>{error}</p>
            <IonButton
              className="amp-btn"
              onClick={() => (window.location.href = '/login')}
            >
              Back to login
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Signing you in…</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div
          className="amp-card"
          style={{ maxWidth: 560, margin: '24px auto', textAlign: 'center' }}
        >
          <p>Signing you in… This only takes a moment.</p>
        </div>
      </IonContent>
    </IonPage>
  );
}
