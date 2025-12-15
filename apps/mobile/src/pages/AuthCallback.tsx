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
import { getApiBase, getAppOrigin, getErrorMessage } from '../lib/appEnv';
import { supabase } from '../lib/supabase';

function safeNext(raw: string | null | undefined) {
  if (!raw) return '/home';
  const v = raw.trim();
  if (!v.startsWith('/')) return '/home';
  if (v.startsWith('//')) return '/home';
  return v;
}

export default function AuthCallback() {
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = React.useMemo(() => new URLSearchParams(search), [search]);

  const invite = qs.get('invite') ?? undefined;
  const next = React.useMemo(() => safeNext(qs.get('next') ?? '/home'), [qs]);

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      const api = getApiBase();
      const origin = getAppOrigin();

      // 1) get (or wait for) session
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr) {
        if (mounted) setError(sessionErr.message);
        return;
      }
      const session = sessionData?.session ?? null;

      // 2) preview invite, fetch invited email (if invite present)
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

          // payload shape: your normalizeInvite supports either {invite:{...}} or direct
          const email = (payload?.invite?.email ??
            payload?.email ??
            '') as string;
          inviteEmail = email.toLowerCase();
        } catch (e) {
          if (mounted) setError(getErrorMessage(e));
          return;
        }
      }

      // Helper: build a callback URL that preserves BOTH invite + next
      const callbackUrl = (() => {
        const u = new URL(`${origin}/auth/callback`);
        if (invite) u.searchParams.set('invite', invite);
        if (next) u.searchParams.set('next', next);
        return `${u.pathname}${u.search}`; // in-app relative path for react-router
      })();

      // 3) if invite but no session, bounce to login (prefill email optional) then back here
      if (invite && !session) {
        const loginQs = new URLSearchParams();
        if (inviteEmail) loginQs.set('email', inviteEmail);
        loginQs.set('next', callbackUrl);
        nav(`/login?${loginQs.toString()}`, { replace: true });
        return;
      }

      // 4) if logged in mismatch email, sign out and force correct login
      if (invite && session) {
        const userEmail = (session.user?.email ?? '').toLowerCase();
        if (inviteEmail && userEmail && inviteEmail !== userEmail) {
          await supabase.auth.signOut();

          const loginQs = new URLSearchParams();
          if (inviteEmail) loginQs.set('email', inviteEmail);
          loginQs.set('next', callbackUrl);
          nav(`/login?${loginQs.toString()}`, { replace: true });
          return;
        }
      }

      // 5) accept invite (and capture bandId if returned)
      let acceptedBandId: string | undefined;
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

          // support { bandId } or { band_id }
          acceptedBandId = (payload?.bandId ?? payload?.band_id) as
            | string
            | undefined;
        } catch (e) {
          if (mounted)
            setError(getErrorMessage(e) || 'Invite acceptance failed');
          return;
        }
      }

      // 6) ensure we have a user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        if (mounted) setError(userErr.message);
        return;
      }
      const user = userData?.user;
      if (!user) {
        // no user -> go login, preserving next
        const loginQs = new URLSearchParams();
        loginQs.set('next', next);
        nav(`/login?${loginQs.toString()}`, { replace: true });
        return;
      }

      // Optional: ensure profile exists
      try {
        const { error: rpcErr } = await supabase.rpc('ensure_profile');
        if (rpcErr && rpcErr.code !== '42883') {
          console.warn('[ensure_profile] RPC error:', rpcErr.message);
        }
      } catch (e) {
        console.warn('[ensure_profile] failed:', e);
      }

      // 7) route by onboarded
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .maybeSingle();

      if (pErr) {
        console.warn('[profile check error]', pErr);
      }

      // Final destination rules:
      // - If user not onboarded => onboarding first, preserve intended destination
      // - Else => go to next
      // - If next is still /home but invite acceptance returned bandId, prefer band page
      const inviteDest =
        acceptedBandId && (next === '/home' || next === '/')
          ? `/bands/${encodeURIComponent(acceptedBandId)}`
          : next;

      const finalDest =
        profile?.onboarded === true
          ? inviteDest
          : `/onboarding?next=${encodeURIComponent(inviteDest)}`;

      nav(finalDest, { replace: true });
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [nav, invite, next, search]);

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
              onClick={() => nav('/login', { replace: true })}
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
