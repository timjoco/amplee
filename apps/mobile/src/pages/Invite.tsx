import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type InvitePreview = {
  ok: boolean;
  token: string;
  bandId: string;
  email: string;
  role: 'member' | 'admin' | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  bandName?: string | null;
  inviterEmail?: string | null;
};

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchInvite = useMemo(
    () => async () => {
      setLoading(true);
      setErr(null);
      const res = await fetch(
        `/api/invites/${encodeURIComponent(token || '')}`
      );
      if (!res.ok) {
        setErr(await res.text());
        setLoading(false);
        return;
      }
      setInvite(await res.json());
      setLoading(false);
    },
    [token]
  );

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  const onContinue = async () => {
    setErr(null);
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`, {
        replace: true,
      });
      return;
    }
    const sessionEmail = (data.session.user.email ?? '').toLowerCase();
    const inviteEmail = (invite?.email ?? '').toLowerCase();
    if (inviteEmail && sessionEmail && inviteEmail !== sessionEmail) {
      setLoading(false);
      setErr(
        `You are signed in as ${sessionEmail}, but this invite is for ${inviteEmail}. Sign out and sign in as the invited email.`
      );
      return;
    }
    const resp = await fetch(
      `/api/invites/${encodeURIComponent(token || '')}/accept`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      }
    );
    if (!resp.ok) {
      setLoading(false);
      setErr(await resp.text());
      return;
    }
    const { bandId } = await resp.json();
    // Optional: call profiles to check onboarding like web, then:
    navigate(`/bands/${bandId}`, { replace: true });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Band Invite</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          'Loading invite…'
        ) : err ? (
          <IonText color="danger">{err}</IonText>
        ) : !invite ? null : (
          <>
            <h2>Join {invite.bandName || 'this band'}</h2>
            <p>
              You were invited{' '}
              {invite.inviterEmail ? `by ${invite.inviterEmail}` : ''} to join
              as <b>{invite.role ?? 'member'}</b>.
            </p>
            {invite.status !== 'pending' ? (
              <IonText color="danger">
                This invite is <b>{invite.status}</b>.
              </IonText>
            ) : (
              <IonButton expand="block" onClick={onContinue}>
                Continue
              </IonButton>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
