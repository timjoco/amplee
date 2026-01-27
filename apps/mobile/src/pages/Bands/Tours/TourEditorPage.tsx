/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonContent, IonIcon, IonPage, IonSpinner, IonTextarea } from '@ionic/react';
import {
  chatbubblesOutline,
  chevronBackOutline,
  closeCircle,
  informationCircleOutline,
  locationOutline,
  mapOutline,
  navigateOutline,
  personOutline,
  send as sendIcon,
  settingsOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useChatKeyboardPadding } from '../../Events/EventChat/hooks/useChatKeyboardPadding';
import { useLongPressHandlers } from '../../Events/EventChat/hooks/useLongPressHandlers';
import { EmptyState } from './components/EmptyState';
import { parseStopTags, serializeStopTags, type StopTagData } from './components/StopTag';
import { StopsSection } from './components/StopsSection';
import { TourActionsSection } from './components/TourActionsSection';
import { TourChatStopPickerModal } from './components/TourChatStopPickerModal';
import { TourMessageActionSheet } from './components/TourMessageActionSheet';
import { TourReactionBar } from './components/TourReactionBar';
import { TourRouteMap } from './components/TourRouteMap';
import { TourStatsBar } from './components/TourStatsBar';
import { useTourChat } from './hooks/useTourChat';
import { useTourEditor } from './hooks/useTourEditor';
import { useTourGeocode } from './hooks/useTourGeocode';
import { useTourReactions } from './hooks/useTourReactions';
import { glassCard, TEAL } from './lib/styles';
import { AddStopModal } from './modals/AddStopModal';
import { DeleteTourModal } from './modals/DeleteTourModal';
import { EditTourModal } from './modals/EditTourModal';
import type { TourMessageWithUser, TourStatus } from './types/tourTypes';
import { TOUR_STATUS_COLORS, TOUR_STATUS_LABELS } from './types/tourTypes';
import AvatarImageMobile from '../../../components/ui/AvatarImageMobile';

// Teal colors for stop tags
const STOP_TAG = {
  bg: 'rgba(20, 184, 166, 0.15)',
  border: 'rgba(20, 184, 166, 0.35)',
  text: '#2dd4bf',
  icon: '#14b8a6',
};

type RouteParams = {
  bandId: string;
  tourId: string;
};

type TabId = 'details' | 'route' | 'chat' | 'settings';

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'details', icon: informationCircleOutline, label: 'Details' },
  { id: 'route', icon: navigateOutline, label: 'Route' },
  { id: 'chat', icon: chatbubblesOutline, label: 'Chat' },
  { id: 'settings', icon: settingsOutline, label: 'Settings' },
];

