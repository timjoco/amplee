import { IonIcon } from '@ionic/react';
import {
  chatbubblesOutline,
  chevronForwardOutline,
  flashOutline,
} from 'ionicons/icons';

type LastMessage = {
  body: string;
  sender_name?: string;
};

type EventChatCTAProps = {
  onPress: () => void;
  isPressed: boolean;
  unreadCount?: number;
  lastMessage?: LastMessage | null;
};

export default function EventChatCTA({
  onPress,
  isPressed,
  unreadCount = 0,
  lastMessage,
}: EventChatCTAProps) {
  // Format last message preview - strip song tags and truncate
  const formatPreview = (msg: LastMessage): string => {
    let text = msg.body;
    // Remove song tags like [[song:uuid:Title]]
    text = text.replace(/\[\[song:[^\]]+\]\]/g, '🎵').trim();
    // Truncate if too long
    if (text.length > 50) {
      text = text.slice(0, 50) + '…';
    }
    return msg.sender_name ? `${msg.sender_name}: ${text}` : text;
  };
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        background:
          'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.05) 100%)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        borderRadius: 18,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'all 120ms ease-out',
        textAlign: 'left',
        marginBottom: 16,
        position: 'relative',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      <IonIcon
        icon={chevronForwardOutline}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontSize: 20,
          color: 'rgba(148, 163, 184, 0.7)',
        }}
      />

      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: 'rgba(52, 211, 153, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <IonIcon
          icon={chatbubblesOutline}
          style={{ fontSize: 26, color: '#34d399' }}
        />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#ef4444',
              color: '#fff',
              borderRadius: 12,
              padding: '2px 6px',
              fontSize: 10,
              fontWeight: 700,
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>

      <div style={{ flex: 1, paddingRight: 24 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#F9FAFB',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Chat
          <IonIcon
            icon={flashOutline}
            style={{ fontSize: 16, color: '#34d399' }}
          />
        </div>
        <div
          style={{
            fontSize: 13,
            color: lastMessage ? 'rgba(148, 163, 184, 0.9)' : '#9ca3af',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {lastMessage ? formatPreview(lastMessage) : 'Message your bandmates for this event'}
        </div>
      </div>
    </button>
  );
}
