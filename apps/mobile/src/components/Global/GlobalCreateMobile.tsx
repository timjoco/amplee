/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonToolbar,
} from '@ionic/react';
import {
  alertCircleOutline,
  calendarOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronUpOutline,
  clipboardOutline,
  closeOutline,
  gridOutline,
  musicalNotesOutline,
  personOutline,
  timeOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNewBandForm,
  useNewEventForm,
  useNewProposalForm,
  useNewSongForm,
  type BandLite,
} from '../../hooks/useGlobalCreateForms';
import { supabase } from '../../lib/supabase';
import EventDateTimePicker from '../ui/EventDateTimePicker';
import './GlobalCreateMobile.css';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type GlobalCreateMobileProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBandCreated?: (band: BandLite) => void;
};

type Step = 'menu' | 'newBand' | 'newEvent' | 'newSong' | 'newProposal';

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

type Conflict = {
  profileId?: string;
  name?: string | null;
  reason?: string | null;
  awayUntil?: string | null;
  statusNote?: string | null;
};

type SameDayEvent = {
  id: string;
  title: string;
  type?: string;
};

// Invite selection types
type InviteMode = 'full' | 'roster';

type RosterLite = {
  id: string;
  name: string;
};

type MemberLite = {
  user_id: string;
  name: string;
  role: string;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const normalizeConflicts = (rows: any[] | undefined | null): Conflict[] =>
  (rows ?? []).map((row, idx) => {
    // Try to find a nested profile-ish object
    const nestedProfile =
      row.profile ??
      row.profiles ??
      row.member_profile ??
      row.member?.profile ??
      row.user ??
      null;

    const rawName =
      row.name ??
      row.memberName ??
      row.profile_name ??
      row.display_name ??
      row.full_name ??
      nestedProfile?.display_name ??
      nestedProfile?.full_name ??
      nestedProfile?.name ??
      null;

    return {
      profileId:
        row.profileId ??
        row.memberId ??
        row.profile_id ??
        row.member_id ??
        row.user_id ??
        nestedProfile?.id ??
        `conflict-${idx}`,
      name: rawName,
      reason: row.reason ?? row.status ?? null,
      awayUntil: row.awayUntil ?? row.away_until ?? null,
      statusNote: row.statusNote ?? row.status_note ?? null,
    };
  });

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

// ─────────────────────────────────────────────────────────────
// Event Warnings Component (Availability + Same-day events)
// ─────────────────────────────────────────────────────────────

function EventWarnings({
  conflicts,
  sameDayEvents,
}: {
  conflicts: any[];
  sameDayEvents: SameDayEvent[];
}) {
  const [expandedSection, setExpandedSection] = useState<
    'conflicts' | 'sameDay' | null
  >(null);

  const normalizedConflicts: Conflict[] = normalizeConflicts(conflicts);
  const hasConflicts = normalizedConflicts.length > 0;
  const hasSameDayEvents = sameDayEvents.length > 0;

  if (!hasConflicts && !hasSameDayEvents) return null;

  const totalWarnings = normalizedConflicts.length + sameDayEvents.length;

  const formatReason = (c: Conflict) => {
    if (c.reason === 'status_unavailable') return 'marked as unavailable';
    if (c.awayUntil) {
      const date = new Date(c.awayUntil + 'T00:00:00');
      const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `away until ${formatted}`;
    }
    return 'may have a conflict';
  };

  // Single unified warning card
  return (
    <div
      style={{
        marginTop: 14,
        marginBottom: 16,
        borderRadius: 14,
        background:
          'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        overflow: 'hidden',
      }}
    >
      {/* Main Header */}
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'rgba(251, 191, 36, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IonIcon
            icon={alertCircleOutline}
            style={{ fontSize: 18, color: '#fbbf24' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fde68a',
              marginBottom: 2,
            }}
          >
            {totalWarnings} warning{totalWarnings > 1 ? 's' : ''} found
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(253, 230, 138, 0.6)',
            }}
          >
            You can still create this event
          </div>
        </div>
      </div>

      {/* Availability Conflicts Section */}
      {hasConflicts && (
        <div style={{ borderTop: '1px solid rgba(251, 191, 36, 0.15)' }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSection(
                expandedSection === 'conflicts' ? null : 'conflicts'
              )
            }
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={personOutline}
              style={{ fontSize: 14, color: '#fbbf24' }}
            />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#fde68a',
              }}
            >
              {normalizedConflicts.length} member
              {normalizedConflicts.length > 1 ? 's' : ''} may not be available
            </span>
            <IonIcon
              icon={
                expandedSection === 'conflicts'
                  ? chevronUpOutline
                  : chevronDownOutline
              }
              style={{ fontSize: 14, color: 'rgba(253, 230, 138, 0.5)' }}
            />
          </button>

          {expandedSection === 'conflicts' && (
            <div
              style={{
                padding: '8px 14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {normalizedConflicts.map((c, idx) => {
                const safeName = (c.name ?? '').trim() || 'Unknown';
                const key = c.profileId ?? `conflict-${idx}`;

                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#fde68a',
                        }}
                      >
                        {safeName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#fef3c7',
                          marginBottom: 2,
                        }}
                      >
                        {safeName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(254, 243, 199, 0.6)',
                          lineHeight: 1.4,
                        }}
                      >
                        {formatReason(c)}
                        {c.statusNote && (
                          <span
                            style={{
                              display: 'block',
                              marginTop: 2,
                              fontStyle: 'italic',
                              color: 'rgba(254, 243, 199, 0.5)',
                            }}
                          >
                            "{c.statusNote}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Same Day Events Section */}
      {hasSameDayEvents && (
        <div style={{ borderTop: '1px solid rgba(251, 191, 36, 0.15)' }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSection(
                expandedSection === 'sameDay' ? null : 'sameDay'
              )
            }
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={timeOutline}
              style={{ fontSize: 14, color: '#fbbf24' }}
            />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#fde68a',
              }}
            >
              {sameDayEvents.length} event{sameDayEvents.length > 1 ? 's' : ''}{' '}
              already on this date
            </span>
            <IonIcon
              icon={
                expandedSection === 'sameDay'
                  ? chevronUpOutline
                  : chevronDownOutline
              }
              style={{ fontSize: 14, color: 'rgba(253, 230, 138, 0.5)' }}
            />
          </button>

          {expandedSection === 'sameDay' && (
            <div
              style={{
                padding: '8px 14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {sameDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background:
                        'linear-gradient(135deg, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 12, color: '#6ee7b7' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fef3c7',
                      }}
                    >
                      {ev.title}
                    </div>
                    {ev.type && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(254, 243, 199, 0.5)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {ev.type}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function GlobalCreateMobile({
  open: openProp,
  onOpenChange,
  onBandCreated,
}: GlobalCreateMobileProps) {
  const nav = useNavigate();

  const isControlled = typeof openProp === 'boolean';
  const [openUnc, setOpenUnc] = useState(false);
  const open = isControlled ? (openProp as boolean) : openUnc;
  const setOpen = useCallback(
    (v: boolean) => {
      return isControlled ? onOpenChange?.(v) : setOpenUnc(v);
    },
    [isControlled, onOpenChange]
  );
  const [bandsLoadedOnce, setBandsLoadedOnce] = useState(false);

  const [step, setStep] = useState<Step>('menu');
  const [error, setError] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Bands list for selects
  const [bands, setBands] = useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);

  // Invite UI data (rosters + members)
  const [availableRosters, setAvailableRosters] = useState<RosterLite[]>([]);
  const [bandMembersForInvite, setBandMembersForInvite] = useState<
    MemberLite[]
  >([]);
  const [loadingInviteData, setLoadingInviteData] = useState(false);

  // Form hooks
  const bandForm = useNewBandForm({
    showToast: () => {},
    onError: setError,
  });

  const eventForm = useNewEventForm({
    showToast: () => {},
    onError: setError,
  });

  const songForm = useNewSongForm({
    showToast: () => {},
    onError: setError,
  });

  const proposalForm = useNewProposalForm({
    showToast: () => {},
    onError: setError,
  });

  // Stars
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 3,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  // Orbs
  const orbs = useMemo<Orb[]>(() => {
    const colors = [
      'rgba(147, 51, 234, 0.25)',
      'rgba(124, 58, 237, 0.3)',
      'rgba(168, 85, 247, 0.25)',
      'rgba(192, 132, 252, 0.2)',
    ];

    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: Math.random() * 150 + 80,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -15,
      opacity: Math.random() * 0.4 + 0.2,
      color: colors[i % colors.length],
    }));
  }, []);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[haptic error]', e);
    }
  }, []);

  const handleButtonPress = useCallback(
    (buttonId: string, action: () => void) => {
      setPressedButton(buttonId);
      triggerHaptic();
      setTimeout(() => {
        setPressedButton(null);
        action();
      }, 120);
    },
    [triggerHaptic]
  );

  // Load rosters + members when creating an event (and bandId changes)
  useEffect(() => {
    let alive = true;

    if (!open || step !== 'newEvent' || !eventForm.bandId) return;

    (async () => {
      setLoadingInviteData(true);

      try {
        const [rostersRes, membersRes] = await Promise.all([
          supabase
            .from('band_rosters')
            .select('id, name')
            .eq('band_id', eventForm.bandId)
            .order('created_at', { ascending: false }),

          supabase
            .from('band_members')
            .select(
              `
              user_id,
              role,
              profiles(
                first_name,
                last_name,
                display_name
              )
            `
            )
            .eq('band_id', eventForm.bandId)
            .order('created_at', { ascending: true }),
        ]);

        if (!alive) return;

        if (rostersRes.error) throw rostersRes.error;
        if (membersRes.error) throw membersRes.error;

        setAvailableRosters(rostersRes.data ?? []);

        const formattedMembers =
          (membersRes.data ?? []).map((m: any) => {
            const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;

            const first = (p?.first_name ?? '').trim();
            const last = (p?.last_name ?? '').trim();

            const fullName =
              [first, last].filter(Boolean).join(' ') || 'Unknown';

            return {
              user_id: m.user_id,
              role: m.role,
              name: fullName,
            };
          }) ?? [];

        setBandMembersForInvite(formattedMembers);
      } catch (e: any) {
        console.error('[loadInviteData]', e);
        setError(e.message || 'Failed to load invite data');
      } finally {
        if (alive) setLoadingInviteData(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, step, eventForm.bandId]);

  // Global open/close event handlers
  useEffect(() => {
    const onOpen = () => {
      setStep('menu');
      setOpen(true);
    };

    const onClose = () => setOpen(false);

    const onAmpleeGlobalCreate = (evt: Event) => {
      const custom = evt as CustomEvent<{
        kind?: string;
        type?: string;
        bandId?: string;
        startsAt?: string; // full ISO
        date?: string; // optional "YYYY-MM-DD" fallback
      }>;

      const detail = custom.detail || {};
      const kind = detail.kind ?? detail.type;

      // clear prior errors / event fields when opening
      setError(null);

      if (kind === 'event') {
        setStep('newEvent');

        if (detail.bandId) {
          eventForm.setBandId(detail.bandId);
        }

        if (detail.startsAt) {
          eventForm.setStarts(detail.startsAt);
        } else if (detail.date) {
          const dt = new Date(`${detail.date}T20:00:00`);
          if (!Number.isNaN(+dt)) {
            eventForm.setStarts(dt.toISOString());
          }
        }
      } else if (kind === 'song') {
        setStep('newSong');
        if (detail.bandId) songForm.setBandId(detail.bandId);
      } else if (kind === 'proposal') {
        setStep('newProposal');
        if (detail.bandId) proposalForm.setBandId(detail.bandId);
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
  }, [setOpen, eventForm, songForm, proposalForm]);

  const ensureBandsLoaded = useCallback(async () => {
    setLoadingBands(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: bmErr } = await supabase
        .from('band_members')
        .select('role, bands(id, name, avatar_url)')
        .eq('user_id', user.id);
      if (bmErr) throw bmErr;

      const mapped = mapBands(data);
      setBands((prev) => mergeLocalBands(prev, mapped));

      if (mapped.length && !eventForm.bandId) eventForm.setBandId(mapped[0].id);
      if (mapped.length && !songForm.bandId) songForm.setBandId(mapped[0].id);
      if (mapped.length && !proposalForm.bandId)
        proposalForm.setBandId(mapped[0].id);
    } catch (e: any) {
      setError(String(e?.message ?? 'Failed to load your bands'));
    } finally {
      setLoadingBands(false);
      setBandsLoadedOnce(true);
    }
  }, [eventForm, proposalForm, songForm]);

  useEffect(() => {
    if (!open) return;
    if (!bandsLoadedOnce) {
      void ensureBandsLoaded();
    }
  }, [open, bandsLoadedOnce, ensureBandsLoaded]);

  const closeAll = useCallback(() => {
    setOpen(false);
    setStep('menu');
    setError(null);
    bandForm.reset();
    eventForm.reset();
    songForm.reset();
    proposalForm.reset();
  }, [bandForm, eventForm, songForm, proposalForm, setOpen]);

  const handleSubmitCreateBand = useCallback(async () => {
    const created = await bandForm.submit();
    if (!created) return;

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
  }, [bandForm, closeAll, nav, onBandCreated]);

  const handleSubmitCreateEvent = useCallback(async () => {
    const bypass =
      (eventForm.conflicts?.length || 0) > 0 ||
      (eventForm.sameDayEvents?.length || 0) > 0;

    const id = await eventForm.submit(
      bypass ? { bypassConflicts: true } : undefined
    );
    if (!id) return;

    closeAll();
    nav(`/bands/${eventForm.bandId}/events/${id}`);
  }, [eventForm, closeAll, nav]);

  const handleSubmitCreateSong = useCallback(async () => {
    const id = await songForm.submit();
    if (!id) return;
    closeAll();
    nav(`/bands/${songForm.bandId}/songs/${id}`);
  }, [songForm, closeAll, nav]);

  const handleSubmitCreateProposal = useCallback(async () => {
    const id = await proposalForm.submit();
    if (!id) return;
    closeAll();
    nav(`/bands/${proposalForm.bandId}/proposals/${id}`);
  }, [proposalForm, closeAll, nav]);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  // Get current band ID based on step
  const currentBandId =
    step === 'newEvent'
      ? eventForm.bandId
      : step === 'newSong'
      ? songForm.bandId
      : proposalForm.bandId;

  const handleBandChange = (val: string) => {
    if (step === 'newEvent') {
      eventForm.setBandId(val);

      // reset invite selection when switching bands
      eventForm.setInviteMode('full');
      eventForm.setSelectedRosterId('');
      eventForm.setSelectedUserIds([]);
    } else if (step === 'newSong') {
      songForm.setBandId(val);
    } else {
      proposalForm.setBandId(val);
    }
  };

  // Calculate total warnings for button state
  const totalWarnings =
    (eventForm.conflicts?.length || 0) + (eventForm.sameDayEvents?.length || 0);
  const hasWarnings = totalWarnings > 0;

  const missingInviteSelection =
    (eventForm.inviteMode as InviteMode) === 'roster'
      ? !eventForm.selectedRosterId
      : false;

  return (
    <IonModal isOpen={open} onDidDismiss={closeAll} className="gc-modal-root">
      <IonHeader translucent className="gc-header">
        <IonToolbar className="gc-header">
          <div className="gc-header-content">
            {step !== 'menu' ? (
              <button
                className="gc-header-back"
                onClick={() => {
                  triggerHaptic();
                  setStep('menu');
                }}
              >
                <IonIcon icon={chevronBackOutline} />
              </button>
            ) : (
              <div className="gc-header-spacer" />
            )}

            <h1 className="gc-header-title">
              {step === 'menu' && 'Create'}
              {step === 'newBand' && 'New Band'}
              {step === 'newEvent' && 'New Event'}
              {step === 'newSong' && 'New Song'}
              {step === 'newProposal' && 'New Proposal'}
            </h1>

            <button className="gc-header-close" onClick={closeAll}>
              <IonIcon icon={closeOutline} />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="gc-content">
        {/* Animated Background Orbs */}
        {orbs.map((orb) => (
          <div
            key={orb.id}
            className="gc-orb"
            style={{
              width: orb.size,
              height: orb.size,
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              background: `radial-gradient(circle, ${orb.color}, transparent)`,
              opacity: orb.opacity,
              animation: `gcFloat ${orb.duration}s infinite ease-in-out ${orb.delay}s`,
            }}
          />
        ))}

        {/* Twinkling Stars */}
        <div className="gc-stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="gc-star"
              style={{
                width: star.size,
                height: star.size,
                left: `${star.x}%`,
                top: `${star.y}%`,
                opacity: star.opacity,
                animation: `gcTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="gc-main-content">
          {/* Error message */}
          {(error || bandForm.createBandErr) && (
            <div className="gc-error-box">
              {error || bandForm.createBandErr}
            </div>
          )}

          {/* Menu Step */}
          {step === 'menu' && (
            <div className="gc-menu-container">
              <button
                className={`gc-menu-card gc-menu-card-band ${
                  pressedButton === 'newBand' ? 'pressed' : ''
                }`}
                onClick={() =>
                  handleButtonPress('newBand', () => setStep('newBand'))
                }
              >
                <div className="gc-menu-card-icon">
                  <IonIcon icon={gridOutline} />
                </div>
                <div className="gc-menu-card-content">
                  <div className="gc-menu-card-title">New Band</div>
                  <div className="gc-menu-card-description">
                    Create a new project or solo act
                  </div>
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  className="gc-menu-card-chevron"
                />
              </button>

              {bands.length > 0 && (
                <>
                  <button
                    className={`gc-menu-card gc-menu-card-event ${
                      pressedButton === 'newEvent' ? 'pressed' : ''
                    }`}
                    onClick={() =>
                      handleButtonPress('newEvent', () => setStep('newEvent'))
                    }
                  >
                    <div className="gc-menu-card-icon">
                      <IonIcon icon={calendarOutline} />
                    </div>
                    <div className="gc-menu-card-content">
                      <div className="gc-menu-card-title">New Event</div>
                      <div className="gc-menu-card-description">
                        Schedule a show or rehearsal
                      </div>
                    </div>
                    <IonIcon
                      icon={chevronForwardOutline}
                      className="gc-menu-card-chevron"
                    />
                  </button>

                  <button
                    className={`gc-menu-card gc-menu-card-proposal ${
                      pressedButton === 'newProposal' ? 'pressed' : ''
                    }`}
                    onClick={() =>
                      handleButtonPress('newProposal', () =>
                        setStep('newProposal')
                      )
                    }
                  >
                    <div className="gc-menu-card-icon">
                      <IonIcon icon={clipboardOutline} />
                    </div>
                    <div className="gc-menu-card-content">
                      <div className="gc-menu-card-title">New Proposal</div>
                      <div className="gc-menu-card-description">
                        Pitch a gig idea for your band
                      </div>
                    </div>
                    <IonIcon
                      icon={chevronForwardOutline}
                      className="gc-menu-card-chevron"
                    />
                  </button>

                  <button
                    className={`gc-menu-card gc-menu-card-song ${
                      pressedButton === 'newSong' ? 'pressed' : ''
                    }`}
                    onClick={() =>
                      handleButtonPress('newSong', () => setStep('newSong'))
                    }
                  >
                    <div className="gc-menu-card-icon">
                      <IonIcon icon={musicalNotesOutline} />
                    </div>
                    <div className="gc-menu-card-content">
                      <div className="gc-menu-card-title">New Song</div>
                      <div className="gc-menu-card-description">
                        Add a song to your band's library
                      </div>
                    </div>
                    <IonIcon
                      icon={chevronForwardOutline}
                      className="gc-menu-card-chevron"
                    />
                  </button>
                </>
              )}
            </div>
          )}

          {/* New Band Form */}
          {step === 'newBand' && (
            <div className="gc-form-card gc-form-card-band">
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-band">
                  Band name
                </label>
                <input
                  type="text"
                  className="gc-form-input gc-form-input-band"
                  value={bandForm.bandName}
                  onChange={(e) => bandForm.setBandName(e.target.value)}
                  placeholder="e.g., Teem and Tiger"
                />
              </div>

              <label className="gc-form-label gc-form-label-band">
                Avatar (optional)
              </label>
              <div className="gc-avatar-picker">
                <div className="gc-avatar-preview">
                  {bandForm.avatarPreview ? (
                    <img src={bandForm.avatarPreview} alt="" />
                  ) : (
                    bandForm.bandName.trim().slice(0, 2).toUpperCase() || '??'
                  )}
                </div>
                <button
                  className="gc-avatar-btn"
                  onClick={() => bandForm.fileInputRef.current?.click()}
                >
                  {bandForm.avatarPreview ? 'Change' : 'Add image'}
                </button>
                <input
                  ref={bandForm.fileInputRef}
                  type="file"
                  accept="image/*"
                  className="gc-hidden"
                  onChange={bandForm.pickAvatar}
                />
              </div>

              <button
                className="gc-submit-btn gc-submit-btn-band"
                onClick={handleSubmitCreateBand}
                disabled={!bandForm.bandName.trim() || bandForm.creatingBand}
              >
                {bandForm.creatingBand ? 'Creating…' : 'Create Band'}
              </button>
            </div>
          )}

          {/* New Event Form */}
          {step === 'newEvent' && (
            <div className="gc-form-card gc-form-card-event">
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-event">
                  Band
                </label>
                <div className="gc-select-wrapper">
                  <select
                    className="gc-select gc-form-input-event"
                    value={currentBandId}
                    onChange={(e) => handleBandChange(e.target.value)}
                  >
                    {loadingBands && <option value="">Loading…</option>}
                    {!loadingBands &&
                      bands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                  <IonIcon
                    icon={chevronForwardOutline}
                    className="gc-select-chevron"
                  />
                </div>
              </div>
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-event">
                  Title
                </label>
                <input
                  type="text"
                  className="gc-form-input gc-form-input-event"
                  value={eventForm.title}
                  onChange={(e) => eventForm.setTitle(e.target.value)}
                  placeholder="e.g., Show @ The Rino"
                />
              </div>
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-event">
                  Type
                </label>
                <div className="gc-toggle-group">
                  {['show', 'practice'].map((t) => (
                    <button
                      key={t}
                      className={`gc-toggle-btn ${
                        eventForm.type === t
                          ? 'gc-toggle-btn-active-event'
                          : 'gc-toggle-btn-inactive'
                      }`}
                      onClick={() => eventForm.setType(t as any)}
                      type="button"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-event">
                  Starts
                </label>
                <button
                  className={`gc-date-btn gc-date-btn-event ${
                    eventForm.starts
                      ? 'gc-date-btn-filled'
                      : 'gc-date-btn-empty'
                  }`}
                  onClick={() => eventForm.setShowStartsPicker(true)}
                  type="button"
                >
                  {eventForm.starts
                    ? new Date(eventForm.starts).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Select date & time'}
                </button>
              </div>
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-event">
                  Location (optional)
                </label>
                <input
                  type="text"
                  className="gc-form-input gc-form-input-event"
                  value={eventForm.location}
                  onChange={(e) => eventForm.setLocation(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              {/* Invite Members */}
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-event">
                  Invite
                </label>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`gc-toggle-btn ${
                      (eventForm.inviteMode as InviteMode) === 'full'
                        ? 'gc-toggle-btn-active-event'
                        : 'gc-toggle-btn-inactive'
                    }`}
                    onClick={() => {
                      triggerHaptic();
                      eventForm.setInviteMode('full');
                      eventForm.setSelectedRosterId('');
                      eventForm.setSelectedUserIds([]); // Clear - fetches fresh on submit
                    }}
                  >
                    Full band
                  </button>

                  <button
                    type="button"
                    className={`gc-toggle-btn ${
                      (eventForm.inviteMode as InviteMode) === 'roster'
                        ? 'gc-toggle-btn-active-event'
                        : 'gc-toggle-btn-inactive'
                    }`}
                    onClick={() => {
                      triggerHaptic();
                      eventForm.setInviteMode('roster');
                      eventForm.setSelectedUserIds([]);
                    }}
                  >
                    Roster
                  </button>
                </div>

                {/* Full band mode - no list shown */}
                {(eventForm.inviteMode as InviteMode) === 'full' && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 14,
                      background: 'rgba(52, 211, 153, 0.08)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      color: '#6ee7b7',
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    All band members will be invited.
                  </div>
                )}

                {/* Roster mode - dropdown */}
                {(eventForm.inviteMode as InviteMode) === 'roster' && (
                  <div style={{ marginTop: 10 }}>
                    <div className="gc-select-wrapper">
                      <select
                        className="gc-select gc-form-input-event"
                        value={eventForm.selectedRosterId}
                        onChange={(e) =>
                          eventForm.setSelectedRosterId(e.target.value)
                        }
                        disabled={loadingInviteData}
                      >
                        <option value="">
                          {loadingInviteData
                            ? 'Loading rosters…'
                            : 'Select roster…'}
                        </option>
                        {availableRosters.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <IonIcon
                        icon={chevronForwardOutline}
                        className="gc-select-chevron"
                      />
                    </div>

                    {availableRosters.length === 0 && !loadingInviteData && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 12,
                          borderRadius: 14,
                          background: 'rgba(251, 191, 36, 0.08)',
                          border: '1px solid rgba(251, 191, 36, 0.2)',
                          color: '#fde68a',
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        No saved rosters yet. Create one at your band page.
                      </div>
                    )}

                    {eventForm.selectedRosterId && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 12,
                          borderRadius: 14,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#9ca3af',
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        Members from this roster will be invited.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Unified Warnings Component */}
              <EventWarnings
                conflicts={eventForm.conflicts || []}
                sameDayEvents={eventForm.sameDayEvents || []}
              />
              {/* Submit button - changes style when warnings exist */}
              <button
                className={`gc-submit-btn ${
                  hasWarnings ? 'gc-submit-btn-warning' : 'gc-submit-btn-event'
                }`}
                onClick={handleSubmitCreateEvent}
                disabled={
                  eventForm.checkingConflicts ||
                  !eventForm.bandId ||
                  !eventForm.title.trim() ||
                  !eventForm.starts ||
                  missingInviteSelection
                }
                style={{
                  marginTop: hasWarnings ? 8 : undefined,
                  ...(hasWarnings
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)',
                        boxShadow: '0 4px 14px rgba(251, 191, 36, 0.3)',
                      }
                    : {}),
                }}
              >
                {eventForm.checkingConflicts
                  ? 'Checking availability…'
                  : hasWarnings
                  ? `Create anyway · ${totalWarnings} warning${
                      totalWarnings > 1 ? 's' : ''
                    }`
                  : missingInviteSelection
                  ? 'Select invitees to continue'
                  : 'Create Event'}
              </button>
            </div>
          )}

          {/* New Song Form */}
          {step === 'newSong' && (
            <div className="gc-form-card gc-form-card-song">
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-song">Band</label>
                <div className="gc-select-wrapper">
                  <select
                    className="gc-select gc-form-input-song"
                    value={currentBandId}
                    onChange={(e) => handleBandChange(e.target.value)}
                  >
                    {loadingBands && <option value="">Loading…</option>}
                    {!loadingBands &&
                      bands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                  <IonIcon
                    icon={chevronForwardOutline}
                    className="gc-select-chevron"
                  />
                </div>
              </div>

              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-song">
                  Song title
                </label>
                <input
                  type="text"
                  className="gc-form-input gc-form-input-song"
                  value={songForm.title}
                  onChange={(e) => songForm.setTitle(e.target.value)}
                  placeholder="e.g., Meadowlark & the Bluebird"
                />
              </div>

              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-song">
                  Origin
                </label>
                <div className="gc-toggle-group">
                  <button
                    className={`gc-toggle-btn ${
                      songForm.origin === 'original'
                        ? 'gc-toggle-btn-active-original'
                        : 'gc-toggle-btn-inactive'
                    }`}
                    onClick={() => songForm.setOrigin('original')}
                    type="button"
                  >
                    Original
                  </button>
                  <button
                    className={`gc-toggle-btn ${
                      songForm.origin === 'cover'
                        ? 'gc-toggle-btn-active-cover'
                        : 'gc-toggle-btn-inactive'
                    }`}
                    onClick={() => songForm.setOrigin('cover')}
                    type="button"
                  >
                    Cover
                  </button>
                </div>
              </div>

              {songForm.origin === 'cover' && (
                <div className="gc-form-group">
                  <label className="gc-form-label gc-form-label-song">
                    Original artist
                  </label>
                  <input
                    type="text"
                    className="gc-form-input gc-form-input-song"
                    value={songForm.originalArtist}
                    onChange={(e) => songForm.setOriginalArtist(e.target.value)}
                    placeholder="e.g., Fleetwood Mac"
                  />
                </div>
              )}

              <div className="gc-form-row">
                <div className="gc-form-group">
                  <label className="gc-form-label gc-form-label-song">
                    Key (optional)
                  </label>
                  <input
                    type="text"
                    className="gc-form-input gc-form-input-song"
                    value={songForm.key}
                    onChange={(e) => songForm.setKey(e.target.value)}
                    placeholder="e.g., G, B♭"
                  />
                </div>
                <div className="gc-form-group">
                  <label className="gc-form-label gc-form-label-song">
                    BPM (optional)
                  </label>
                  <input
                    type="number"
                    className="gc-form-input gc-form-input-song"
                    value={songForm.bpm}
                    onChange={(e) => songForm.setBpm(e.target.value)}
                    placeholder="e.g., 120"
                  />
                </div>
              </div>

              <button
                className="gc-submit-btn gc-submit-btn-song"
                onClick={handleSubmitCreateSong}
                disabled={!songForm.bandId || !songForm.title.trim()}
              >
                Create Song
              </button>
            </div>
          )}

          {/* New Proposal Form */}
          {step === 'newProposal' && (
            <div className="gc-form-card gc-form-card-proposal">
              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-proposal">
                  Band
                </label>
                <div className="gc-select-wrapper">
                  <select
                    className="gc-select gc-form-input-proposal"
                    value={currentBandId}
                    onChange={(e) => handleBandChange(e.target.value)}
                  >
                    {loadingBands && <option value="">Loading…</option>}
                    {!loadingBands &&
                      bands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                  <IonIcon
                    icon={chevronForwardOutline}
                    className="gc-select-chevron"
                  />
                </div>
              </div>

              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-proposal">
                  Proposal title
                </label>
                <input
                  type="text"
                  className="gc-form-input gc-form-input-proposal"
                  value={proposalForm.title}
                  onChange={(e) => proposalForm.setTitle(e.target.value)}
                  placeholder="e.g., Friday night at Riverfront"
                />
              </div>

              <div className="gc-form-group">
                <label className="gc-form-label gc-form-label-proposal">
                  Venue (optional)
                </label>
                <input
                  type="text"
                  className="gc-form-input gc-form-input-proposal"
                  value={proposalForm.venue}
                  onChange={(e) => proposalForm.setVenue(e.target.value)}
                  placeholder="The Record Bar"
                />
              </div>

              <button
                className="gc-submit-btn gc-submit-btn-proposal"
                onClick={handleSubmitCreateProposal}
                disabled={!proposalForm.bandId || !proposalForm.title.trim()}
              >
                Create Proposal
              </button>
            </div>
          )}
        </div>

        {/* Date pickers */}
        <EventDateTimePicker
          open={eventForm.showStartsPicker}
          label="Event Start"
          value={eventForm.starts || undefined}
          onChange={(iso) => {
            if (iso) eventForm.setStarts(iso);
            eventForm.setShowStartsPicker(false);
          }}
          onDismiss={() => eventForm.setShowStartsPicker(false)}
        />

        <EventDateTimePicker
          open={eventForm.showEndsPicker}
          label="Event End"
          value={eventForm.ends || undefined}
          min={eventForm.starts || undefined}
          onChange={(iso) => {
            if (iso) eventForm.setEnds(iso);
            else eventForm.setEnds('');
            eventForm.setShowEndsPicker(false);
          }}
          onDismiss={() => eventForm.setShowEndsPicker(false)}
        />
      </IonContent>
    </IonModal>
  );
}