export default function TourEditorPage() {
  const nav = useNavigate();
  const { bandId, tourId } = useParams<RouteParams>();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('details');

  // User permissions
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  const isAdmin = useMemo(() => myRole === 'admin', [myRole]);

  // Get current user and role
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      const userId = data.user?.id ?? null;
      setMyUserId(userId);

      if (userId && bandId) {
        const { data: membership } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!alive) return;
        setMyRole(membership?.role ?? null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bandId]);

  const editor = useTourEditor({
    bandId,
    tourId,
    onDeleted: () => {
      if (bandId) nav(`/bands/${bandId}/tours`);
      else nav(-1);
    },
  });

  const {
    loading,
    hasAttemptedLoad,
    tour,
    stops,
    pressedButton,
    handleButtonPress,
    // Stops
    addStopOpen,
    openAddStop,
    closeAddStop,
    savingStop,
    handleAddStop,
    // Tour actions
    showEditTour,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editStartDate,
    setEditStartDate,
    editEndDate,
    setEditEndDate,
    editStatus,
    setEditStatus,
    savingTour,
    startEditTour,
    closeEditTour,
    saveTourEdits,
    showDeleteTour,
    deletingTour,
    openDeleteTourConfirm,
    closeDeleteTourConfirm,
    deleteTour,
    // Financials
    financials,
    // Reload
    reload,
  } = editor;

  // Chat hook
  const chat = useTourChat(tourId);
  const [chatInput, setChatInput] = useState('');
  const [stopTags, setStopTags] = useState<StopTagData[]>([]);
  const [stopPickerOpen, setStopPickerOpen] = useState(false);

  // Chat action sheet state
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const activeMessage = useMemo(
    () => chat.messages.find((m) => m.id === activeMessageId) ?? null,
    [chat.messages, activeMessageId]
  );

  // Reactions hook
  const reactions = useTourReactions(tourId);

  // Load reactions when messages change
  useEffect(() => {
    if (chat.messages.length > 0) {
      const messageIds = chat.messages.map((m) => m.id);
      reactions.loadReactionsFor(messageIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages.length]);

  // Long press handler
  const handleMessageLongPress = useCallback(
    (messageId: string) => {
      if (Capacitor.getPlatform() !== 'web') {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      }
      setActiveMessageId(messageId);
    },
    []
  );

  const longPress = useLongPressHandlers({
    onLongPress: handleMessageLongPress,
  });

  // Chat action handlers
  const canEditMessage = useCallback(
    (msg: TourMessageWithUser) => {
      return chat.myUserId != null && msg.user_id === chat.myUserId;
    },
    [chat.myUserId]
  );

  const canDeleteMessage = useCallback(
    (msg: TourMessageWithUser) => {
      return (
        isAdmin || (chat.myUserId != null && msg.user_id === chat.myUserId)
      );
    },
    [isAdmin, chat.myUserId]
  );

  const handleCloseActionSheet = useCallback(() => {
    setActiveMessageId(null);
  }, []);

  const handleDeleteMessage = useCallback(() => {
    if (activeMessageId) {
      chat.deleteMessage(activeMessageId);
      setActiveMessageId(null);
    }
  }, [activeMessageId, chat]);

  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      chat.editMessage(messageId, newContent);
    },
    [chat]
  );

  const handleReactToMessage = useCallback(
    (emoji: string) => {
      if (activeMessageId) {
        reactions.toggleReaction(activeMessageId, emoji);
      }
    },
    [activeMessageId, reactions]
  );

  // Scroll to bottom when chat tab is opened
  useEffect(() => {
    if (activeTab === 'chat' && !chat.loading) {
      setTimeout(() => {
        chat.bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
    }
  }, [activeTab, chat.loading, chat.bottomRef]);

  // Keyboard padding hook for chat
  const keyboard = useChatKeyboardPadding();

  // Geocoding hook
  const geocode = useTourGeocode();
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);

  const handleCalculateRoutes = async () => {
    if (stops.length === 0) return;

    setIsCalculatingRoutes(true);
    try {
      await geocode.processAllStops(stops);
      // Reload the tour data to get updated coordinates
      reload?.();
    } finally {
      setIsCalculatingRoutes(false);
    }
  };

  const confirmedCount = stops.filter((s) => s.status === 'confirmed').length;
  const statusColor = tour ? TOUR_STATUS_COLORS[tour.status as TourStatus] : TEAL.primary;

  // Calculate tour length info from stops
  const tourLengthInfo = useMemo(() => {
    if (stops.length === 0) return null;

    const sortedStops = [...stops].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstDate = new Date(sortedStops[0].date + 'T00:00:00');
    const lastDate = new Date(sortedStops[sortedStops.length - 1].date + 'T00:00:00');

    // Calculate duration in days (inclusive)
    const durationMs = lastDate.getTime() - firstDate.getTime();
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1;

    // Get unique cities
    const cities = new Set(
      stops.map((s) => s.venue_city).filter(Boolean)
    );

    // Get unique states
    const states = new Set(
      stops.map((s) => s.venue_state).filter(Boolean)
    );

    // Format dates
    const formatDate = (date: Date) =>
      date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    return {
      firstDate: formatDate(firstDate),
      lastDate: formatDate(lastDate),
      durationDays,
      cityCount: cities.size,
      stateCount: states.size,
      isSingleDay: durationDays === 1,
    };
  }, [stops]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() && stopTags.length === 0) return;
    const messageContent = serializeStopTags(chatInput, stopTags);
    await chat.sendMessage(messageContent);
    setChatInput('');
    setStopTags([]);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChatInputChange = useCallback((value: string) => {
    // Check for @stops trigger
    const triggerPattern = /(^|\s)@stops$/i;
    if (triggerPattern.test(value)) {
      // Remove the trigger and open picker
      const cleanedValue = value.replace(triggerPattern, '$1').replace(/\s+$/, ' ');
      setChatInput(cleanedValue);
      setStopPickerOpen(true);
    } else {
      setChatInput(value);
    }
  }, []);

  const handleStopSelect = useCallback((stop: StopTagData) => {
    // Don't add duplicates
    if (!stopTags.some((t) => t.id === stop.id)) {
      setStopTags((prev) => [...prev, stop]);
    }
    setStopPickerOpen(false);
  }, [stopTags]);

  const handleRemoveStopTag = useCallback((tagId: string) => {
    setStopTags((prev) => prev.filter((t) => t.id !== tagId));
  }, []);

  const handleStopNavigate = useCallback(
    (stopId: string) => {
      nav(`/bands/${bandId}/tours/${tourId}/stops/${stopId}`);
    },
    [nav, bandId, tourId]
  );

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

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: typeof chat.messages }[] = [];
    let currentDate = '';

    for (const msg of chat.messages) {
      const msgDate = formatDateHeader(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }

    return groups;
  }, [chat.messages]);

  // Render Details Tab
  const renderDetailsTab = () => (
    <div
      style={{
        padding: 16,
        paddingBottom: 100,
        maxWidth: 600,
        margin: '0 auto',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {/* Non-admin notice */}
      {!isAdmin && myRole && (
        <div
          style={{
            ...glassCard,
            padding: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <IonIcon
            icon={shieldCheckmarkOutline}
            style={{ color: '#6b7280', fontSize: 16 }}
          />
          <span style={{ color: '#6b7280', fontSize: 13 }}>
            You're viewing this tour as a member. Only admins can edit.
          </span>
        </div>
      )}

      {/* Tour Overview */}
      {tour && (
        <div
          style={{
            ...glassCard,
            padding: 16,
            marginBottom: 16,
            border: `1px solid ${TEAL.border}`,
          }}
        >
          {/* Header with Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon
                icon={mapOutline}
                style={{ fontSize: 16, color: TEAL.light }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: TEAL.light,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Tour Overview
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: statusColor,
                background: `${statusColor}20`,
                padding: '3px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}
            >
              {TOUR_STATUS_LABELS[tour.status as TourStatus]}
            </span>
          </div>

          {/* Description */}
          {tour.description && (
            <p
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 14,
                color: '#d1d5db',
                lineHeight: 1.5,
              }}
            >
              {tour.description}
            </p>
          )}

          {/* Date Range */}
          {tourLengthInfo && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  Dates
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f9fafb' }}>
                  {tourLengthInfo.isSingleDay
                    ? tourLengthInfo.firstDate
                    : `${tourLengthInfo.firstDate} — ${tourLengthInfo.lastDate}`}
                </div>
              </div>

              {/* Stats Row */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                {/* Duration */}
                <div style={{ minWidth: 80 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                    Duration
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                    {tourLengthInfo.durationDays} {tourLengthInfo.durationDays === 1 ? 'day' : 'days'}
                  </div>
                </div>

                {/* Cities */}
                {tourLengthInfo.cityCount > 0 && (
                  <div style={{ minWidth: 80 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                      Cities
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                      {tourLengthInfo.cityCount}
                    </div>
                  </div>
                )}

                {/* States/Regions */}
                {tourLengthInfo.stateCount > 0 && (
                  <div style={{ minWidth: 80 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                      States
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                      {tourLengthInfo.stateCount}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <TourStatsBar
        stopCount={stops.length}
        confirmedCount={confirmedCount}
        netProfit={financials.netProfit}
        currency={tour?.currency || 'USD'}
      />

      <StopsSection
        stops={stops}
        onStopClick={(stopId) =>
          nav(`/bands/${bandId}/tours/${tourId}/stops/${stopId}`)
        }
        onAddClick={() => handleButtonPress('addStop', openAddStop)}
        isAddPressed={pressedButton === 'addStop'}
        isAdmin={isAdmin}
      />
    </div>
  );

  // Render Route Tab
  const renderRouteTab = () => (
    <TourRouteMap
      stops={stops}
      onStopClick={(stopId) =>
        nav(`/bands/${bandId}/tours/${tourId}/stops/${stopId}`)
      }
      onCalculateRoutes={handleCalculateRoutes}
      isCalculating={isCalculatingRoutes}
    />
  );

  // Render Chat Tab
  const renderChatTab = () => (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Messages Container */}
      <div
        ref={chat.scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px',
        }}
      >
        {chat.loading ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: '#6b7280' }}>Loading messages...</div>
          </div>
        ) : chat.messages.length === 0 ? (
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
                background: TEAL.subtle,
                border: `1px solid ${TEAL.border}`,
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <IonIcon
                icon={chatbubblesOutline}
                style={{ fontSize: 28, color: TEAL.light }}
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
                  const isMe = msg.user_id === chat.myUserId;
                  const fullName = [msg.user?.first_name, msg.user?.last_name]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
                  const displayName = msg.user?.display_name || fullName || 'Unknown';
                  const msgReactions = reactions.reactions[msg.id] || {};
                  const myMsgReactions = reactions.myReactions[msg.id] || {};
                  const isOptimistic = String(msg.id).startsWith('optimistic-');

                  return (
                    <div
                      key={msg.id}
                      onTouchStart={(e) => !isOptimistic && longPress.handlePressStart(msg.id, e)}
                      onTouchMove={longPress.handlePressMove}
                      onTouchEnd={longPress.handlePressEnd}
                      onTouchCancel={longPress.handlePressEnd}
                      onMouseDown={(e) => !isOptimistic && longPress.handlePressStart(msg.id, e)}
                      onMouseUp={longPress.handlePressEnd}
                      onMouseLeave={longPress.handlePressEnd}
                      style={{
                        display: 'flex',
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 8,
                        marginBottom: 12,
                        cursor: 'pointer',
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

                      {/* Message Content */}
                      <div style={{ maxWidth: '75%' }}>
                        {/* Message Bubble */}
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: 16,
                            borderBottomLeftRadius: isMe ? 16 : 4,
                            borderBottomRightRadius: isMe ? 4 : 16,
                            background: isMe
                              ? msg.status === 'failed'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : TEAL.primary
                              : 'rgba(255, 255, 255, 0.06)',
                            border: isMe
                              ? msg.status === 'failed'
                                ? '1px solid rgba(239, 68, 68, 0.5)'
                                : 'none'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            opacity: msg.status === 'sending' ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          {!isMe && (
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: TEAL.light,
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
                            {parseStopTags(msg.content, handleStopNavigate)}
                          </p>
                          <div
                            style={{
                              fontSize: 10,
                              color: isMe ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
                              marginTop: 4,
                              textAlign: isMe ? 'right' : 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                              gap: 6,
                            }}
                          >
                            {formatTime(msg.created_at)}
                            {msg.updated_at &&
                              msg.created_at &&
                              new Date(msg.updated_at).getTime() -
                                new Date(msg.created_at).getTime() >
                                2000 && (
                                <span style={{ opacity: 0.7, fontStyle: 'italic' }}>
                                  (edited)
                                </span>
                              )}
                            {msg.status === 'sending' && (
                              <IonSpinner
                                name="dots"
                                style={{ width: 12, height: 12, opacity: 0.7 }}
                              />
                            )}
                            {msg.status === 'failed' && (
                              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                Failed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Reactions Bar */}
                        {!isOptimistic && (
                          <TourReactionBar
                            reactions={msgReactions}
                            myReactions={myMsgReactions}
                            onToggle={(emoji) => reactions.toggleReaction(msg.id, emoji)}
                            showAddButton={Object.keys(msgReactions).length > 0}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={chat.bottomRef} style={{ height: 1 }} />
          </>
        )}
      </div>

      {/* Composer */}
      <div
        style={{
          borderTop: '1px solid rgba(60, 61, 68, 0.25)',
          width: '100%',
          backdropFilter: 'blur(10px)',
          background: '#050509',
          transition: keyboard.isAndroid
            ? 'padding-bottom 280ms cubic-bezier(0.17, 0.59, 0.4, 0.77)'
            : 'none',
          ...(keyboard.isAndroid &&
          typeof keyboard.composerPaddingBottom === 'number' &&
          keyboard.composerPaddingBottom > 20
            ? {
                position: 'fixed' as const,
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                paddingBottom: keyboard.composerPaddingBottom,
              }
            : {
                paddingBottom: keyboard.composerPaddingBottom,
              }),
        }}
      >
        <div
          style={{
            paddingTop: 10,
            paddingInline: 10,
            paddingBottom: 4,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          <div
            className="tour-composer-container"
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 47,
              maxHeight: 47,
              borderRadius: 20,
              border: '1px solid rgba(217, 119, 87, 0.2)',
              background: 'rgba(16, 16, 16, 0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              paddingInline: 14,
              boxSizing: 'border-box',
              overflow: 'hidden',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow:
                '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Stop Tags */}
            {stopTags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  marginRight: 8,
                }}
              >
                {stopTags.map((tag) => (
                  <div
                    key={tag.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      paddingLeft: 6,
                      paddingRight: 4,
                      paddingBlock: 3,
                      borderRadius: 10,
                      background: STOP_TAG.bg,
                      border: `1px solid ${STOP_TAG.border}`,
                    }}
                  >
                    <IonIcon
                      icon={locationOutline}
                      style={{
                        fontSize: 11,
                        color: STOP_TAG.icon,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: STOP_TAG.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 80,
                      }}
                    >
                      {tag.venueName}
                    </span>
                    <button
                      onClick={() => handleRemoveStopTag(tag.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        margin: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: STOP_TAG.text,
                        opacity: 0.7,
                      }}
                    >
                      <IonIcon icon={closeCircle} style={{ fontSize: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <IonTextarea
              autoGrow={false}
              rows={1}
              value={chatInput}
              placeholder={stopTags.length > 0 ? 'Add a message...' : 'Message... (type @stops)'}
              onIonInput={(e) => handleChatInputChange(e.detail.value ?? '')}
              onKeyDown={handleChatKeyDown}
              enterkeyhint="send"
              inputMode="text"
              className="tour-composer-textarea"
              style={
                {
                  width: '100%',
                  margin: 0,
                  '--padding-start': '0px',
                  '--padding-end': '0px',
                  '--padding-top': '0px',
                  '--padding-bottom': '0px',
                  '--highlight-height': '0px',
                  '--border-width': '0px',
                  '--background': 'transparent',
                  fontSize: 16,
                  lineHeight: '36px',
                  color: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 400,
                } as React.CSSProperties
              }
            />
          </div>
          {/* Stop picker button */}
          <button
            type="button"
            onClick={() => setStopPickerOpen(true)}
            aria-label="Tag a stop"
            style={{
              width: 36,
              height: 47,
              borderRadius: 10,
              border: `1px solid ${STOP_TAG.border}`,
              background: STOP_TAG.bg,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <IonIcon icon={locationOutline} style={{ fontSize: 18, color: STOP_TAG.icon }} />
          </button>
          <button
            type="button"
            onClick={handleSendMessage}
            aria-label="Send message"
            disabled={(!chatInput.trim() && stopTags.length === 0) || chat.sending}
            style={{
              width: 44,
              height: 47,
              borderRadius: 12,
              border: (chatInput.trim() || stopTags.length > 0)
                ? '1px solid rgba(217, 119, 87, 0.5)'
                : '1px solid rgba(148, 163, 184, 0.3)',
              background: (chatInput.trim() || stopTags.length > 0)
                ? 'rgba(217, 119, 87, 0.95)'
                : 'rgba(15, 23, 42, 0.8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: (chatInput.trim() || stopTags.length > 0) ? '0 4px 16px rgba(217, 119, 87, 0.4)' : 'none',
              color: (chatInput.trim() || stopTags.length > 0) ? '#000000' : '#9ca3af',
              cursor: 'pointer',
              transform: (chatInput.trim() || stopTags.length > 0) ? 'scale(1)' : 'scale(0.95)',
              opacity: chat.sending ? 0.6 : (chatInput.trim() || stopTags.length > 0) ? 1 : 0.6,
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <IonIcon icon={sendIcon} style={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      {/* Tour Composer Styles */}
      <style>
        {`
          .tour-composer-container:focus-within {
            border-color: rgba(217, 119, 87, 0.4);
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12),
                        0 0 0 3px rgba(217, 119, 87, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .tour-composer-textarea {
            --placeholder-opacity: 0.5;
            --placeholder-color: #94A3B8;
          }

          .tour-composer-textarea textarea,
          .tour-composer-textarea .native-textarea {
            height: auto !important;
            min-height: 36px !important;
            max-height: 72px !important;
            line-height: 20px !important;
            padding: 8px 0 !important;
            margin: 0 !important;
            resize: none !important;
            overflow-y: auto !important;
            font-weight: 400 !important;
            caret-color: #d97757 !important;
          }

          .tour-composer-textarea textarea::placeholder,
          .tour-composer-textarea .native-textarea::placeholder {
            line-height: 20px !important;
            color: #94A3B8 !important;
            opacity: 0.5 !important;
          }

          .tour-composer-textarea textarea::selection,
          .tour-composer-textarea .native-textarea::selection {
            background-color: rgba(217, 119, 87, 0.3);
            color: #F8FAFC;
          }
        `}
      </style>

      {/* Message Action Sheet */}
      <TourMessageActionSheet
        open={activeMessageId !== null}
        message={activeMessage}
        canEdit={activeMessage ? canEditMessage(activeMessage) : false}
        canDelete={activeMessage ? canDeleteMessage(activeMessage) : false}
        onClose={handleCloseActionSheet}
        onDelete={handleDeleteMessage}
        onReact={handleReactToMessage}
        onEdit={handleEditMessage}
      />

      {/* Stop Picker Modal */}
      <TourChatStopPickerModal
        isOpen={stopPickerOpen}
        tourId={tourId}
        onClose={() => setStopPickerOpen(false)}
        onSelect={handleStopSelect}
      />
    </div>
  );

  // Render Settings Tab
  const renderSettingsTab = () => (
    <div
      style={{
        padding: 16,
        paddingBottom: 100,
        maxWidth: 600,
        margin: '0 auto',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {isAdmin ? (
        <TourActionsSection
          onEditClick={() => handleButtonPress('edit', startEditTour)}
          onDeleteClick={() => handleButtonPress('delete', openDeleteTourConfirm)}
          isEditPressed={pressedButton === 'edit'}
          isDeletePressed={pressedButton === 'delete'}
        />
      ) : (
        <div
          style={{
            ...glassCard,
            padding: 20,
            textAlign: 'center',
          }}
        >
          <IonIcon
            icon={shieldCheckmarkOutline}
            style={{ fontSize: 32, color: '#6b7280', marginBottom: 12 }}
          />
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
            Only admins can modify tour settings.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <IonPage>
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
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(8, 8, 14, 0.95)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Back Button */}
              <button
                onClick={() => nav(-1)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#9ca3af',
                  flexShrink: 0,
                }}
              >
                <IonIcon icon={chevronBackOutline} style={{ fontSize: 18 }} />
              </button>

              {/* Title & Status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#f9fafb',
                      letterSpacing: '-0.3px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tour?.name ?? (loading ? 'Loading...' : 'Tour')}
                  </h1>
                </div>
              </div>

              {/* Role Badge */}
              {myUserId && myRole && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: isAdmin ? TEAL.subtle : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isAdmin ? TEAL.border : 'rgba(255, 255, 255, 0.08)'}`,
                  }}
                >
                  <IonIcon
                    icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                    style={{
                      fontSize: 12,
                      color: isAdmin ? TEAL.light : '#6b7280',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isAdmin ? TEAL.light : '#6b7280',
                    }}
                  >
                    {isAdmin ? 'Admin' : 'Member'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(8, 8, 14, 0.9)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '0 8px',
            }}
          >
            {TABS.map((tab) => {
              // Only show settings tab for admins
              if (tab.id === 'settings' && !isAdmin) return null;

              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? TEAL.primary : 'transparent'}`,
                    color: isActive ? TEAL.light : '#6b7280',
                    transition: 'all 0.2s',
                  }}
                >
                  <IonIcon icon={tab.icon} style={{ fontSize: 18 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {loading || !hasAttemptedLoad ? (
              <EmptyState variant="loading" message="Loading tour..." />
            ) : !tour ? (
              <EmptyState
                variant="notFound"
                icon={mapOutline}
                title="Tour not found"
                message="This tour may have been deleted or moved."
              />
            ) : (
              <>
                {activeTab === 'details' && renderDetailsTab()}
                {activeTab === 'route' && renderRouteTab()}
                {activeTab === 'chat' && renderChatTab()}
                {activeTab === 'settings' && renderSettingsTab()}
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {addStopOpen && isAdmin && (
          <AddStopModal
            onClose={closeAddStop}
            onSubmit={handleAddStop}
            saving={savingStop}
          />
        )}

        <EditTourModal
          isOpen={showEditTour && isAdmin}
          editName={editName}
          setEditName={setEditName}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editStartDate={editStartDate}
          setEditStartDate={setEditStartDate}
          editEndDate={editEndDate}
          setEditEndDate={setEditEndDate}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          savingTour={savingTour}
          onClose={closeEditTour}
          onSave={saveTourEdits}
        />

        <DeleteTourModal
          isOpen={showDeleteTour && isAdmin}
          tourName={tour?.name ?? ''}
          stopCount={stops.length}
          deletingTour={deletingTour}
          onClose={closeDeleteTourConfirm}
          onDelete={deleteTour}
        />
      </IonContent>
    </IonPage>
  );
}
