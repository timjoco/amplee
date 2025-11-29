/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { afterLoginPath, getLastEmail, getRedirectParam } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email] = useState(getLastEmail());
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
      return;
    }
    inputs.current[0]?.focus();
  }, [email, navigate]);

  const onKey =
    (idx: number) => (e: React.FormEvent<HTMLInputElement> | any) => {
      const v = (e.target as HTMLInputElement).value
        .replace(/\D/g, '')
        .slice(0, 1);
      const next = [...code];
      next[idx] = v;
      setCode(next);
      if (v && idx < 5) inputs.current[idx + 1]?.focus();
    };

  const onKeyDown =
    (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !code[idx] && idx > 0) {
        inputs.current[idx - 1]?.focus();
      }
    };

  const verify = async () => {
    setErr(null);
    const token = code.join('');
    if (token.length !== 6) {
      setErr('Enter the 6-digit code.');
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;

      await supabase.auth.getSession();
      const r = getRedirectParam();
      navigate(r || afterLoginPath(), { replace: true });
    } catch (e: any) {
      setErr(e?.message || 'Invalid or expired code.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle className="amp-title">Verify email</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div
          className="amp-card"
          style={{ maxWidth: 520, margin: '40px auto' }}
        >
          <p className="amp-sub" style={{ marginTop: 0 }}>
            Enter the 6-digit code sent to <b>{email}</b>.
          </p>

          <div className="otp-row" role="group" aria-label="One time code">
            {code.map((c, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                className="otp-box"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={c}
                onChange={onKey(i)}
                onKeyDown={onKeyDown(i)}
              />
            ))}
          </div>

          {err && (
            <IonText color="danger" style={{ display: 'block', marginTop: 12 }}>
              {err}
            </IonText>
          )}

          <IonButton
            className="amp-btn"
            expand="block"
            style={{ marginTop: 16 }}
            onClick={verify}
            disabled={verifying}
          >
            {verifying ? 'Verifying…' : 'Verify'}
          </IonButton>

          <IonButton
            className="amp-btn-outline"
            expand="block"
            style={{ marginTop: 10 }}
            onClick={() => navigate('/login')}
          >
            Use a different email
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
