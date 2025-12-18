/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonActionSheet,
  IonAvatar,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import {
  addOutline,
  alertCircleOutline,
  archiveOutline,
  calendarOutline,
  chatbubbleOutline,
  closeOutline,
  hammerOutline,
  locationOutline,
  musicalNotesOutline,
} from 'ionicons/icons';

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EventRow,
  getAvatarSigned,
  getCache,
  needsEventRefresh,
  setAvatarPath,
  setAvatarSigned,
  setEvents,
  setLastMsgsBulk,
  upsertLastMsg,
} from '../../lib/cache/eventInboxCache';
import { supabase } from '../../lib/supabase';
import { MessageBodyWithLinks } from '../../pages/Events/EventChat/components/MessageBodyWithLinks';

type LastMsg = { event_id: string; body: string; created_at: string };

export default function EventInboxListMobile({
  onLoaded,
  bandId,
  showAvatars = true,
  enableCreateForBand = false,
  isAdmin = false,
  adminBandIds = [],
  suppressEmptyState = false,
  showArchived = false,
}: {
  onLoaded?: (count: number) => void;
  bandId?: string;
  showAvatars?: boolean;
  enableCreateForBand?: boolean;
  isAdmin?: boolean;
  adminBandIds?: string[];
  suppressEmptyState?: boolean;
  showArchived?: boolean;
}) {
  const nav = useNavigate();

  const initial = bandId
    ? {
        events: [] as EventRow[],
        lastMsgs: {} as Record<string, LastMsg | undefined>,
      }
    : getCache();

  const [rows, setRows] = useState<EventRow[]>(initial.events);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg | undefined>>(
    initial.lastMsgs
  );
  const [loading, setLoading] = useState(bandId ? true : needsEventRefresh());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const eventIdsRef = useRef<string[]>(initial.events.map((e) => e.id));
  const lastMsgsRef = useRef<Record<string, LastMsg | undefined>>(
    initial.lastMsgs
  );

  const longPressFiredRef = useRef(false);
  const activePressIdRef = useRef<string | null>(null);

  const [pressedId, setPressedId] = useState<string | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const MOVE_THRESHOLD = 12;

  const [actionTarget, setActionTarget] = useState<EventRow | null>(null);
  const [showActions, setShowActions] = useState(false);

  const [showArchive, setShowArchive] = useState(false);
  const [archiveNotes, setArchiveNotes] = useState('');
  const [archiveAttendance, setArchiveAttendance] = useState('');
  const [archiveMerch, setArchiveMerch] = useState('');
  const [archivePayout, setArchivePayout] = useState('');
  const [archiving, setArchiving] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryRow, setSummaryRow] = useState<EventRow | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const isNative = Capacitor.isNativePlatform();
  const isAndroid = isNative && Capacitor.getPlatform() === 'android';
  const isIOS = isNative && Capacitor.getPlatform() === 'ios';

  const [avatarTick, setAvatarTick] = useState(0);

  const openArchivedSummary = useCallback(async (row: EventRow) => {
    setSummaryRow(row);
    setShowSummary(true);
    setSummaryLoading(true);

    try {
      // You can skip this fetch if your EventRow already includes these fields.
      const { data, error } = await supabase
        .from('events')
        .select(
          `
        id,
        title,
        type,
        starts_at,
        location,
        archived_at,
        archive_notes,
        merch_gross,
        payout_total,
        attendance
      `
        )
        .eq('id', row.id)
        .maybeSingle();

      if (error) throw error;
      setSummary(data ?? null);
    } catch (e) {
      console.warn('[archived summary] load failed', e);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Admin-only create privilege
  const canCreateEvent = Boolean(enableCreateForBand && bandId && isAdmin);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[event inbox haptic error]', e);
    }
  }, []);

  useEffect(() => {
    lastMsgsRef.current = lastMsgs;
  }, [lastMsgs]);

  const getRelativeTime = useCallback((dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;
    if (!userId) {
      setRows([]);
      setLastMsgs({});
      if (!bandId) {
        setEvents([]);
        setLastMsgsBulk({});
      }
      onLoaded?.(0);
      return;
    }

    let bandIds: string[] = [];
    if (bandId) {
      bandIds = [bandId];
    } else {
      const { data: mems } = await supabase
        .from('band_members')
        .select('band_id')
        .eq('user_id', userId);
      bandIds = (mems ?? []).map((m: any) => String(m.band_id));
    }

    if (bandIds.length === 0) {
      setRows([]);
      setLastMsgs({});
      if (!bandId) {
        setEvents([]);
        setLastMsgsBulk({});
      }
      onLoaded?.(0);
      return;
    }
    const q = supabase
      .from('events_with_my_attendance')
      .select(
        'id, band_id, title, type, starts_at, ends_at, location, notes, is_booked, is_cancelled, my_event_status, bands(id, name, avatar_url)'
      )
      .in('band_id', bandIds)
      .order('starts_at', { ascending: true })
      .limit(200);

    const { data: events, error: eventsErr } = await q;

    if (eventsErr) {
      console.warn('[inbox] events query error full', eventsErr);

      onLoaded?.(0);
      return;
    }

    const toTs = (s?: string | null) =>
      s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;
    const now = Date.now();

    // Hydrate from cache for instant render (stale-while-revalidate).
    // Supabase remains the source of truth; we refresh on mount and reconcile.
    const base: EventRow[] = (events ?? []).map((e: any) => ({
      id: String(e.id),
      band_id: String(e.band_id),
      title: String(e.title ?? ''),
      type: e.type === 'practice' ? 'practice' : 'show',
      starts_at: e.starts_at ?? null,
      ends_at: e.ends_at ?? null,
      location: e.location ?? null,
      notes: e.notes ?? null,
      is_booked: Boolean(e.is_booked),
      is_cancelled: Boolean(e.is_cancelled),
      archived_at: null, // will hydrate below
      my_event_status:
        (e.my_event_status as EventRow['my_event_status']) ?? 'pending',
      bands: Array.isArray(e.bands)
        ? e.bands[0]
          ? {
              id: String(e.bands[0].id),
              name: String(e.bands[0].name ?? ''),
              avatar_url: e.bands[0].avatar_url ?? null,
            }
          : null
        : e.bands
        ? {
            id: String(e.bands.id),
            name: String(e.bands.name ?? ''),
            avatar_url: e.bands.avatar_url ?? null,
          }
        : null,
    }));

    const ids = base.map((r) => r.id);

    let archivedMap: Record<string, string | null> = {};
    if (ids.length) {
      const { data: archRows, error: archErr } = await supabase
        .from('events')
        .select('id, archived_at')
        .in('id', ids);

      if (archErr) {
        console.warn('[inbox] archived_at hydrate error', archErr);
      } else {
        for (const r of archRows ?? []) {
          archivedMap[String((r as any).id)] = (r as any).archived_at ?? null;
        }
      }
    }

    const normalized: EventRow[] = base.map((r) => ({
      ...r,
      archived_at: archivedMap[r.id] ?? null,
    }));

    const filtered = normalized.filter((e) =>
      showArchived ? Boolean(e.archived_at) : !e.archived_at
    );

    const upcoming = filtered
      .filter((e) => e.starts_at && toTs(e.starts_at) >= now)
      .sort((a, b) => toTs(a.starts_at) - toTs(b.starts_at));

    const past = filtered
      .filter((e) => !e.starts_at || toTs(e.starts_at) < now)
      .sort((a, b) =>
        showArchived
          ? toTs(a.starts_at) - toTs(b.starts_at)
          : toTs(b.starts_at) - toTs(a.starts_at)
      );

    const sorted = [...upcoming, ...past];

    setRows(sorted);
    eventIdsRef.current = sorted.map((e) => e.id);
    onLoaded?.(sorted.length);

    if (!bandId) setEvents(sorted);

    if (showAvatars) {
      for (const e of sorted) {
        if (e.bands?.id && e.bands.avatar_url) {
          setAvatarPath(e.bands.id, e.bands.avatar_url);
        }
      }
    }

    const targetIds = sorted.map((e) => e.id);

    if (targetIds.length) {
      const { data: msgs } = await supabase
        .from('event_messages')
        .select('event_id, body, created_at')
        .in('event_id', targetIds)
        .order('created_at', { ascending: false })
        .limit(1000);

      const map: Record<string, LastMsg> = {};

      for (const m of msgs ?? []) {
        const existing = map[m.event_id];
        // keep the newest per event_id
        if (
          !existing ||
          new Date(m.created_at) > new Date(existing.created_at)
        ) {
          map[m.event_id] = m as LastMsg;
        }
      }

      // 🔧 Replace lastMsgs for this list of events (respect deletes / no messages)
      setLastMsgs((prev) => {
        const next = { ...prev };
        for (const id of targetIds) {
          if (map[id]) {
            next[id] = map[id];
          } else {
            delete next[id];
          }
        }
        return next;
      });

      // Global cache for home screen
      if (!bandId) {
        setLastMsgsBulk(map);
      }
    }
  }, [bandId, onLoaded, showAvatars, showArchived]);

  useEffect(() => {
    setLoading(true);
    void refreshEvents().finally(() => setLoading(false));
  }, [bandId, refreshEvents]);

  const recomputeLastMessage = useCallback(
    async (eventId: string) => {
      if (!eventIdsRef.current.includes(eventId)) {
        return;
      }

      const { data, error } = await supabase
        .from('event_messages')
        .select('event_id, body, created_at')
        // TODO: if you have soft delete (is_deleted / deleted_at), filter it here
        // .is('deleted_at', null)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('[event inbox] failed to recompute last message', error);
        return;
      }

      const next = (data?.[0] as LastMsg | undefined) ?? undefined;

      setLastMsgs((prev) => {
        const clone = { ...prev };
        if (next) {
          clone[eventId] = next;
        } else {
          delete clone[eventId];
        }
        return clone;
      });

      if (next) {
        upsertLastMsg(next);
      }
    },
    [] // supabase is a module-level singleton, safe to omit
  );

  const archiveEvent = useCallback(
    async (ev: EventRow) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id ?? null;

      const toNum = (s: string) => {
        const n = Number(String(s).replace(/[^\d.-]/g, ''));
        return Number.isFinite(n) ? n : null;
      };

      const patch: any = {
        archived_at: new Date().toISOString(),
        archived_by: userId,
        archive_notes: archiveNotes.trim() || null,
      };

      if (ev.type === 'show') {
        patch.attendance = toNum(archiveAttendance);
        patch.merch_gross = toNum(archiveMerch);
        patch.payout_total = toNum(archivePayout);
      }

      setArchiving(true);
      try {
        const { error } = await supabase
          .from('events')
          .update(patch)
          .eq('id', ev.id);

        if (error) throw error;

        setRows((prev) => prev.filter((r) => r.id !== ev.id));

        if (!bandId) {
          setEvents(getCache().events.filter((r) => r.id !== ev.id));
        }
      } finally {
        setArchiving(false);
      }
    },
    [archiveNotes, archiveAttendance, archiveMerch, archivePayout, bandId]
  );

  useEffect(() => {
    const ch = supabase
      .channel('dashboard:event-inbox')
      // INSERT
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_messages' },
        (payload: any) => {
          const msg = payload.new as LastMsg;

          if (!eventIdsRef.current.includes(msg.event_id)) return;

          setLastMsgs((prev) => {
            const cur = prev[msg.event_id];
            if (!cur || new Date(msg.created_at) > new Date(cur.created_at)) {
              const next = { ...prev, [msg.event_id]: msg };
              upsertLastMsg(msg);
              return next;
            }
            return prev;
          });
        }
      )
      // UPDATE
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_messages' },
        (payload: any) => {
          const row = payload.new;
          const eventId = row.event_id as string | undefined;
          if (!eventId) return;
          void recomputeLastMessage(eventId);
        }
      )
      // DELETE
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'event_messages' },
        (payload: any) => {
          const row = payload.old;
          const eventId = row.event_id as string | undefined;
          if (!eventId) return;
          void recomputeLastMessage(eventId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [recomputeLastMessage]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ eventId?: string }>;
      const changedEventId = custom.detail?.eventId;
      if (!changedEventId) return;

      // Only recompute if this list actually includes that event
      void recomputeLastMessage(changedEventId);
    };

    window.addEventListener('amplee:event-message-updated', handler);
    return () => {
      window.removeEventListener('amplee:event-message-updated', handler);
    };
  }, [recomputeLastMessage]);

  const getAvatar = useCallback(
    async (bandId: string, path: string | null | undefined) => {
      if (!showAvatars || !bandId || !path) return undefined;

      // 1. Use cached signed URL if we already have one
      const cached = getAvatarSigned(bandId, path);
      if (cached) return cached;

      // 2. If "path" is already a full URL, don't try to sign it.
      if (path.startsWith('http://') || path.startsWith('https://')) {
        // cache it so we don't keep running this on every render
        setAvatarSigned(bandId, path, path, 60 * 60);
        return path;
      }

      // 3. Normalize relative path for the `band-avatars` bucket
      //    so we don't accidentally send "band-avatars/band-avatars/..."
      let normalizedPath = path;
      if (normalizedPath.startsWith('band-avatars/')) {
        normalizedPath = normalizedPath.slice('band-avatars/'.length);
      }

      const { data, error } = await supabase.storage
        .from('band-avatars') // correct bucket
        .createSignedUrl(normalizedPath, 60 * 60);

      if (!error && data?.signedUrl) {
        setAvatarSigned(bandId, path, data.signedUrl, 60 * 60);
        return data.signedUrl;
      }

      console.warn('[event inbox] avatar signed url error', {
        bandId,
        path,
        normalizedPath,
        error,
      });

      return undefined;
    },
    [showAvatars]
  );

  useEffect(() => {
    if (!showAvatars) return;

    let cancelled = false;

    (async () => {
      let changed = false;

      for (const e of rows) {
        const band = e.bands;
        if (!band?.id || !band.avatar_url) continue;

        // if already cached (and path-aware), skip
        const cached = getAvatarSigned(band.id, band.avatar_url);
        if (cached) continue;

        const url = await getAvatar(band.id, band.avatar_url);
        if (url) changed = true;
      }

      if (!cancelled && changed) setAvatarTick((n) => n + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [rows, showAvatars, getAvatar]);

  const openEvent = (bId: string, eventId: string) => {
    nav(`/bands/${bId}/events/${eventId}`);
  };

  const openGlobalCreateForBand = () => {
    if (!bandId) return;
    window.dispatchEvent(
      new CustomEvent('amplee:global-create', {
        detail: { kind: 'event', bandId },
      })
    );
  };
  const handlePressStart = useCallback(
    (
      id: string,
      e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      // new gesture
      longPressFiredRef.current = false;
      activePressIdRef.current = id;

      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };

      longPressTimeoutRef.current = window.setTimeout(() => {
        setPressedId(id);
        void triggerHaptic();

        const target = rows.find((r) => r.id === id) ?? null;
        if (!target) return;

        const ts = target.starts_at ? new Date(target.starts_at).getTime() : 0;
        const isPast = ts > 0 && ts < Date.now();

        const isAdminForTarget = bandId
          ? isAdmin
          : adminBandIds.includes(target.band_id);

        if (isAdminForTarget && isPast) {
          setActionTarget(target);
          setShowActions(true);
        }
      }, 350);
    },
    [triggerHaptic, rows, isAdmin]
  );

  const handlePressMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
    if (e.touches.length !== 1) return;

    const { x, y } = pressStartRef.current;
    const t = e.touches[0];

    if (
      Math.abs(t.clientX - x) > MOVE_THRESHOLD ||
      Math.abs(t.clientY - y) > MOVE_THRESHOLD
    ) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;
    activePressIdRef.current = null;

    // clear highlight
    if (pressedId != null) {
      setTimeout(() => setPressedId(null), 130);
    }

    // allow next gesture
    setTimeout(() => {
      longPressFiredRef.current = false;
    }, 0);
  }, [pressedId]);

  const renderAvatarInitials = (name?: string | null) => {
    const initials =
      name
        ?.split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || '?';

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 14,
          color: 'rgba(148, 163, 184, 0.9)',
          background: 'rgba(30, 41, 59, 0.8)',
        }}
      >
        {initials}
      </div>
    );
  };

  const closeArchiveModal = () => {
    setShowArchive(false);
    setActionTarget(null);
  };

  const ActionsUI = (
    <>
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        header={actionTarget?.title ?? 'Event'}
        cssClass="amplee-action-sheet"
        buttons={[
          {
            text: 'Archive',
            icon: archiveOutline,
            handler: () => {
              const ts = actionTarget?.starts_at
                ? new Date(actionTarget.starts_at).getTime()
                : 0;
              const isPast = ts > 0 && ts < Date.now();

              if (!isPast) return;

              setShowActions(false);
              setArchiveNotes('');
              setArchiveAttendance('');
              setArchiveMerch('');
              setArchivePayout('');
              setShowArchive(true);
            },
            cssClass: (() => {
              const ts = actionTarget?.starts_at
                ? new Date(actionTarget.starts_at).getTime()
                : 0;
              const isPast = ts > 0 && ts < Date.now();
              return isPast ? '' : 'action-disabled';
            })(),
          },
          {
            text: 'Cancel',
            icon: closeOutline,
            role: 'cancel',
            handler: () => setShowActions(false),
          },
        ]}
      />

      <IonModal
        isOpen={showArchive}
        onDidDismiss={closeArchiveModal}
        className="amplee-modal"
      >
        <IonContent
          className="ion-padding"
          style={{
            '--background': '#0c0a14',
            '--padding-top': 'calc(env(safe-area-inset-top) + 16px)',
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#e5e7eb',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Archive {actionTarget?.type === 'show' ? 'Show' : 'Practice'}
            </h2>
            <IonButton
              fill="clear"
              onClick={closeArchiveModal}
              style={{
                '--color': 'rgba(156,163,175,0.9)',
                '--padding-end': '0',
                margin: 0,
              }}
            >
              <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
            </IonButton>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {actionTarget?.type === 'show' && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'rgba(139,92,246,0.9)',
                    marginBottom: 4,
                  }}
                >
                  Show Stats
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'rgba(156,163,175,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      Merch Sales
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '0 12px',
                      }}
                    >
                      <span style={{ color: 'rgba(156,163,175,0.7)' }}>$</span>
                      <IonInput
                        inputMode="decimal"
                        value={archiveMerch}
                        onIonInput={(e) =>
                          setArchiveMerch(String(e.detail.value ?? ''))
                        }
                        placeholder="0.00"
                        style={{
                          '--color': '#e5e7eb',
                          '--placeholder-color': 'rgba(156,163,175,0.5)',
                          '--padding-start': '8px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'rgba(156,163,175,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      Payout
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '0 12px',
                      }}
                    >
                      <span style={{ color: 'rgba(156,163,175,0.7)' }}>$</span>
                      <IonInput
                        inputMode="decimal"
                        value={archivePayout}
                        onIonInput={(e) =>
                          setArchivePayout(String(e.detail.value ?? ''))
                        }
                        placeholder="0.00"
                        style={{
                          '--color': '#e5e7eb',
                          '--placeholder-color': 'rgba(156,163,175,0.5)',
                          '--padding-start': '8px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'rgba(156,163,175,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      Attendance
                    </label>
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '0 12px',
                      }}
                    >
                      <IonInput
                        inputMode="numeric"
                        value={archiveAttendance}
                        onIonInput={(e) =>
                          setArchiveAttendance(String(e.detail.value ?? ''))
                        }
                        placeholder="0"
                        style={{
                          '--color': '#e5e7eb',
                          '--placeholder-color': 'rgba(156,163,175,0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'rgba(156,163,175,0.9)',
                  marginBottom: 6,
                }}
              >
                Notes
              </label>
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                }}
              >
                <IonTextarea
                  value={archiveNotes}
                  onIonInput={(e) =>
                    setArchiveNotes(String(e.detail.value ?? ''))
                  }
                  placeholder="How did it go? Any memorable moments?"
                  autoGrow
                  rows={3}
                  style={{
                    '--color': '#e5e7eb',
                    '--placeholder-color': 'rgba(156,163,175,0.5)',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    '--padding-top': '12px',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 24,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <IonButton
              fill="outline"
              expand="block"
              disabled={archiving}
              onClick={closeArchiveModal}
              style={{
                '--border-color': 'rgba(255,255,255,0.12)',
                '--color': 'rgba(156,163,175,0.9)',
                '--border-radius': '10px',
                flex: 1,
              }}
            >
              Cancel
            </IonButton>

            <IonButton
              expand="block"
              disabled={!actionTarget || archiving}
              onClick={async () => {
                if (!actionTarget) return;
                await archiveEvent(actionTarget);
                closeArchiveModal();
              }}
              style={{
                '--background': '#7c3aed',
                '--background-hover': '#6d28d9',
                '--border-radius': '10px',
                flex: 1,
              }}
            >
              {archiving ? (
                <>
                  <IonSpinner name="dots" style={{ marginRight: 8 }} />
                  Archiving
                </>
              ) : (
                'Archive'
              )}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );

  const SummaryUI = (
    <IonModal
      isOpen={showSummary}
      onDidDismiss={() => {
        setShowSummary(false);
        setSummaryRow(null);
        setSummary(null);
      }}
      breakpoints={isIOS ? [0, 0.6, 0.92] : undefined}
      initialBreakpoint={isIOS ? 0.92 : undefined}
      backdropBreakpoint={isIOS ? 0.6 : undefined}
      presentingElement={
        document.querySelector('ion-router-outlet') ?? undefined
      }
      className="amplee-modal"
    >
      <IonContent
        className="ion-padding"
        fullscreen
        style={{
          '--background': '#0c0a14',
          '--padding-top': 'calc(env(safe-area-inset-top) + 3px)',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 16px)',
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: '#e5e7eb',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {summaryRow?.title ?? 'Event Summary'}
          </h2>
          <IonButton
            fill="clear"
            onClick={() => {
              setShowSummary(false);
              setSummaryRow(null);
              setSummary(null);
            }}
            style={{
              '--color': 'rgba(156,163,175,0.9)',
              '--padding-end': '0',
              margin: 0,
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
          </IonButton>
        </div>

        {summaryLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}
          >
            <IonSpinner name="dots" color="primary" />
            <span style={{ color: 'rgba(156,163,175,0.7)', fontSize: 13 }}>
              Loading summary…
            </span>
          </div>
        ) : !summary ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: 'rgba(156,163,175,0.7)',
            }}
          >
            <IonIcon
              icon={alertCircleOutline}
              style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}
            />
            <p style={{ margin: 0 }}>Couldn't load this summary.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Event Details Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  fontSize: 13,
                  color: 'rgba(203,213,225,0.9)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon
                    icon={calendarOutline}
                    style={{ color: '#22c55e', fontSize: 16 }}
                  />
                  <span>
                    {summary.starts_at
                      ? new Date(summary.starts_at).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon
                    icon={
                      summary.type === 'show'
                        ? musicalNotesOutline
                        : hammerOutline
                    }
                    style={{
                      color:
                        summary.type === 'show'
                          ? 'rgba(192,132,252,0.9)'
                          : 'rgba(96,165,250,0.9)',
                      fontSize: 16,
                    }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>
                    {summary.type ?? '—'}
                  </span>
                </div>

                {summary.location && (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <IonIcon
                      icon={locationOutline}
                      style={{ color: '#8b5cf6', fontSize: 16 }}
                    />
                    <span>{summary.location}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon
                    icon={archiveOutline}
                    style={{ color: 'rgba(156,163,175,0.7)', fontSize: 16 }}
                  />
                  <span style={{ color: 'rgba(156,163,175,0.7)' }}>
                    Archived{' '}
                    {summary.archived_at
                      ? new Date(summary.archived_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Show Stats Card */}
            {summary.type === 'show' && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'rgba(139,92,246,0.9)',
                    marginBottom: 12,
                  }}
                >
                  Show Stats
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#22c55e',
                      }}
                    >
                      {summary.merch_gross ? `$${summary.merch_gross}` : '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(156,163,175,0.7)',
                        marginTop: 2,
                      }}
                    >
                      Merch
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#22c55e',
                      }}
                    >
                      {summary.payout_total ? `$${summary.payout_total}` : '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(156,163,175,0.7)',
                        marginTop: 2,
                      }}
                    >
                      Payout
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#e5e7eb',
                      }}
                    >
                      {summary.attendance ?? '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(156,163,175,0.7)',
                        marginTop: 2,
                      }}
                    >
                      Attendance
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(156,163,175,0.7)',
                  marginBottom: 10,
                }}
              >
                Notes
              </div>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  color: 'rgba(203,213,225,0.9)',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {summary.archive_notes || (
                  <span
                    style={{
                      color: 'rgba(156,163,175,0.5)',
                      fontStyle: 'italic',
                    }}
                  >
                    No notes added
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );

  if (loading && rows.length === 0) {
    if (suppressEmptyState) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '20px 16px',
        }}
      >
        <IonSpinner
          name="dots"
          style={{ '--color': 'rgba(52, 211, 153, 0.8)' } as any}
        />
        <IonText style={{ color: 'rgba(156, 163, 175, 0.9)', fontSize: 14 }}>
          Loading events…
        </IonText>
      </div>
    );
  }

  // Empty state
  if (!suppressEmptyState && rows.length === 0 && !loading) {
    const isArchivedTab = Boolean(showArchived);

    return (
      <div
        style={{
          padding: '16px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            background: 'transparent',
            border: isArchivedTab
              ? '1px solid rgba(148, 163, 184, 0.18)'
              : '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: 20,
            padding: '32px 24px',
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: isArchivedTab
                ? 'rgba(148, 163, 184, 0.08)'
                : 'rgba(52, 211, 153, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: isArchivedTab
                ? '1px solid rgba(148, 163, 184, 0.18)'
                : '1px solid rgba(52, 211, 153, 0.2)',
            }}
          >
            <IonIcon
              icon={isArchivedTab ? archiveOutline : chatbubbleOutline}
              style={{
                fontSize: 32,
                color: isArchivedTab
                  ? 'rgba(148, 163, 184, 0.9)'
                  : 'rgba(52, 211, 153, 0.9)',
              }}
            />
          </div>

          <IonText color="light">
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 18,
                fontWeight: 700,
                color: 'rgba(241, 245, 249, 0.95)',
                letterSpacing: '-0.01em',
              }}
            >
              {isArchivedTab ? 'No Archived Events' : 'No Events Yet'}
            </h2>

            <p
              style={{
                margin: 0,
                color: 'rgba(148, 163, 184, 0.9)',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {isArchivedTab
                ? isAdmin
                  ? 'Archived events will show up here after you archive past shows or practices.'
                  : 'Once an admin archives past events, they’ll appear here.'
                : isAdmin
                ? 'Create your first show or practice to get started.'
                : 'Events will appear here once your band admin schedules them.'}
            </p>
          </IonText>

          {ActionsUI}

          {/* Only show create button on the active (non-archived) tab */}
          {!isArchivedTab && canCreateEvent && (
            <button
              type="button"
              onClick={openGlobalCreateForBand}
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 12,
                border: '1px solid rgba(52, 211, 153, 0.25)',
                background: 'rgba(52, 211, 153, 0.1)',
                color: 'rgba(52, 211, 153, 0.95)',
                fontSize: 14.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
              Create event
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBlock: 4 }}>
      {ActionsUI}
      {SummaryUI}
      {rows.map((e, index) => {
        const when = getRelativeTime(e.starts_at);
        const lm = lastMsgs[e.id];
        const fallbackPreview =
          e.location || `${e.type === 'show' ? 'Show' : 'Practice'}`;
        const band = e.bands;
        const isPressed = pressedId === e.id;
        const isHovered = hoveredId === e.id;
        const isLast = index === rows.length - 1;

        const avatarSrc =
          band?.id && band.avatar_url
            ? getAvatarSigned(band.id, band.avatar_url)
            : undefined;

        return (
          // Update the row's onClick to handle the press state visually
          <div
            key={e.id}
            onClick={(ev) => {
              if (longPressFiredRef.current) {
                ev.preventDefault();
                ev.stopPropagation();
                return;
              }

              // archived rows open summary modal
              if (e.archived_at) {
                ev.preventDefault();
                ev.stopPropagation();
                void openArchivedSummary(e);
                return;
              }

              openEvent(e.band_id, e.id);
            }}
            onMouseEnter={() => setHoveredId(e.id)}
            onMouseLeave={() => {
              setHoveredId(null);
              setPressedId(null);
            }}
            onTouchStart={(ev) => {
              setPressedId(e.id);
              handlePressStart(e.id, ev);
            }}
            onTouchMove={handlePressMove}
            onTouchEnd={(ev) => {
              // if long press fired, swallow the tap
              if (longPressFiredRef.current) {
                ev.preventDefault();
                ev.stopPropagation();
                handlePressEnd();
                return;
              }

              handlePressEnd();
              setTimeout(() => setPressedId(null), 150);
            }}
            onTouchCancel={() => {
              handlePressEnd();
              setPressedId(null);
            }}
            onMouseDown={(ev) => {
              setPressedId(e.id);
              handlePressStart(e.id, ev);
            }}
            onMouseUp={(ev) => {
              if (longPressFiredRef.current) {
                ev.preventDefault();
                ev.stopPropagation();
                handlePressEnd();
                return;
              }
              handlePressEnd();
              setTimeout(() => setPressedId(null), 150);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 12px',
              marginInline: 0,
              borderRadius: 12, // Slightly more rounded like iMessage
              cursor: 'pointer',
              // iMessage-style highlight: gray overlay on press
              background: isPressed
                ? 'rgba(142, 142, 147, 0.18)' // iOS system gray highlight
                : isHovered
                ? 'rgba(255, 255, 255, 0.04)'
                : 'transparent',
              // No scale transform - iMessage doesn't scale
              transition: 'background 80ms ease-out',
            }}
          >
            {/* Avatar – bigger and closer to edge */}
            {showAvatars && (
              <IonAvatar
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  overflow: 'hidden',
                  flexShrink: 0,
                  // small nudge left visually (optional)
                  marginLeft: 4,
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={band?.name || 'Band'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  renderAvatarInitials(band?.name)
                )}
              </IonAvatar>
            )}

            {/* Text + underline area */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                paddingBottom: 8,
                // underline from text to end of row (not under avatar)
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'rgba(241, 245, 249, 0.95)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {e.title || 'Event'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background:
                      e.type === 'show'
                        ? 'rgba(168, 85, 247, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                    color:
                      e.type === 'show'
                        ? 'rgba(192, 132, 252, 0.9)'
                        : 'rgba(96, 165, 250, 0.9)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    textTransform: 'capitalize',
                  }}
                >
                  {e.type}
                </span>
                <span style={{ flex: 1 }} />
                {when && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(148, 163, 184, 0.6)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {when}
                  </span>
                )}
              </div>

              {/* Preview text / last message – TWO lines now */}
              <div
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.4,
                  // Changed from single line truncation to two lines
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  // Removed: whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                  color: 'rgba(148, 163, 184, 0.8)',
                }}
              >
                {lm?.body ? (
                  <MessageBodyWithLinks
                    body={lm.body}
                    preview={undefined}
                    status={undefined}
                    variant="preview"
                    onSongNavigate={(songId) =>
                      nav(`/bands/${e.band_id}/songs/${songId}`)
                    }
                  />
                ) : (
                  fallbackPreview
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Admin-only add button when list has items */}
      {canCreateEvent && rows.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <button
            type="button"
            onClick={openGlobalCreateForBand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'rgba(148, 163, 184, 0.7)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = 'rgba(52, 211, 153, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(148, 163, 184, 0.7)';
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            Add event
          </button>
        </div>
      )}
    </div>
  );
}
