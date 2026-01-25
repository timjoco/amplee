import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon } from '@ionic/react';
import { copyOutline, trashOutline } from 'ionicons/icons';
import { memo, useEffect, useState } from 'react';
import type { TourMessageWithUser } from '../types/tourTypes';
import { REACTION_EMOJIS } from '../hooks/useTourReactions';
import { RUST } from '../lib/styles';

interface TourMessageActionSheetProps {
  open: boolean;
  message: TourMessageWithUser | null;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
}

const rustAccent = RUST.primary;
const darkCard = 'rgba(10,10,20,0.96)';

export const TourMessageActionSheet = memo<TourMessageActionSheetProps>(
  ({
    open,
    message,
    canEdit,
    canDelete,
    onClose,
    onDelete,
    onReact,
    onEdit,
  }) => {
    const [dragStartY, setDragStartY] = useState<number | null>(null);
    const [offset, setOffset] = useState(0);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');

    const isAndroid =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    useEffect(() => {
      if (!message) return;
      setDraft(message.content ?? '');
      setIsEditing(false);
      setConfirmingDelete(false);
      setOffset(0);
    }, [message]);

    if (!open || !message) return null;

    const { id, user, content } = message;
    const displayName =
      user?.display_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
      'Member';

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 1) return;
      setDragStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (dragStartY == null || e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const delta = y - dragStartY;
      if (delta > 0) setOffset(Math.min(delta, 160));
    };

    const handleTouchEnd = () => {
      if (offset > 60) {
        handleClose();
      }
      setDragStartY(null);
      setOffset(0);
    };

    const handleClose = () => {
      setConfirmingDelete(false);
      setIsEditing(false);
      onClose();
    };

    const triggerLightHaptic = () => {
      if (Capacitor.getPlatform() === 'web') return;
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    };

    const handleCopy = async () => {
      const text = (content ?? '').toString();
      const { clipboard } = navigator as Navigator & { clipboard?: Clipboard };

      if (clipboard?.writeText) {
        await clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      triggerLightHaptic();
      handleClose();
    };

    const handleStartEdit = () => {
      if (!canEdit) return;
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      setDraft(content ?? '');
      setIsEditing(false);
    };

    const handleSaveEdit = () => {
      const trimmed = draft.trim();
      if (!trimmed || trimmed === content) {
        setIsEditing(false);
        return;
      }
      triggerLightHaptic();
      onEdit(id, trimmed);
      handleClose();
    };

    return (
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 40,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{
            width: '100%',
            background: '#050509',
            transform: `translateY(${offset}px)`,
            transition:
              dragStartY == null ? 'transform 160ms ease-out' : 'none',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: `12px 16px calc(env(safe-area-inset-bottom, 0px) + ${
              isAndroid ? 18 : 12
            }px)`,
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: 'rgba(180,180,200,0.35)',
              margin: '0 auto 14px',
            }}
          />

          {/* Message preview */}
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              borderRadius: 14,
              background: darkCard,
              border: '1px solid rgba(148,163,184,0.45)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(156,163,175,0.95)',
                }}
              >
                {displayName}
              </div>

              {canEdit && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${RUST.border}`,
                    background: 'rgba(15,23,42,0.95)',
                    color: RUST.light,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    textTransform: 'uppercase',
                    letterSpacing: 0.08,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              )}
            </div>

            {!isEditing || !canEdit ? (
              <div
                style={{
                  fontSize: 14,
                  color: '#F3F4F6',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {content}
              </div>
            ) : (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: 10,
                    borderRadius: 10,
                    border: `1px solid ${RUST.border}`,
                    background: 'rgba(0,0,0,0.3)',
                    color: '#F3F4F6',
                    fontSize: 14,
                    resize: 'none',
                    outline: 'none',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 8,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: '1px solid rgba(148,163,184,0.8)',
                      background: 'rgba(15,23,42,0.95)',
                      color: 'rgba(209,213,219,0.96)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: `1px solid ${RUST.light}`,
                      background: `linear-gradient(135deg, ${RUST.primary}, ${RUST.dark})`,
                      color: '#F9FAFB',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save changes
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Emoji reactions grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 18,
            }}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <div
                key={emoji}
                style={{
                  padding: 4,
                  borderRadius: 12,
                  background: darkCard,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 40,
                  minHeight: 40,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    triggerLightHaptic();
                    onReact(emoji);
                    handleClose();
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: 'none',
                    background: '#050509',
                    color: '#fff',
                    fontSize: 20,
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {emoji}
                </button>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!confirmingDelete ? (
            <>
              <div
                onClick={handleCopy}
                style={{
                  borderRadius: 14,
                  background: darkCard,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                <IonIcon
                  icon={copyOutline}
                  style={{ fontSize: 20, opacity: 0.9, color: '#E5E7EB' }}
                />
                <span
                  style={{
                    color: '#E5E7EB',
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  Copy message
                </span>
              </div>

              {canDelete && (
                <div
                  onClick={() => setConfirmingDelete(true)}
                  style={{
                    borderRadius: 14,
                    background: darkCard,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <IonIcon
                    icon={trashOutline}
                    color="danger"
                    style={{ fontSize: 20, opacity: 0.9 }}
                  />
                  <span
                    style={{
                      color: '#EF4444',
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    Delete message
                  </span>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                background: darkCard,
                borderRadius: 14,
                padding: '12px',
                border: `1px solid ${rustAccent}`,
                marginTop: 8,
              }}
            >
              <p
                style={{
                  color: '#FECACA',
                  margin: 0,
                  marginBottom: 10,
                  fontSize: 14,
                }}
              >
                Delete this message for everyone?
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 12,
                    border: `1px solid ${rustAccent}`,
                    background: darkCard,
                    color: '#E5E7EB',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    handleClose();
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 12,
                    border: '1px solid rgba(248,113,113,0.9)',
                    background: 'rgba(70,10,20,0.9)',
                    color: '#FECACA',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

TourMessageActionSheet.displayName = 'TourMessageActionSheet';
