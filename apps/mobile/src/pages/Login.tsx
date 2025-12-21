import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText,
} from '@ionic/react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAppOrigin, getErrorMessage } from '../lib/appEnv';
import { supabase } from '../lib/supabase';

type Status = 'idle' | 'sending' | 'sent' | 'verifying' | 'error';

interface Orb {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

function safeNext(raw: string | null | undefined) {
  // Only allow in-app relative paths
  if (!raw) return '/home';
  const v = raw.trim();
  if (!v.startsWith('/')) return '/home';
  if (v.startsWith('//')) return '/home';
  return v;
}

export default function Login() {
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('amplee:login-email') ?? '';
    } catch {
      return '';
    }
  });

  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window === 'undefined') return 'idle';
    try {
      const savedStatus = localStorage.getItem('amplee:login-status');
      return savedStatus === 'sent' ? 'sent' : 'idle';
    } catch {
      return 'idle';
    }
  });

  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [orbs, setOrbs] = useState<Orb[]>([]);

  const origin = useMemo(() => getAppOrigin(), []);
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  // Invite param is optional; next is the path we should return to.
  const invite = qs.get('invite');
  const next = useMemo(() => safeNext(qs.get('next') ?? '/home'), [qs]);

  const LOGO_SRC = '/assets/icon/logo-transparent.png';

  // Persist email
  useEffect(() => {
    try {
      if (email.trim()) localStorage.setItem('amplee:login-email', email);
      else localStorage.removeItem('amplee:login-email');
    } catch {}
  }, [email]);

  // Persist "sent" state
  useEffect(() => {
    try {
      if (status === 'sent')
        localStorage.setItem('amplee:login-status', 'sent');
      else if (status === 'idle')
        localStorage.removeItem('amplee:login-status');
    } catch {}
  }, [status]);

  // Generate cosmic orbs
  useEffect(() => {
    const colors = [
      'rgba(147, 51, 234, 0.3)',
      'rgba(124, 58, 237, 0.35)',
      'rgba(168, 85, 247, 0.3)',
      'rgba(192, 132, 252, 0.25)',
    ];

    const generatedOrbs = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      size: Math.random() * 180 + 100,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.4 + 0.2,
      color: colors[i % colors.length],
    }));
    setOrbs(generatedOrbs);
  }, []);

  const validateEmail = useCallback((val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('');
      return false;
    }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    setEmailError(ok ? '' : 'Enter a valid email address');
    return ok;
  }, []);

  const validateCode = useCallback((val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setCodeError('');
      return false;
    }
    const ok = /^\d{6}$/.test(trimmed);
    setCodeError(ok ? '' : 'Enter the 6-digit code');
    return ok;
  }, []);

  const buildRedirectTo = useCallback(() => {
    // Keep next + invite in the callback URL so deep link callback can route correctly
    const url = new URL(`${origin}/auth/callback`);
    url.searchParams.set('next', next);
    if (invite) url.searchParams.set('invite', invite);
    return url.toString();
  }, [origin, next, invite]);

  const onSubmitEmail = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage('');
      if (!validateEmail(email)) return;

      setStatus('sending');
      try {
        const redirectTo = buildRedirectTo();

        const { data, error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        });

        setStatus('sent');
        setMessage('We emailed you a login link and a 6-digit code.');
      } catch (err) {
        setStatus('error');
        setMessage(
          getErrorMessage(err) || 'Something went wrong sending your code.'
        );
      }
    },
    [email, validateEmail, buildRedirectTo]
  );

  const onVerifyCode = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage('');
      if (!validateEmail(email) || !validateCode(code)) return;

      setStatus('verifying');
      try {
        // 1) Verify OTP and create Supabase session
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'email',
        });
        if (error) throw error;

        // 2) Fetch user
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!user) throw new Error('No user after verifying code');

        // 3) Ensure profile row exists (optional RPC)
        try {
          const { error: rpcErr } = await supabase.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883') {
            console.warn('[ensure_profile] RPC error:', rpcErr.message);
          }
        } catch (rpcErr) {
          console.warn('[ensure_profile] call failed:', rpcErr);
        }

        // 4) Onboarding status
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (pErr) console.warn('[onboarding check error]', pErr);

        // Clear login state
        try {
          localStorage.removeItem('amplee:login-email');
          localStorage.removeItem('amplee:login-status');
        } catch {}

        const baseDest = next; // already safeNext()
        const finalDest =
          profile?.onboarded === true
            ? baseDest
            : `/onboarding?next=${encodeURIComponent(baseDest)}`;

        nav(finalDest, { replace: true });
      } catch (err) {
        setStatus('error');
        setMessage(getErrorMessage(err) || 'Invalid or expired code.');
      }
    },
    [email, code, next, nav, validateEmail, validateCode]
  );

  const resend = useCallback(async () => {
    if (!validateEmail(email)) return;
    try {
      setStatus('sending');
      setMessage('');

      const redirectTo = buildRedirectTo();

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      setStatus('sent');
      setMessage('Code resent. Check your email.');
    } catch (err) {
      setStatus('error');
      setMessage(getErrorMessage(err) || 'Could not resend code.');
    }
  }, [email, validateEmail, buildRedirectTo]);

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
      <IonContent
        className="ion-padding"
        style={{
          background:
            'linear-gradient(to bottom right, #0f0720, #1a0a2e, #0a0a0a)',
          overflow: 'hidden',
        }}
      >
        {/* Cosmic Orbs */}
        {orbs.map((orb) => (
          <div
            key={orb.id}
            style={{
              position: 'absolute',
              width: orb.size,
              height: orb.size,
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: orb.color,
              filter: 'blur(30px)',
              opacity: orb.opacity,
              animation: `ampFloat ${orb.duration}s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`,
              zIndex: 0,
            }}
          />
        ))}

        {/* Main Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 480,
            margin: '0 auto',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          {/* Logo */}
          <div
            className="amp-fade-in"
            style={{
              textAlign: 'center',
              marginBottom: 32,
              animation: 'ampScaleIn 0.6s ease-out forwards',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 96,
                height: 96,
                borderRadius: 24,
                marginBottom: 20,
                boxShadow: '0 12px 32px rgba(147, 51, 234, 0.4)',
                background: 'rgba(137, 35, 232, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(147, 51, 234, 0.3)',
              }}
            >
              <img
                src={LOGO_SRC}
                alt="Amplee"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(147, 51, 234, 0.5))',
                }}
              />
            </div>

            <h1
              style={{
                margin: '0 0 12px',
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              <div style={{ color: '#ffffff' }}>WELCOME TO</div>
              <div
                style={{
                  background:
                    'linear-gradient(135deg, #c084fc 0%, #9333ea 50%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginTop: 4,
                }}
              >
                AMPLEE
              </div>
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
                padding: '0 32px',
                lineHeight: 1.5,
              }}
            >
              {showCodeStep
                ? 'Enter the code we sent to your email'
                : 'Simplify the chaos, amplify your music. Tap below to get started!'}
            </p>
          </div>

          {/* Form Card */}
          <div
            className="amp-fade-in-up"
            style={{
              background: 'rgba(15, 7, 32, 0.6)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(147, 51, 234, 0.2)',
              borderRadius: 20,
              padding: '32px 24px',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 80px rgba(147, 51, 234, 0.1)',
              animation: 'ampFadeInUp 0.8s ease-out 0.2s forwards',
              opacity: 0,
            }}
          >
            {!!message && (
              <div
                role="status"
                style={{
                  marginBottom: 20,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background:
                    status === 'error'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(34, 197, 94, 0.15)',
                  border: `1px solid ${
                    status === 'error'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : 'rgba(34, 197, 94, 0.4)'
                  }`,
                  color: status === 'error' ? '#fca5a5' : '#86efac',
                  fontSize: 14,
                  fontWeight: 500,
                  animation: 'ampSlideIn 0.3s ease',
                }}
              >
                {message}
              </div>
            )}

            {/* Step 1 */}
            {!showCodeStep && (
              <form noValidate onSubmit={onSubmitEmail}>
                <div style={{ marginBottom: 16 }}>
                  <IonList
                    inset
                    style={{
                      background: 'rgba(20, 10, 35, 0.6)',
                      borderRadius: 14,
                      border: '1px solid rgba(147, 51, 234, 0.2)',
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
                        onIonBlur={() => email.trim() && validateEmail(email)}
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
                      'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    '--border-radius': '14px',
                    '--box-shadow': '0 6px 20px rgba(147, 51, 234, 0.4)',
                    '--padding-top': '16px',
                    '--padding-bottom': '16px',
                    fontSize: 16,
                    fontWeight: 700,
                    textTransform: 'none',
                    marginTop: 8,
                  }}
                >
                  {isSending ? 'Sending...' : 'Continue with Email'}
                </IonButton>
              </form>
            )}

            {/* Step 2 */}
            {showCodeStep && (
              <form noValidate onSubmit={onVerifyCode}>
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 14,
                      borderRadius: 12,
                      background: 'rgba(147, 51, 234, 0.15)',
                      border: '1px solid rgba(147, 51, 234, 0.3)',
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.9)',
                      textAlign: 'center',
                    }}
                  >
                    Code sent to{' '}
                    <strong style={{ color: '#c084fc' }}>{email}</strong>
                  </div>

                  <IonList
                    inset
                    style={{
                      background: 'rgba(20, 10, 35, 0.6)',
                      borderRadius: 14,
                      border: '1px solid rgba(147, 51, 234, 0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <IonItem
                      style={{
                        '--background': 'transparent',
                        '--border-color': 'transparent',
                        maxWidth: 220,
                        width: '100%',
                        margin: '0 auto',
                      }}
                    >
                      <IonInput
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
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
                        onIonBlur={() => code.trim() && validateCode(code)}
                        required
                        style={{
                          '--color': '#fff',
                          '--placeholder-color': 'rgba(255, 255, 255, 0.3)',
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: '0.35em',
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
                      'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    '--border-radius': '14px',
                    '--box-shadow': '0 6px 20px rgba(147, 51, 234, 0.4)',
                    '--padding-top': '16px',
                    '--padding-bottom': '16px',
                    fontSize: 16,
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                </IonButton>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'center',
                    marginTop: 20,
                    alignItems: 'center',
                  }}
                >
                  <IonButton
                    fill="clear"
                    onClick={changeEmail}
                    style={{
                      '--color': 'rgba(255, 255, 255, 0.6)',
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: 'auto',
                    }}
                  >
                    Change email
                  </IonButton>
                  <span
                    style={{ color: 'rgba(147, 51, 234, 0.4)', fontSize: 18 }}
                  >
                    •
                  </span>
                  <IonButton
                    fill="clear"
                    onClick={resend}
                    style={{
                      '--color': '#a78bfa',
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: 'auto',
                    }}
                  >
                    Resend code
                  </IonButton>
                </div>
              </form>
            )}
          </div>
        </div>

        <style>{`
          @keyframes ampFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(40px, -40px) scale(1.1); }
            50% { transform: translate(-30px, 30px) scale(0.9); }
            75% { transform: translate(50px, 15px) scale(1.05); }
          }
          @keyframes ampScaleIn {
            from { opacity: 0; transform: scale(0.85); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes ampFadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes ampSlideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          ion-input {
            --padding-start: 16px !important;
            --padding-end: 16px !important;
          }
          .amp-btn:active { transform: scale(0.98); }
        `}</style>
      </IonContent>
    </IonPage>
  );
}
