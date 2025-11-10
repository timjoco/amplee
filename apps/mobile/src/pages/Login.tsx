import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAppOrigin, getErrorMessage } from '../lib/appEnv';
import { supabase } from '../lib/supabase';

type Status = 'idle' | 'sending' | 'sent' | 'verifying' | 'error';

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');

  const origin = useMemo(() => getAppOrigin(), []);
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);
  const invite = qs.get('invite');
  const next = qs.get('next') ?? '/home';

  const validateEmail = useCallback((val: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    setEmailError(ok ? '' : 'Enter a valid email address');
    return ok;
  }, []);

  const validateCode = useCallback((val: string) => {
    const ok = /^\d{6}$/.test(val.trim());
    setCodeError(ok ? '' : 'Enter the 6-digit code');
    return ok;
  }, []);

  const onSubmitEmail = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage('');
      if (!validateEmail(email)) return;

      setStatus('sending');
      try {
        // mirror web redirect: /auth/callback?invite=...
        const redirectTo = `${origin}/auth/callback${
          invite ? `?invite=${encodeURIComponent(invite)}` : ''
        }`;
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;

        setStatus('sent');
        setMessage('We emailed you a login link and a 6-digit code.');
      } catch (err) {
        setStatus('error');
        setMessage(
          getErrorMessage(err) || 'Something went wrong sending your code.'
        );
      }
    },
    [email, invite, origin, validateEmail]
  );

  const onVerifyCode = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage('');
      if (!validateEmail(email) || !validateCode(code)) return;

      setStatus('verifying');
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'email',
        });
        if (error) throw error;

        const dest = invite
          ? `${next}?invite=${encodeURIComponent(invite)}`
          : next;
        nav(dest, { replace: true });
      } catch (err) {
        setStatus('error');
        setMessage(getErrorMessage(err) || 'Invalid or expired code.');
      }
    },
    [email, code, invite, next, nav, validateEmail, validateCode]
  );

  const resend = useCallback(async () => {
    if (!validateEmail(email)) return;
    try {
      setStatus('sending');
      setMessage('');
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      setStatus('sent');
      setMessage('Code resent. Check your email.');
    } catch (err) {
      setStatus('error');
      setMessage(getErrorMessage(err) || 'Could not resend code.');
    }
  }, [email, origin, validateEmail]);

  const changeEmail = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setCode('');
  }, []);

  const isSending = status === 'sending';
  const isVerifying = status === 'verifying';
  const showCodeStep =
    status === 'sent' ||
    status === 'verifying' ||
    (status === 'error' && code.length > 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Log in to Amplee</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Card */}
        <div
          className="amp-card"
          style={{ maxWidth: 560, margin: '24px auto' }}
        >
          <h2 className="amp-title" style={{ marginTop: 0 }}>
            Log in to Amplee
          </h2>
          <p className="amp-sub" style={{ marginTop: 4 }}>
            Enter your email and we’ll send a 6-digit code
          </p>

          {!!message && (
            <div
              role="status"
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: status === 'error' ? '#3b1120' : '#113b26',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {message}
            </div>
          )}

          {/* Step 1: request code */}
          {!showCodeStep && (
            <form noValidate onSubmit={onSubmitEmail} style={{ marginTop: 12 }}>
              <IonList inset>
                <IonItem>
                  <IonInput
                    type="email"
                    label="Email"
                    labelPlacement="floating"
                    placeholder="you@band.com"
                    value={email}
                    onIonChange={(e) => setEmail(e.detail.value || '')}
                    onIonBlur={() => validateEmail(email)}
                    required
                  />
                </IonItem>
              </IonList>
              {emailError && <IonText color="danger">{emailError}</IonText>}

              <IonButton
                className="amp-btn"
                expand="block"
                type="submit"
                style={{ marginTop: 12 }}
                disabled={isSending}
              >
                {isSending ? 'Sending…' : 'Send Code'}
              </IonButton>
            </form>
          )}

          {/* Step 2: verify code */}
          {showCodeStep && (
            <form noValidate onSubmit={onVerifyCode} style={{ marginTop: 12 }}>
              <IonList inset>
                <IonItem>
                  <IonInput
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    label="6-digit code"
                    labelPlacement="floating"
                    placeholder="••••••"
                    maxlength={6}
                    value={code}
                    onIonChange={(e) => {
                      const v = (e.detail.value || '')
                        .replace(/\D/g, '')
                        .slice(0, 6);
                      setCode(v);
                      if (status === 'error') setMessage('');
                      if (v.length === 6) setCodeError('');
                    }}
                    onIonBlur={() => validateCode(code)}
                    required
                  />
                </IonItem>
              </IonList>
              {codeError && <IonText color="danger">{codeError}</IonText>}

              <IonButton
                className="amp-btn"
                expand="block"
                type="submit"
                style={{ marginTop: 12 }}
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? 'Verifying…' : 'Verify & Continue'}
              </IonButton>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <IonButton fill="clear" onClick={changeEmail}>
                  Change email
                </IonButton>
                <IonButton fill="clear" onClick={resend}>
                  Resend code
                </IonButton>
              </div>
            </form>
          )}

          <p className="amp-sub" style={{ marginTop: 10 }}>
            Didn’t get it? Check spam, or try again in about a minute.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
