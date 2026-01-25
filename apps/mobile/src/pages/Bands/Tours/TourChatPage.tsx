/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  chatbubblesOutline,
  chevronBackOutline,
  sendOutline,
} from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AvatarImageMobile from '../../../components/ui/AvatarImageMobile';
import { supabase } from '../../../lib/supabase';
import { useTourChat } from './hooks/useTourChat';
import { RUST } from './lib/styles';
import type { TourMessageWithUser, TourRow } from './types/tourTypes';

type RouteParams = {
  bandId: string;
  tourId: string;
};

export default function TourChatPage() {
  const nav = useNavigate();
  const { bandId, tourId } = useParams<RouteParams>();

  const [tour, setTour] = useState<TourRow | null>(null);
  const [inputText, setInputText] = useState('');

  const {
    messages,
    loading,
    sending,
    myUserId,
    scrollContainerRef,
    bottomRef,
    sendMessage,
    deleteMessage,
  } = useTourChat(tourId);

  // Load tour info
  useEffect(() => {
    if (!tourId) return;

    supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .maybeSingle()
      .then(({ data }) => {
        setTour(data as TourRow);
      });
  }, [tourId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDateHeader = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: TourMessageWithUser[] }[] = [];
    let currentDate = '';

    for (const msg of messages) {
      const msgDate = formatDateHeader(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }

    return groups;
  }, [messages]);

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => nav(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: RUST.subtle,
                  border: `1px solid ${RUST.border}`,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <IonIcon
                  icon={chatbubblesOutline}
                  style={{ fontSize: 16, color: RUST.light }}
                />
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#f9fafb',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Tour Chat
                </h1>
                {tour && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: '#6b7280',
                    }}
                  >
                    {tour.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={false}
        style={{
          '--background': '#050509',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Messages Container */}
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '16px',
            }}
          >
            {loading ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IonSpinner style={{ '--color': RUST.light }} />
              </div>
            ) : messages.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 32,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: RUST.subtle,
                    border: `1px solid ${RUST.border}`,
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <IonIcon
                    icon={chatbubblesOutline}
                    style={{ fontSize: 28, color: RUST.light }}
                  />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 600,
                    color: '#e5e7eb',
                    marginBottom: 8,
                  }}
                >
                  No messages yet
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  Start the conversation with your tour crew
                </p>
              </div>
            ) : (
              <>
                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    {/* Date Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '16px 0',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6b7280',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '4px 10px',
                          borderRadius: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {group.date}
                      </span>
                    </div>

                    {/* Messages */}
                    {group.messages.map((msg) => {
                      const isMe = msg.user_id === myUserId;
                      const fullName = [msg.user?.first_name, msg.user?.last_name]
                        .filter(Boolean)
                        .join(' ')
                        .trim();
                      const displayName =
                        msg.user?.display_name ||
                        fullName ||
                        'Unknown';

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: isMe ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          {/* Avatar */}
                          {!isMe && (
                            <AvatarImageMobile
                              name={displayName}
                              bucket="profile-avatars"
                              avatarPath={msg.user?.avatar_url ?? undefined}
                              updatedAt={msg.user?.updated_at ?? undefined}
                              size={32}
                              style={{ borderRadius: 10, flexShrink: 0 }}
                            />
                          )}

                          {/* Message Bubble */}
                          <div
                            style={{
                              maxWidth: '75%',
                              padding: '10px 14px',
                              borderRadius: 16,
                              borderBottomLeftRadius: isMe ? 16 : 4,
                              borderBottomRightRadius: isMe ? 4 : 16,
                              background: isMe
                                ? RUST.primary
                                : 'rgba(255, 255, 255, 0.06)',
                              border: isMe
                                ? 'none'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {!isMe && (
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: RUST.light,
                                  marginBottom: 4,
                                }}
                              >
                                {displayName}
                              </div>
                            )}
                            <p
                              style={{
                                margin: 0,
                                fontSize: 14,
                                color: isMe ? '#fff' : '#e5e7eb',
                                lineHeight: 1.4,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {msg.content}
                            </p>
                            <div
                              style={{
                                fontSize: 10,
                                color: isMe
                                  ? 'rgba(255, 255, 255, 0.7)'
                                  : '#6b7280',
                                marginTop: 4,
                                textAlign: isMe ? 'right' : 'left',
                              }}
                            >
                              {formatTime(msg.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} style={{ height: 1 }} />
              </>
            )}
          </div>

          {/* Composer */}
          <div
            style={{
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
              background: 'rgba(8, 8, 14, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message the tour..."
              rows={1}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#f9fafb',
                fontSize: 15,
                resize: 'none',
                outline: 'none',
                maxHeight: 120,
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: inputText.trim() ? RUST.primary : 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                opacity: sending ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {sending ? (
                <IonSpinner
                  style={{ '--color': '#fff', width: 20, height: 20 }}
                />
              ) : (
                <IonIcon
                  icon={sendOutline}
                  style={{
                    fontSize: 20,
                    color: inputText.trim() ? '#fff' : '#6b7280',
                  }}
                />
              )}
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
