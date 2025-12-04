/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  checkmarkCircle,
  chevronBackOutline,
  closeCircleOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import EventDateTimePicker from '../components/ui/EventDateTimePicker';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type AvailabilityStatus = 'open' | 'limited' | 'unavailable';

type AvailabilityRow = {
  status: AvailabilityStatus;
  status_note: string | null;
  away_until: string | null;
};

// ─────────────────────────────────────────────────────────────
// Status Configuration
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AvailabilityStatus,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  open: {
    label: 'Available',
    description: 'Good to go for gigs & rehearsals',
    color: '#23a559',
    bgColor: 'rgba(35, 165, 89, 0.12)',
    borderColor: 'rgba(35, 165, 89, 0.4)',
    glowColor: 'rgba(35, 165, 89, 0.2)',
  },
  limited: {
    label: 'Maybe',
    description: 'Check with me first',
    color: '#f0b232',
    bgColor: 'rgba(240, 178, 50, 0.12)',
    borderColor: 'rgba(240, 178, 50, 0.4)',
    glowColor: 'rgba(240, 178, 50, 0.2)',
  },
  unavailable: {
    label: 'Busy',
    description: "Can't commit right now",
    color: '#ed4245',
    bgColor: 'rgba(237, 66, 69, 0.12)',
    borderColor: 'rgba(237, 66, 69, 0.4)',
    glowColor: 'rgba(237, 66, 69, 0.2)',
  },
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function ProfileAvailabilityPage() {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [availability, setAvailability] =
    React.useState<AvailabilityRow | null>(null);

  // Auto-save state
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle');
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const initialLoadRef = React.useRef(true);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  // ─────────────────────────────────────────────────────────────
  // Load availability on mount
  // ─────────────────────────────────────────────────────────────

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error(authErr);
        if (alive) {
          setError('Unable to load session.');
          setLoading(false);
        }
        return;
      }

      const user = auth?.user ?? null;
      if (!user) {
        if (alive) {
          setError('You are not signed in.');
          setLoading(false);
        }
        return;
      }

      const { data: avail, error: availErr } = await supabase
        .from('profile_availability')
        .select('status, status_note, away_until')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!alive) return;

      if (availErr) {
        console.error(availErr);
      }

      setAvailability({
        status: (avail?.status as AvailabilityStatus) ?? 'open',
        status_note: avail?.status_note ?? null,
        away_until: avail?.away_until ?? null,
      });

      setLoading(false);
      // Mark initial load complete after a tick
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 100);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Auto-save when availability changes
  // ─────────────────────────────────────────────────────────────

  React.useEffect(() => {
    // Don't save on initial load
    if (initialLoadRef.current || !availability) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 800ms
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      setSaveError(null);

      try {
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const user = auth?.user ?? null;
        if (!user) throw new Error('You are not signed in.');

        const { error: upsertErr } = await supabase
          .from('profile_availability')
          .upsert(
            {
              profile_id: user.id,
              status: availability.status,
              status_note: availability.status_note?.trim() || null,
              away_until: availability.away_until || null,
            },
            { onConflict: 'profile_id' }
          );

        if (upsertErr) throw upsertErr;

        setSaveStatus('saved');
        // Reset to idle after showing "saved"
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        console.error(err);
        setSaveStatus('error');
        setSaveError(err.message ?? 'Unable to save.');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [availability]);

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  const currentConfig = availability
    ? STATUS_CONFIG[availability.status]
    : STATUS_CONFIG.open;

  const formatAwayDate = (dateStr: string) => {
    const date = dateStr.includes('T')
      ? new Date(dateStr)
      : new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const awayUntilAsISO = availability?.away_until
    ? availability.away_until.includes('T')
      ? availability.away_until
      : `${availability.away_until}T23:59:00`
    : undefined;

  const handleAwayDateChange = (iso: string | null) => {
    if (!iso) {
      setAvailability((prev) => (prev ? { ...prev, away_until: null } : prev));
      return;
    }
    const dateOnly = iso.split('T')[0];
    setAvailability((prev) =>
      prev ? { ...prev, away_until: dateOnly } : prev
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#F9FAFB',
                  margin: 0,
                }}
              >
                Set Your Availability
              </h1>
              <div style={{ fontSize: 13, color: '#949ba4', marginTop: 2 }}>
                Helps your bands plan around your schedule
              </div>
            </div>

            {/* Auto-save indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 8,
                background:
                  saveStatus === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              {saveStatus === 'saving' && (
                <>
                  <IonSpinner
                    style={{ '--color': '#949ba4', width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: 11, color: '#949ba4' }}>
                    Saving...
                  </span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <IonIcon
                    icon={cloudDoneOutline}
                    style={{ fontSize: 14, color: '#23a559' }}
                  />
                  <span style={{ fontSize: 11, color: '#23a559' }}>Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <IonIcon
                    icon={cloudOfflineOutline}
                    style={{ fontSize: 14, color: '#ed4245' }}
                  />
                  <span style={{ fontSize: 11, color: '#ed4245' }}>Error</span>
                </>
              )}
              {saveStatus === 'idle' && (
                <>
                  <IonIcon
                    icon={cloudDoneOutline}
                    style={{ fontSize: 14, color: '#949ba4' }}
                  />
                  <span style={{ fontSize: 11, color: '#949ba4' }}>
                    Auto-save
                  </span>
                </>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading && (
          <div
            style={{ display: 'grid', placeItems: 'center', height: '100%' }}
          >
            <IonSpinner style={{ '--color': '#34d399' }} />
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 8,
              height: '100%',
              padding: '0 24px',
            }}
          >
            <IonText>
              <p
                style={{ color: '#ef4444', fontSize: 14, textAlign: 'center' }}
              >
                {error}
              </p>
            </IonText>
          </div>
        )}

        {!loading && !error && availability && (
          <div
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: '0 16px 32px',
            }}
          >
            {/* Status Selection Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
                marginTop: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#b5bac1' }}>
                How's your schedule?
              </span>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 14,
                }}
              >
                {(Object.keys(STATUS_CONFIG) as AvailabilityStatus[]).map(
                  (status) => {
                    const config = STATUS_CONFIG[status];
                    const isActive = availability.status === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setAvailability((prev) =>
                            prev
                              ? { ...prev, status }
                              : { status, status_note: null, away_until: null }
                          )
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: isActive
                            ? `1px solid ${config.borderColor}`
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          background: isActive
                            ? config.bgColor
                            : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive
                            ? `0 0 20px ${config.glowColor}`
                            : 'none',
                          outline: 'none',
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: config.color,
                            boxShadow: isActive
                              ? `0 0 8px ${config.color}`
                              : 'none',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: isActive ? '#f9fafb' : '#d1d5db',
                              marginBottom: 2,
                            }}
                          >
                            {config.label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'rgba(255, 255, 255, 0.45)',
                            }}
                          >
                            {config.description}
                          </div>
                        </div>
                        {isActive && (
                          <IonIcon
                            icon={checkmarkCircle}
                            style={{
                              fontSize: 20,
                              color: config.color,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Status Note Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
                marginTop: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: '#b5bac1' }}
                >
                  Add a note{' '}
                  <span style={{ fontWeight: 400, color: '#949ba4' }}>
                    (optional)
                  </span>
                </span>
                {availability.status_note && (
                  <button
                    type="button"
                    onClick={() =>
                      setAvailability((prev) =>
                        prev ? { ...prev, status_note: null } : prev
                      )
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: 12,
                      color: '#949ba4',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <textarea
                rows={2}
                maxLength={140}
                placeholder="e.g., Weekends only, touring in March..."
                value={availability.status_note ?? ''}
                onChange={(e) =>
                  setAvailability((prev) =>
                    prev
                      ? { ...prev, status_note: e.target.value }
                      : {
                          status: 'open',
                          status_note: e.target.value,
                          away_until: null,
                        }
                  )
                }
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#e5e7eb',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <span
                  style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.35)' }}
                >
                  Visible to band admins when scheduling
                </span>
                <span
                  style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.3)' }}
                >
                  {availability.status_note?.length ?? 0} / 140
                </span>
              </div>
            </div>

            {/* Away Until Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
                marginTop: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: '#b5bac1' }}
                >
                  Back on...{' '}
                  <span style={{ fontWeight: 400, color: '#949ba4' }}>
                    (optional)
                  </span>
                </span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setShowDatePicker(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowDatePicker(true);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: availability.away_until
                    ? '1px solid rgba(139, 92, 246, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: availability.away_until
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon
                    icon={calendarOutline}
                    style={{
                      fontSize: 18,
                      color: availability.away_until
                        ? '#a78bfa'
                        : 'rgba(255, 255, 255, 0.4)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: availability.away_until ? 600 : 400,
                      color: availability.away_until
                        ? '#e5e7eb'
                        : 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    {availability.away_until
                      ? formatAwayDate(availability.away_until)
                      : 'Select a date...'}
                  </span>
                </div>

                {availability.away_until && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvailability((prev) =>
                        prev ? { ...prev, away_until: null } : prev
                      );
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IonIcon
                      icon={closeCircleOutline}
                      style={{
                        fontSize: 18,
                        color: 'rgba(255, 255, 255, 0.4)',
                      }}
                    />
                  </button>
                )}
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.35)',
                  marginTop: 10,
                  lineHeight: 1.4,
                }}
              >
                Set a date when you'll be back and available again.
              </p>
            </div>

            {/* Preview Card */}
            <div
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 16,
                padding: '18px 20px',
                marginTop: 12,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#b5bac1',
                }}
              >
                Preview
              </span>

              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 20,
                    background: currentConfig.bgColor,
                    border: `1px solid ${currentConfig.borderColor}`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: currentConfig.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: currentConfig.color,
                    }}
                  >
                    {currentConfig.label}
                  </span>
                </div>

                {(availability.away_until || availability.status_note) && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 12,
                    }}
                  >
                    {availability.away_until && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        <IonIcon
                          icon={calendarOutline}
                          style={{ fontSize: 12 }}
                        />
                        <span>
                          Back {formatAwayDate(availability.away_until)}
                        </span>
                      </div>
                    )}
                    {availability.status_note && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontStyle: 'italic',
                        }}
                      >
                        "{availability.status_note}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Info Callout */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '14px 16px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 12,
                marginTop: 12,
              }}
            >
              <IonIcon
                icon={informationCircleOutline}
                style={{
                  color: '#60a5fa',
                  fontSize: 18,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: '#b5bac1',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Your availability shows up when band admins are picking dates
                for events. It syncs across all your bands automatically.
              </p>
            </div>

            {/* Save Error */}
            {saveError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginTop: 12,
                  fontSize: 13,
                  color: '#fca5a5',
                }}
              >
                {saveError}
              </div>
            )}
          </div>
        )}

        <EventDateTimePicker
          open={showDatePicker}
          label="Back on"
          value={awayUntilAsISO}
          min={new Date().toISOString()}
          onChange={handleAwayDateChange}
          onDismiss={() => setShowDatePicker(false)}
        />
      </IonContent>
    </IonPage>
  );
}
