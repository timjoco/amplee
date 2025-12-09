/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonItem, IonList, IonSpinner, IonText } from '@ionic/react';
import { memo, type MouseEvent, type TouchEvent } from 'react';

import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import { MessageBodyWithLinks } from '../../EventChat/components/MessageBodyWithLinks';
import { ReactionBarMobile } from './ReactionsBar/ReactionBarMobile';

type ProfileLite = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

export type ChatMsg = {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: ProfileLite;
  status?: 'sending' | 'sent' | 'failed';
};

export type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
  url: string;
};

type ChatMessagesListProps = {
  loading: boolean;
  loadingMore: boolean;
  isEmpty: boolean;
  messages: ChatMsg[];
  activeMessageId: string | null;
  timeFmt: Intl.DateTimeFormat;
  linkPreviews: Record<string, LinkPreview>;
  reactions: Record<string, Record<string, number>>;
  myReactions: Record<string, Record<string, true>>;
  bottomRef: React.RefObject<HTMLDivElement>;
  handlePressStart: (
    id: string,
    e: TouchEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>
  ) => void;
  handlePressMove: (e: TouchEvent<HTMLDivElement>) => void;
  handlePressEnd: () => void;
  handleSongNavigate: (songId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
};

const MOVE_THRESHOLD_PX = 12;

function ChatMessagesListComponent({
  loading,
  loadingMore,
  isEmpty,
  messages,
  activeMessageId,
  timeFmt,
  linkPreviews,
  reactions,
  myReactions,
  bottomRef,
  handlePressStart,
  handlePressMove,
  handlePressEnd,
  handleSongNavigate,
  toggleReaction,
}: ChatMessagesListProps) {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 8,
        }}
      >
        <IonSpinner name="dots" />
        <IonText color="medium">Loading…</IonText>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: '100%',
          padding: '32px 24px 40px',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div
            style={{
              position: 'absolute',
              inset: -20,
              background:
                'radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)',
              filter: 'blur(20px)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: 'relative',
              filter: 'drop-shadow(0 0 12px rgba(52, 211, 153, 0.3))',
            }}
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z"
              stroke="url(#chat-gradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 12H8.01M12 12H12.01M16 12H16.01"
              stroke="url(#chat-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient
                id="chat-gradient"
                x1="2"
                y1="2"
                x2="22"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#34D399" />
                <stop offset="1" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 12,
            letterSpacing: -0.5,
          }}
        >
          Welcome to the Green Room
        </h2>

        <p
          style={{
            fontSize: 16,
            color: 'rgba(229, 231, 235, 0.85)',
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          Your band's private hub for this event
        </p>

        <p
          style={{
            fontSize: 15,
            color: 'rgba(156, 163, 175, 0.9)',
            fontWeight: 500,
          }}
        >
          Message the band to get started
        </p>

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 12,
            opacity: 0.4,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#34D399',
              animation: 'fadeInOut 2s ease-in-out infinite',
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#34D399',
              animation: 'fadeInOut 2s ease-in-out infinite 0.4s',
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#34D399',
              animation: 'fadeInOut 2s ease-in-out infinite 0.8s',
            }}
          />
        </div>

        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes fadeInOut {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 1; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <IonList
      lines="none"
      style={{
        background: 'transparent',
        paddingLeft: 0,
        paddingRight: 0,
      }}
    >
      {loadingMore && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0',
          }}
        >
          <IonSpinner name="dots" />
        </div>
      )}

      {(() => {
        let lastDateKey: string | null = null;

        return messages.map((m) => {
          const msgDate = new Date(m.created_at);

          const day = String(msgDate.getDate()).padStart(2, '0');
          const month = String(msgDate.getMonth() + 1).padStart(2, '0');
          const year = String(msgDate.getFullYear()).slice(-2);
          const dateLabel = `${month}/${day}/${year}`;

          const dateKey = msgDate.toISOString().slice(0, 10);
          const showDateDivider = dateKey !== lastDateKey;
          lastDateKey = dateKey;
          const dateDividerLabel = msgDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          const name = m.profiles?.display_name || 'Member';
          const isActive = activeMessageId === m.id;

          return (
            <div key={m.id}>
              {showDateDivider && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '6px 0 4px',
                    opacity: 0.9,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 0.12,
                      color: 'rgba(255,255,255,0.8)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dateDividerLabel}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                </div>
              )}

              <IonItem
                lines="none"
                style={{
                  '--background': 'transparent',
                  '--padding-start': '0px',
                  '--inner-padding-end': '0px',
                  paddingInline: 0,
                  paddingBlock: 4,
                }}
              >
                <div
                  onTouchStart={(e) => handlePressStart(m.id, e)}
                  onTouchMove={handlePressMove}
                  onTouchEnd={handlePressEnd}
                  onTouchCancel={handlePressEnd}
                  onMouseDown={(e) => handlePressStart(m.id, e)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    borderRadius: 14,
                    marginInline: 0,
                    padding: isActive ? '8px 12px' : '6px 8px',
                    background: isActive
                      ? 'rgba(24,24,38,0.97)'
                      : 'transparent',
                    boxShadow: isActive
                      ? '0 0 0 1px rgba(139,92,246,0.5)'
                      : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      marginLeft: -5,
                    }}
                  >
                    <AvatarImageMobile
                      name={name}
                      bucket="profile-avatars"
                      avatarPath={m.profiles?.avatar_url ?? undefined}
                      updatedAt={m.profiles?.updated_at ?? undefined}
                      size={36}
                      style={{ borderWidth: 1 }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 6,
                        marginBottom: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          letterSpacing: 0.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '60%',
                        }}
                      >
                        {name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          opacity: 0.65,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {dateLabel} · {timeFmt.format(msgDate)}
                      </span>

                      {m.status === 'sending' && (
                        <IonSpinner
                          name="dots"
                          style={{
                            width: 14,
                            height: 14,
                            opacity: 0.6,
                          }}
                        />
                      )}
                      {m.status === 'failed' && (
                        <span
                          style={{
                            fontSize: 11,
                            color: '#EF4444',
                            fontWeight: 600,
                          }}
                        >
                          Failed
                        </span>
                      )}
                    </div>

                    <MessageBodyWithLinks
                      body={m.body}
                      preview={linkPreviews[m.id]}
                      status={m.status}
                      onSongNavigate={handleSongNavigate}
                    />

                    <ReactionBarMobile
                      reactions={reactions[m.id] || {}}
                      myReactions={myReactions[m.id] || {}}
                      onToggle={(emoji) => toggleReaction(m.id, emoji)}
                      showAddButton={false}
                    />
                  </div>
                </div>
              </IonItem>
            </div>
          );
        });
      })()}

      <div ref={bottomRef} />
    </IonList>
  );
}

export const ChatMessagesList = memo(ChatMessagesListComponent);
