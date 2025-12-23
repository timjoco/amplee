/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner, IonText } from '@ionic/react';
import {
  addOutline,
  archiveOutline,
  chatbubbleOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { InboxScope } from '../hooks/useEventInboxData';
import { useEventInboxData } from '../hooks/useEventInboxData';

import type { EventRow } from '../../../../lib/cache/eventInboxCache';
import { supabase } from '../../../../lib/supabase';
import { usePressActions } from '../hooks/usePressActions';
import { useSignedBandAvatar } from '../hooks/useSignedBandAvatar';
import { getConflictGroups } from '../utils/format';
import ArchivedSummaryModal from './ArchivedSummaryModal';
import ArchiveEventModal from './ArchiveEventModal';
import EmptyStateCard from './EmptyStateCard';
import EventInboxRowMobile from './EventInboxRowMobile';

export default function EventInboxListBaseMobile({
  scope,
  bandId,
  showAvatars = true,
  enableCreateForBand = false,
  isAdmin = false,
  adminBandIds = [],
  suppressEmptyState = false,
  showArchived = false,
  clientFilterBandId,
  showDeclined = false,
  onLoaded,
}: {
  scope: InboxScope;
  bandId?: string;
  showAvatars?: boolean;
  enableCreateForBand?: boolean;
  isAdmin?: boolean;
  adminBandIds?: string[];
  suppressEmptyState?: boolean;
  showArchived?: boolean;
  clientFilterBandId?: string;
  showDeclined?: boolean;
  onLoaded?: (count: number) => void;
}) {
  const nav = useNavigate();

  // data
  const { rows, displayRows, lastMsgs, loading, removeLocal } =
    useEventInboxData({
      scope,
      bandId,
      showArchived,
      showAvatars,
      showDeclined,
      onLoaded,
      clientFilterBandId,
    });

  // create event privilege (band page only)
  const canCreateEvent = Boolean(enableCreateForBand && bandId && isAdmin);

  const openEvent = useCallback(
    (bId: string, eventId: string) => nav(`/bands/${bId}/events/${eventId}`),
    [nav]
  );

  const openGlobalCreateForBand = useCallback(() => {
    if (!bandId) return;
    window.dispatchEvent(
      new CustomEvent('amplee:global-create', {
        detail: { kind: 'event', bandId },
      })
    );
  }, [bandId]);

  // --- Archive modal state lives here (but UI is in component) ---
  const [showArchive, setShowArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveNotes, setArchiveNotes] = useState('');
  const [archiveAttendance, setArchiveAttendance] = useState('');
  const [archiveMerch, setArchiveMerch] = useState('');
  const [archivePayout, setArchivePayout] = useState('');

  // archived summary modal
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryRow, setSummaryRow] = useState<EventRow | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const openArchivedSummary = useCallback(async (row: EventRow) => {
    setSummaryRow(row);
    setShowSummary(true);
    setSummaryLoading(true);

    try {
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
        removeLocal(ev.id);
      } finally {
        setArchiving(false);
      }
    },
    [archiveNotes, archiveAttendance, archiveMerch, archivePayout, removeLocal]
  );

  // press/hover/action-sheet logic (shared hook)
  const {
    hoveredId,
    pressedId,
    actionTarget,
    showActions,
    setShowActions,
    bindPressHandlers,
    requestArchiveFromActionSheet,
  } = usePressActions({
    rows,
    bandId,
    isAdmin,
    adminBandIds,
    // only allow actions in non-archived list
    enabled: !showArchived,
    onArchiveRequested: (target) => {
      setShowActions(false);
      setArchiveNotes('');
      setArchiveAttendance('');
      setArchiveMerch('');
      setArchivePayout('');
      setShowArchive(true);
    },
  });

  // signed avatars
  const { getAvatarSrc, renderAvatarInitials } = useSignedBandAvatar({
    showAvatars,
  });

  const conflictGroups = getConflictGroups(displayRows);

  // Group rows for rendering
  const groupedRows = useMemo(() => {
    const result: Array<
      | { type: 'single'; event: EventRow }
      | { type: 'conflict'; events: EventRow[] }
    > = [];

    const processed = new Set<string>();

    displayRows.forEach((e) => {
      if (processed.has(e.id)) return;

      const group = conflictGroups.get(e.id);

      if (group && group.size > 1) {
        // Grab all events in this conflict group (in display order)
        const groupEvents = displayRows.filter((r) => group.has(r.id));
        groupEvents.forEach((ge) => processed.add(ge.id));
        result.push({ type: 'conflict', events: groupEvents });
      } else {
        processed.add(e.id);
        result.push({ type: 'single', event: e });
      }
    });

    return result;
  }, [displayRows, conflictGroups]);

  const isArchivedTab = Boolean(showArchived);
  const isDeclinedTab = Boolean(showDeclined);

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
        <IonText style={{ color: 'rgba(156, 163, 184, 0.9)', fontSize: 14 }}>
          Loading events…
        </IonText>
      </div>
    );
  }

  if (!suppressEmptyState && displayRows.length === 0 && !loading) {
    return (
      <>
        <EmptyStateCard
          variant={
            isArchivedTab ? 'archived' : isDeclinedTab ? 'declined' : 'active'
          }
          isAdmin={isAdmin}
          canCreateEvent={canCreateEvent}
          onCreate={openGlobalCreateForBand}
          icon={
            isArchivedTab
              ? archiveOutline
              : isDeclinedTab
              ? closeCircleOutline
              : chatbubbleOutline
          }
        />

        {/* ActionSheet still needs to exist for long-press (even though empty state) */}
        <ArchiveEventModal
          showActions={showActions}
          setShowActions={setShowActions}
          actionTarget={actionTarget}
          showArchive={showArchive}
          setShowArchive={setShowArchive}
          archiving={archiving}
          archiveNotes={archiveNotes}
          setArchiveNotes={setArchiveNotes}
          archiveAttendance={archiveAttendance}
          setArchiveAttendance={setArchiveAttendance}
          archiveMerch={archiveMerch}
          setArchiveMerch={setArchiveMerch}
          archivePayout={archivePayout}
          setArchivePayout={setArchivePayout}
          onArchive={archiveEvent}
          onRequestArchive={requestArchiveFromActionSheet}
        />
      </>
    );
  }

  return (
    <div
      style={{
        paddingTop: 4,
        paddingBottom: 'calc(48px + env(safe-area-inset-bottom))',
      }}
    >
      <ArchiveEventModal
        showActions={showActions}
        setShowActions={setShowActions}
        actionTarget={actionTarget}
        showArchive={showArchive}
        setShowArchive={setShowArchive}
        archiving={archiving}
        archiveNotes={archiveNotes}
        setArchiveNotes={setArchiveNotes}
        archiveAttendance={archiveAttendance}
        setArchiveAttendance={setArchiveAttendance}
        archiveMerch={archiveMerch}
        setArchiveMerch={setArchiveMerch}
        archivePayout={archivePayout}
        setArchivePayout={setArchivePayout}
        onArchive={archiveEvent}
        onRequestArchive={requestArchiveFromActionSheet}
      />

      <ArchivedSummaryModal
        isOpen={showSummary}
        onClose={() => {
          setShowSummary(false);
          setSummaryRow(null);
          setSummary(null);
        }}
        row={summaryRow}
        loading={summaryLoading}
        summary={summary}
      />

      {groupedRows.map((item, idx) => {
        if (item.type === 'single') {
          const e = item.event;
          return (
            <EventInboxRowMobile
              key={e.id}
              row={e}
              lastMsg={lastMsgs[e.id]}
              showAvatars={showAvatars}
              avatarSrc={getAvatarSrc(e)}
              showDeclined={showDeclined}
              renderAvatarInitials={renderAvatarInitials}
              isPressed={pressedId === e.id}
              isHovered={hoveredId === e.id}
              onMouseEnter={() => bindPressHandlers.onMouseEnter(e.id)}
              onMouseLeave={() => bindPressHandlers.onMouseLeave()}
              {...bindPressHandlers.getHandlers(e.id)}
              onClick={() => {
                if (e.archived_at) {
                  void openArchivedSummary(e);
                } else {
                  openEvent(e.band_id, e.id);
                }
              }}
              onSongNavigate={(songId) =>
                nav(`/bands/${e.band_id}/songs/${songId}`)
              }
            />
          );
        }

        // Conflict group
        return (
          <div
            key={`conflict-${item.events[0].id}`}
            style={{
              margin: '8px 12px',
              borderRadius: 12,
              border: '2px solid rgba(251, 146, 60, 0.6)',
              background: 'rgba(251, 146, 60, 0.06)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Conflict label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'rgba(251, 146, 60, 0.12)',
                borderBottom: '1px solid rgba(251, 146, 60, 0.2)',
              }}
            >
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(251, 146, 60, 0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Time Conflict
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(251, 146, 60, 0.7)',
                }}
              >
                · {item.events.length} events overlap
              </span>
            </div>

            {/* Conflict group events */}
            {item.events.map((e, eventIdx) => (
              <EventInboxRowMobile
                key={e.id}
                row={e}
                lastMsg={lastMsgs[e.id]}
                showAvatars={showAvatars}
                avatarSrc={getAvatarSrc(e)}
                showDeclined={showDeclined}
                renderAvatarInitials={renderAvatarInitials}
                isPressed={pressedId === e.id}
                isHovered={hoveredId === e.id}
                inConflictGroup
                isLastInGroup={eventIdx === item.events.length - 1}
                onMouseEnter={() => bindPressHandlers.onMouseEnter(e.id)}
                onMouseLeave={() => bindPressHandlers.onMouseLeave()}
                {...bindPressHandlers.getHandlers(e.id)}
                onClick={() => {
                  if (e.archived_at) {
                    void openArchivedSummary(e);
                  } else {
                    openEvent(e.band_id, e.id);
                  }
                }}
                onSongNavigate={(songId) =>
                  nav(`/bands/${e.band_id}/songs/${songId}`)
                }
              />
            ))}
          </div>
        );
      })}

      {canCreateEvent && displayRows.length > 0 && (
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
