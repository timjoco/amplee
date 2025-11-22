/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  close as closeIcon,
  peopleOutline,
} from 'ionicons/icons';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateBand } from '../../src/hooks/useCreateBand';
import { createEvent, type EventType } from '../../src/lib/events/createEvents';

import { supabase } from '../lib/supabase';

type BandLite = { id: string; name: string; avatar_url?: string | null };

export type GlobalCreateMobileProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBandCreated?: (band: BandLite) => void;
};

type Step = 'menu' | 'newBand' | 'newEvent';

const normalizeCreateEventError = (e: any) => {
  const msg = String(e?.message ?? e ?? '');
  const code = e?.code ?? e?.status;
  if (code === '42501' || /row[- ]level security/i.test(msg)) {
    return "You don't have permission to create events for this band.";
  }
  if (code === 401 || code === 403) {
    return "You're not allowed to create events for this band.";
  }
  return 'Could not create the event. Please try again.';
};

const mergeLocalBands = (a: BandLite[], b: BandLite[]) => {
  const map = new Map<string, BandLite>();
  [...a, ...b].forEach((x) =>
    map.set(x.id, map.get(x.id) ? { ...map.get(x.id)!, ...x } : x)
  );
  return Array.from(map.values()).sort((x, y) => x.name.localeCompare(y.name));
};

const mapBands = (rows: any[] | null | undefined): BandLite[] =>
  (rows ?? [])
    .map((r: any) => r?.bands)
    .filter(Boolean)
    .map((b: any) => ({
      id: String(b.id),
      name: String(b.name ?? ''),
      avatar_url: b.avatar_url ?? null,
    }));

