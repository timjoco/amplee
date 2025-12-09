import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon } from '@ionic/react';
import { copyOutline, trashOutline } from 'ionicons/icons';
import { memo, useEffect, useState } from 'react';

type ProfileLite = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

type ChatMsg = {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: ProfileLite;
  status?: 'sending' | 'sent' | 'failed';
};

interface MessageActionSheetProps {
  open: boolean;
  message: ChatMsg | null;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onEdit: (messageId: string, newBody: string) => void;
}

const REACTION_EMOJIS = [
  '👍',
  '❤️',
  '😂',
  '👀',
  '🔥',
  '🎉',
  '🙏',
  '👏',
  '😮',
  '😢',
  '😡',
  '💯',
  '🤘',
  '⭐️',
];

const neon = 'rgba(168,85,247,0.9)';
const darkCard = 'rgba(10,10,20,0.96)';

// this is the popup when tap and hold a message
export const MessageActionSheet = memo<MessageActionSheetProps>(
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

    useEffect(() => {
      if (!message) return;
      setDraft(message.body ?? '');
      setIsEditing(false);
      setConfirmingDelete(false);
      setOffset(0);
    }, [message]);

    if (!open || !message) return null;

    const { id, profiles, body } = message;
    const displayName = profiles?.display_name || 'Member';

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
      const text = (body ?? '').toString();
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
      setDraft(body ?? '');
      setIsEditing(false);
    };

    const handleSaveEdit = () => {
      const trimmed = draft.trim();
      if (!trimmed || trimmed === body) {
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
            padding: '12px 16px 24px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: 'rgba(180,180,200,0.35)',
              margin: '0 auto 14px',
            }}
          />

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
                    border: '1px solid rgba(148,163,184,0.7)',
                    background: 'rgba(15,23,42,0.95)',
                    color: '#E5E7EB',
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
                  color: '#EDE9FE',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {body}
              </div>
            ) : (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.8)',
                    background: 'rgba(15,23,42,0.98)',
                    color: '#E5E7EB',
                    fontSize: 14,
                    padding: 8,
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
                      border: '1px solid rgba(216,180,254,0.9)',
                      background:
                        'linear-gradient(135deg, rgba(147,51,234,0.96), rgba(107,58,157,0.98))',
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
                border: `1px solid ${neon}`,
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
                    border: `1px solid ${neon}`,
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

MessageActionSheet.displayName = 'MessageActionSheet';
