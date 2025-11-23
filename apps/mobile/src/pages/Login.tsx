import logo from '@amplee/assets/logo.png';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText,
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
        <IonToolbar color="black"></IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ background: '#0a0a0a' }}>
        {/* Background gradient accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background:
              'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Login Card */}
        <div
          className="amp-card"
          style={{
            maxWidth: 480,
            margin: '48px auto',
            position: 'relative',
            zIndex: 1,
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Logo/Brand */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: 20,
                marginBottom: 16,
                boxShadow: '0 8px 24px rgba(147, 51, 234, 0.3)',
                padding: 12,
              }}
            >
              <img
                src={logo}
                alt="Amplee"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome to Amplee
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 400,
              }}
            >
              {showCodeStep
                ? 'Enter the code we sent to your email'
                : 'Sign in to amplify your music'}
            </p>
          </div>

          {/* Status Message */}
          {!!message && (
            <div
              role="status"
              style={{
                marginBottom: 24,
                padding: '14px 16px',
                borderRadius: 12,
                background:
                  status === 'error'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(34, 197, 94, 0.1)',
                border: `1px solid ${
                  status === 'error'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(34, 197, 94, 0.3)'
                }`,
                color: status === 'error' ? '#fca5a5' : '#86efac',
                fontSize: 14,
                fontWeight: 500,
                animation: 'slideIn 0.3s ease',
              }}
            >
              {message}
            </div>
          )}

          {/* Step 1: Email Input */}
          {!showCodeStep && (
            <form noValidate onSubmit={onSubmitEmail}>
              <div style={{ marginBottom: 20 }}>
                <IonList
                  inset
                  style={{
                    background: 'rgba(30, 30, 30, 0.5)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <IonItem
                    style={{
                      '--background': 'transparent',
                      '--border-color': 'transparent',
                    }}
                  >
                    <IonInput
                      type="email"
                      label="Email address"
                      labelPlacement="floating"
                      placeholder="you@band.com"
                      value={email}
                      onIonChange={(e) => setEmail(e.detail.value || '')}
                      onIonBlur={() => validateEmail(email)}
                      required
                      style={{
                        '--color': '#fff',
                        '--placeholder-color': 'rgba(255, 255, 255, 0.4)',
                      }}
                    />
                  </IonItem>
                </IonList>
                {emailError && (
                  <IonText
                    color="danger"
                    style={{
                      fontSize: 13,
                      marginLeft: 4,
                      marginTop: 6,
                      display: 'block',
                    }}
                  >
                    {emailError}
                  </IonText>
                )}
              </div>

              <IonButton
                className="amp-btn"
                expand="block"
                type="submit"
                disabled={isSending}
                style={{
                  '--background':
                    'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  '--background-hover':
                    'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  '--border-radius': '12px',
                  '--box-shadow': '0 4px 12px rgba(147, 51, 234, 0.3)',
                  '--padding-top': '14px',
                  '--padding-bottom': '14px',
                  fontSize: 16,
                  fontWeight: 600,
                  textTransform: 'none',
                  marginTop: 8,
                }}
              >
                {isSending ? (
                  <span
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Sending...
                  </span>
                ) : (
                  'Continue with Email'
                )}
              </IonButton>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {showCodeStep && (
            <form noValidate onSubmit={onVerifyCode}>
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 12,
                    background: 'rgba(147, 51, 234, 0.1)',
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  Code sent to{' '}
                  <strong style={{ color: '#c084fc' }}>{email}</strong>
                </div>

                <IonList
                  inset
                  style={{
                    background: 'rgba(30, 30, 30, 0.5)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <IonItem
                    style={{
                      '--background': 'transparent',
                      '--border-color': 'transparent',
                    }}
                  >
                    <IonInput
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      label="Verification code"
                      labelPlacement="floating"
                      placeholder="000000"
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
                      style={{
                        '--color': '#fff',
                        '--placeholder-color': 'rgba(255, 255, 255, 0.3)',
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textAlign: 'center',
                      }}
                    />
                  </IonItem>
                </IonList>
                {codeError && (
                  <IonText
                    color="danger"
                    style={{
                      fontSize: 13,
                      marginLeft: 4,
                      marginTop: 6,
                      display: 'block',
                    }}
                  >
                    {codeError}
                  </IonText>
                )}
              </div>

              <IonButton
                className="amp-btn"
                expand="block"
                type="submit"
                disabled={isVerifying || code.length !== 6}
                style={{
                  '--background':
                    'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  '--background-hover':
                    'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  '--border-radius': '12px',
                  '--box-shadow': '0 4px 12px rgba(147, 51, 234, 0.3)',
                  '--padding-top': '14px',
                  '--padding-bottom': '14px',
                  fontSize: 16,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {isVerifying ? (
                  <span
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Verifying...
                  </span>
                ) : (
                  'Verify & Continue'
                )}
              </IonButton>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center',
                  marginTop: 20,
                }}
              >
                <IonButton
                  fill="clear"
                  onClick={changeEmail}
                  style={{
                    '--color': 'rgba(255, 255, 255, 0.6)',
                    '--color-hover': '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: 'none',
                  }}
                >
                  Change email
                </IonButton>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                <IonButton
                  fill="clear"
                  onClick={resend}
                  style={{
                    '--color': '#a78bfa',
                    '--color-hover': '#c084fc',
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: 'none',
                  }}
                >
                  Resend code
                </IonButton>
              </div>
            </form>
          )}

          {/* Footer Help Text */}
          <p
            style={{
              marginTop: 24,
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Didn't receive the code? Check your spam folder or wait a minute
            before requesting a new one.
          </p>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          ion-input {
            --padding-start: 16px !important;
            --padding-end: 16px !important;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
}