export default function GlobalCreateMobile({
  open: openProp,
  onOpenChange,
  onBandCreated,
}: GlobalCreateMobileProps) {
  const nav = useNavigate();

  const isControlled = typeof openProp === 'boolean';
  const [openUnc, setOpenUnc] = React.useState(false);
  const open = isControlled ? (openProp as boolean) : openUnc;
  const setOpen = React.useCallback(
    (v: boolean) => (isControlled ? onOpenChange?.(v) : setOpenUnc(v)),
    [isControlled, onOpenChange]
  );

  const [step, setStep] = React.useState<Step>('menu');

  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ open: boolean; msg: string }>({
    open: false,
    msg: '',
  });

  // ---- Bands for event creation ----
  const [bands, setBands] = React.useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = React.useState(false);

  // ---- New Band form ----
  const [bandName, setBandName] = React.useState('');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  // ---- New Event form ----
  const [eventBandId, setEventBandId] = React.useState<string>('');
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventType, setEventType] = React.useState<EventType>('show');
  const [eventStarts, setEventStarts] = React.useState('');
  const [eventEnds, setEventEnds] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');

  const {
    createBand,
    loading: creatingBand,
    error: createBandErr,
    resetError,
  } = useCreateBand();

  React.useEffect(() => {
    const onOpen = () => {
      setStep('menu');
      setOpen(true);
    };

    const onClose = () => setOpen(false);

    const onAmpleeGlobalCreate = (evt: Event) => {
      const custom = evt as CustomEvent<
        { kind?: string; bandId?: string } | undefined
      >;
      const detail = custom.detail || {};

      if (detail.kind === 'event') {
        setStep('newEvent');
        if (detail.bandId) {
          setEventBandId(detail.bandId);
        }
      } else {
        setStep('menu');
      }

      setOpen(true);
    };

    window.addEventListener('global-create:open', onOpen);
    window.addEventListener('global-create:close', onClose);
    window.addEventListener(
      'amplee:global-create',
      onAmpleeGlobalCreate as any
    );

    return () => {
      window.removeEventListener('global-create:open', onOpen);
      window.removeEventListener('global-create:close', onClose);
      window.removeEventListener(
        'amplee:global-create',
        onAmpleeGlobalCreate as any
      );
    };
  }, [setOpen]);

  React.useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const closeAll = React.useCallback(() => {
    setOpen(false);
    setStep('menu');
    setError(null);
    resetError?.();

    setBandName('');
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);

    setEventBandId('');
    setEventTitle('');
    setEventType('show');
    setEventStarts('');
    setEventEnds('');
    setEventLocation('');
  }, [avatarPreview, resetError, setOpen]);

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setToast({ open: true, msg: 'Please choose an image file.' });
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      setToast({ open: true, msg: 'Max file size is 3MB.' });
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    e.currentTarget.value = '';
  };

  const ensureBandsLoaded = React.useCallback(async () => {
    setLoadingBands(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setToast({ open: true, msg: 'Please sign in first.' });
        setLoadingBands(false);
        return;
      }
      try {
        const { error: rpcErr } = await supabase.rpc('ensure_profile');
        if (rpcErr && rpcErr.code !== '42883') {
          console.warn('[ensure_profile]', rpcErr.message);
        }
      } catch {}
      const { data, error: bmErr } = await supabase
        .from('band_members')
        .select('role, bands(id, name, avatar_url)')
        .eq('user_id', user.id);
      if (bmErr) throw bmErr;
      const mapped = mapBands(data);
      setBands((prev) => mergeLocalBands(prev, mapped));
      if (mapped.length && !eventBandId) setEventBandId(mapped[0].id);
    } catch (e: any) {
      setError(String(e?.message ?? 'Failed to load your bands'));
    } finally {
      setLoadingBands(false);
    }
  }, [eventBandId]);

  React.useEffect(() => {
    if (!open) return;
    if (step === 'newEvent') ensureBandsLoaded();
  }, [open, step, ensureBandsLoaded]);

  React.useEffect(() => {
    if (open) {
      setError(null);
      resetError?.();
    }
  }, [open, resetError]);

  const submitCreateBand = React.useCallback(async () => {
    const name = bandName.trim();
    if (!name) {
      setToast({ open: true, msg: 'Enter a band name.' });
      return;
    }
    try {
      setError(null);
      const created = await createBand({ name, avatarFile });
      if (!created?.id) throw new Error('Could not create band');

      setBands((prev) =>
        mergeLocalBands(prev, [
          {
            id: created.id,
            name: created.name,
            avatar_url: created.avatar_url ?? null,
          },
        ])
      );

      onBandCreated?.(created);
      closeAll();
      nav(`/bands/${created.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Could not create band');
    }
  }, [bandName, avatarFile, createBand, onBandCreated, nav, closeAll]);

  const submitCreateEvent = React.useCallback(async () => {
    if (!eventBandId) {
      setToast({ open: true, msg: 'Choose a band.' });
      return;
    }
    if (!eventTitle.trim()) {
      setToast({ open: true, msg: 'Add a title.' });
      return;
    }
    if (!eventStarts) {
      setToast({ open: true, msg: 'Pick a start date/time.' });
      return;
    }
    try {
      const id = await createEvent({
        bandId: eventBandId,
        title: eventTitle.trim(),
        type: eventType,
        startsAt: new Date(eventStarts),
        endsAt: eventEnds ? new Date(eventEnds) : null,
        location: eventLocation || null,
      });
      closeAll();
      nav(`/bands/${eventBandId}/events/${id}`);
    } catch (e: any) {
      setError(normalizeCreateEventError(e));
    }
  }, [
    eventBandId,
    eventTitle,
    eventType,
    eventStarts,
    eventEnds,
    eventLocation,
    nav,
    closeAll,
  ]);

  return (
    <>
      {/* Modal */}
      <IonModal
        isOpen={open}
        onDidDismiss={() => setOpen(false)}
        presentingElement={undefined}
      >
        <IonHeader>
          <IonToolbar color="dark">
            <IonTitle>
              {step === 'menu'
                ? 'Create'
                : step === 'newBand'
                ? 'Create Band'
                : 'Create Event'}
            </IonTitle>

            <IonButtons slot="end">
              <IonButton
                onClick={closeAll}
                aria-label="Close"
                style={{ marginRight: 4 }}
              >
                <IonIcon icon={closeIcon} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent
          className="ion-padding"
          style={{
            ['--padding-top' as any]: 'calc(env(safe-area-inset-top) + 8px)',
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,0,0,0.28)',
                background: 'rgba(255,0,0,0.06)',
              }}
            >
              <IonText color="danger">{error}</IonText>
            </div>
          )}

          {createBandErr && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,0,0,0.28)',
                background: 'rgba(255,0,0,0.06)',
              }}
            >
              <IonText color="danger">{createBandErr}</IonText>
            </div>
          )}

          {step === 'menu' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                padding: '4px 4px 24px',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <IonText color="light">
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                      opacity: 0.75,
                    }}
                  >
                    Start something new
                  </p>
                </IonText>
              </div>

              {/* New Band card */}
              <button
                type="button"
                onClick={() => setStep('newBand')}
                style={{
                  width: '100%',
                  borderRadius: 20,
                  padding: '14px 16px',
                  border: 'none',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(139, 92, 246, 0.55)',

                  color: '#E5E7EB',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'radial-gradient(circle at 30% 0%, rgba(244,244,245,0.18), transparent 60%)',
                  }}
                >
                  <IonIcon icon={peopleOutline} style={{ fontSize: 22 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                    }}
                  >
                    New Band
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.8,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Start a new group or solo project in one tap.
                  </div>
                </div>
              </button>

              {/* New Event card */}
              <button
                type="button"
                onClick={() => setStep('newEvent')}
                style={{
                  width: '100%',
                  borderRadius: 20,
                  padding: '14px 16px',
                  border: 'none',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(52, 211, 153, 0.55)',

                  color: '#E5E7EB',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'radial-gradient(circle at 30% 0%, rgba(244,244,245,0.18), transparent 60%)',
                  }}
                >
                  <IonIcon icon={calendarOutline} style={{ fontSize: 22 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                    }}
                  >
                    New Event
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.8,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Create a show or practice and invite your band.
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'newBand' && (
            <>
              <IonList lines="full">
                <IonItem>
                  <IonLabel position="stacked">Band name</IonLabel>
                  <IonInput
                    value={bandName}
                    placeholder="e.g., Teem and Tiger"
                    onIonInput={(e) =>
                      setBandName(String(e.detail.value ?? ''))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitCreateBand();
                    }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Avatar (optional)</IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <IonAvatar style={{ width: 64, height: 64 }}>
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="Preview" />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            background: 'rgba(255,255,255,0.08)',
                            color: '#fff',
                          }}
                        >
                          {bandName.trim().slice(0, 2).toUpperCase() || '??'}
                        </div>
                      )}
                    </IonAvatar>

                    <IonButton fill="outline">
                      <label style={{ cursor: 'pointer' }}>
                        {avatarPreview ? 'Change avatar' : 'Add avatar'}
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={pickAvatar}
                        />
                      </label>
                    </IonButton>
                  </div>
                </IonItem>
              </IonList>

              <div style={{ height: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton
                  fill="outline"
                  onClick={() => {
                    setError(null);
                    resetError?.();
                    setBandName('');
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    setAvatarPreview(null);
                    setAvatarFile(null);
                    setStep('menu');
                  }}
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={submitCreateBand}
                  disabled={!bandName.trim() || creatingBand}
                >
                  {creatingBand ? (
                    <>
                      <IonSpinner name="dots" />
                      &nbsp;Creating…
                    </>
                  ) : (
                    'Create Band'
                  )}
                </IonButton>
              </div>
            </>
          )}

          {step === 'newEvent' && (
            <>
              <IonList lines="full">
                <IonItem>
                  <IonLabel position="stacked">Band</IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                    }}
                  >
                    <IonSelect
                      interface="popover"
                      value={eventBandId}
                      onIonChange={(e) =>
                        setEventBandId(String(e.detail.value))
                      }
                      onIonFocus={() => {
                        if (!bands.length) ensureBandsLoaded();
                      }}
                    >
                      {loadingBands && (
                        <IonSelectOption value="" disabled>
                          Loading…
                        </IonSelectOption>
                      )}
                      {!loadingBands &&
                        bands.map((b) => (
                          <IonSelectOption key={b.id} value={b.id}>
                            {b.name}
                          </IonSelectOption>
                        ))}
                    </IonSelect>
                    {loadingBands && <IonSpinner name="dots" />}
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Title</IonLabel>
                  <IonInput
                    value={eventTitle}
                    placeholder="e.g., Show @ The Rino"
                    onIonInput={(e) =>
                      setEventTitle(String(e.detail.value ?? ''))
                    }
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Type</IonLabel>
                  <IonSelect
                    interface="popover"
                    value={eventType}
                    onIonChange={(e) =>
                      setEventType(e.detail.value as EventType)
                    }
                  >
                    <IonSelectOption value="show">Show</IonSelectOption>
                    <IonSelectOption value="practice">Practice</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Starts</IonLabel>
                  <input
                    type="datetime-local"
                    value={eventStarts}
                    onChange={(e) => setEventStarts(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: 'inherit',
                      padding: '8px 0',
                      border: 'none',
                      outline: 'none',
                    }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Ends (optional)</IonLabel>
                  <input
                    type="datetime-local"
                    value={eventEnds}
                    onChange={(e) => setEventEnds(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: 'inherit',
                      padding: '8px 0',
                      border: 'none',
                      outline: 'none',
                    }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Location (optional)</IonLabel>
                  <IonInput
                    value={eventLocation}
                    onIonInput={(e) =>
                      setEventLocation(String(e.detail.value ?? ''))
                    }
                    placeholder="123 Main St"
                  />
                </IonItem>
              </IonList>

              <div style={{ height: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton
                  fill="outline"
                  onClick={() => {
                    setEventTitle('');
                    setEventType('show');
                    setEventStarts('');
                    setEventEnds('');
                    setEventLocation('');
                    setStep('menu');
                  }}
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={submitCreateEvent}
                  disabled={!eventBandId || !eventTitle.trim() || !eventStarts}
                >
                  Create Event
                </IonButton>
              </div>
            </>
          )}
        </IonContent>
      </IonModal>

      {/* Toast */}
      <IonToast
        isOpen={toast.open}
        message={toast.msg}
        duration={2200}
        onDidDismiss={() => setToast({ open: false, msg: '' })}
      />
    </>
  );
}
