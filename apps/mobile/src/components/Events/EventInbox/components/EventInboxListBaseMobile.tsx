/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner, IonText } from '@ionic/react';
import { addOutline, archiveOutline, chatbubbleOutline } from 'ionicons/icons';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { InboxScope } from '../hooks/useEventInboxData';
import { useEventInboxData } from '../hooks/useEventInboxData';

import type { EventRow } from '../../../../lib/cache/eventInboxCache';
import { supabase } from '../../../../lib/supabase';
import { usePressActions } from '../hooks/usePressActions';
import { useSignedBandAvatar } from '../hooks/useSignedBandAvatar';
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

  const isArchivedTab = Boolean(showArchived);

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
          variant={isArchivedTab ? 'archived' : 'active'}
          isAdmin={isAdmin}
          canCreateEvent={canCreateEvent}
          onCreate={openGlobalCreateForBand}
          icon={isArchivedTab ? archiveOutline : chatbubbleOutline}
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
    <div style={{ paddingBlock: 4 }}>
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

      {displayRows.map((e) => (
        <EventInboxRowMobile
          key={e.id}
          row={e}
          lastMsg={lastMsgs[e.id]}
          showAvatars={showAvatars}
          avatarSrc={getAvatarSrc(e)}
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
      ))}

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
