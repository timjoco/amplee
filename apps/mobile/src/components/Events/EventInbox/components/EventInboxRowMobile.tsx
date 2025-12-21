/* eslint-disable @next/next/no-img-element */
import { IonAvatar } from '@ionic/react';
import React from 'react';
import type { EventRow } from '../../../../lib/cache/eventInboxCache';
import { MessageBodyWithLinks } from '../../../../pages/Events/EventChat/components/MessageBodyWithLinks';
import type { LastMsg } from '../hooks/useEventInboxData';
import { getRelativeTime } from '../utils/format';

export default function EventInboxRowMobile({
  row: e,
  lastMsg,
  showAvatars,
  avatarSrc,
  renderAvatarInitials,
  isPressed,
  isHovered,
  inConflictGroup, // ← make sure this is here
  isLastInGroup,
  hasConflict,
  conflictPosition,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onSongNavigate,
  ...handlers
}: {
  row: EventRow;
  lastMsg?: LastMsg;
  showAvatars: boolean;
  avatarSrc?: string;
  renderAvatarInitials: (name?: string | null) => React.ReactNode;
  conflictPosition?: {
    isFirst: boolean;
    isLast: boolean;
  } | null;
  isLastInGroup?: boolean;
  inConflictGroup?: boolean;
  hasConflict?: boolean;
  isPressed: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSongNavigate: (songId: string) => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const band = e.bands;

  // Add this helper inside the component, before the return
  const getConflictStyles = (): React.CSSProperties => {
    if (!hasConflict || !conflictPosition) return {};

    const { isFirst, isLast } = conflictPosition;
    const borderColor = 'rgba(251, 146, 60, 0.6)';
    const bgColor = 'rgba(251, 146, 60, 0.08)';

    return {
      background: isPressed
        ? 'rgba(142, 142, 147, 0.18)'
        : isHovered
        ? 'rgba(255, 255, 255, 0.04)'
        : bgColor,
      borderLeft: `2px solid ${borderColor}`,
      borderRight: `2px solid ${borderColor}`,
      borderTop: isFirst ? `2px solid ${borderColor}` : 'none',
      borderBottom: isLast ? `2px solid ${borderColor}` : 'none',
      borderRadius:
        isFirst && isLast
          ? 12
          : isFirst
          ? '12px 12px 0 0'
          : isLast
          ? '0 0 12px 12px'
          : 0,
      marginLeft: 8,
      marginRight: 8,
    };
  };

  const conflictStyles = getConflictStyles();

  return (
    <div
      {...handlers}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex',
        gap: 12,
        padding: '16px 12px',
        cursor: 'pointer',
        transition: 'background 80ms ease-out',
        borderBottom: hasConflict
          ? 'none'
          : '1px solid rgba(255, 255, 255, 0.06)',
        background: isPressed
          ? 'rgba(142, 142, 147, 0.18)'
          : isHovered
          ? 'rgba(255, 255, 255, 0.04)'
          : 'transparent',
        borderRadius: 12,
        ...conflictStyles,
      }}
    >
      {showAvatars && (
        <IonAvatar
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={band?.name || 'Band'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            renderAvatarInitials(band?.name)
          )}
        </IonAvatar>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 16,
              color: 'rgba(241, 245, 249, 0.95)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {e.title || 'Event'}
          </span>

          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(148, 163, 184, 0.7)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {getRelativeTime(e.starts_at)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'rgba(192, 132, 252, 0.9)',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {e.type}
          </span>

          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6,
              background: e.is_cancelled
                ? 'rgba(239, 68, 68, 0.12)'
                : e.is_booked
                ? 'rgba(34, 197, 94, 0.12)'
                : 'rgba(251, 191, 36, 0.12)',
              color: e.is_cancelled
                ? 'rgba(239, 68, 68, 0.9)'
                : e.is_booked
                ? 'rgba(34, 197, 94, 0.9)'
                : 'rgba(251, 191, 36, 0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            {e.is_cancelled ? 'Cancelled' : e.is_booked ? 'Booked' : 'Pending'}
          </div>
        </div>

        {lastMsg?.body && (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              color: 'rgba(148, 163, 184, 0.7)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <MessageBodyWithLinks
              body={lastMsg.body}
              preview={undefined}
              status={undefined}
              variant="preview"
              onSongNavigate={onSongNavigate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
