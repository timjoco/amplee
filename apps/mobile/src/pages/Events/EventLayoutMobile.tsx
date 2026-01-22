/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  chatbubblesOutline,
  chevronBackOutline,
  documentTextOutline,
  folderOutline,
  informationCircleOutline,
  listOutline,
  peopleOutline,
  settingsOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Import section components
import EventChatPageMobile from './EventChat/EventChatPageMobile';
import EventFilesPage from './EventFiles';
import EventNotesPage from './EventNotes';
import EventRollCallPageMobile from './EventRollCallPageMobile';
import EventSetlistPageMobile from './EventSetlistPageMobile';
import EventSheetContent from './EventSheet/components/EventSheetContent';

type Section = 'chat' | 'details' | 'rollcall' | 'setlist' | 'notes' | 'files';

type EventData = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice' | null;
};

const SECTIONS: Array<{ id: Section; icon: string; label: string }> = [
  { id: 'chat', icon: chatbubblesOutline, label: 'Chat' },
  { id: 'details', icon: informationCircleOutline, label: 'Details' },
  { id: 'rollcall', icon: peopleOutline, label: 'Roll Call' },
  { id: 'setlist', icon: listOutline, label: 'Setlist' },
  { id: 'notes', icon: documentTextOutline, label: 'Notes' },
  { id: 'files', icon: folderOutline, label: 'Files' },
];

// Simple navigation history tracker using sessionStorage
const NAV_HISTORY_KEY = 'amplee_nav_history';

const getNavHistory = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

const addToNavHistory = (path: string) => {
  const history = getNavHistory();
  // Only add if different from last entry (avoid duplicates from re-renders)
  if (history[history.length - 1] !== path) {
    history.push(path);
    // Keep last 20 entries to prevent unbounded growth
    if (history.length > 20) history.shift();
    sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
  }
};

export default function EventLayoutMobile() {
  const nav = useNavigate();
  const location = useLocation();
  const { bandId, eventId } = useParams<{ bandId: string; eventId: string }>();

  const [event, setEvent] = useState<EventData | null>(null);
  // Single state for access to avoid race conditions: 'pending' | 'granted' | 'denied'
  const [accessStatus, setAccessStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section>('chat');

  // Track navigation history for smart back button behavior
  useEffect(() => {
    addToNavHistory(location.pathname);
  }, [location.pathname]);

  // Load event data and check access
  useEffect(() => {
    // Keep loading true to prevent "not found" flash while params are resolving
    if (!eventId || !bandId) {
      return;
    }

    let alive = true;

    const load = async () => {
      setAccessStatus('pending');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!alive || !user) {
          setAccessStatus('denied');
          return;
        }

        // Check band membership
        const { data: bandMember } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();

        const isMember = !!bandMember;
        setIsAdmin(bandMember?.role === 'admin');

        // Check event membership if not band member
        if (!isMember) {
          const { data: eventMember } = await supabase
            .from('event_members')
            .select('user_id')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!eventMember) {
            setAccessStatus('denied');
            return;
          }
        }

        // Load event data
        const { data: eventData, error } = await supabase
          .from('events')
          .select('id, band_id, title, type')
          .eq('id', eventId)
          .single();

        if (!alive) return;

        if (error || !eventData) {
          setEvent(null);
        } else {
          setEvent({
            id: String(eventData.id),
            band_id: String(eventData.band_id),
            title: String(eventData.title ?? 'Event'),
            type: eventData.type === 'practice' ? 'practice' : 'show',
          });
        }

        setAccessStatus('granted');
      } catch (e) {
        console.error('[EventLayout] error:', e);
        if (alive) {
          setAccessStatus('denied');
        }
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [eventId, bandId]);

  const handleBack = useCallback(() => {
    const history = getNavHistory();

    // Check if the previous page was a settings page
    const prevPath = history.length >= 2 ? history[history.length - 2] : null;

    // Only skip settings if the previous page was actually settings
    if (prevPath?.includes('/settings')) {
      nav(-2);
    } else {
      nav(-1);
    }
  }, [nav]);

  const handleSettings = useCallback(() => {
    if (bandId && eventId) {
      nav(`/bands/${bandId}/events/${eventId}/settings`);
    }
  }, [nav, bandId, eventId]);

  // Get section info
  const currentSection = SECTIONS.find((s) => s.id === selectedSection);

  // Render section content
  const renderSection = () => {
    if (!eventId || !bandId) return null;

    switch (selectedSection) {
      case 'chat':
        return <EventChatPageMobile embedded />;
      case 'details':
        return <EventSheetContent eventId={eventId} bandId={bandId} isAdmin={isAdmin} showQuickTiles={false} />;
      case 'rollcall':
        return <EventRollCallPageMobile embedded />;
      case 'setlist':
        return <EventSetlistPageMobile embedded />;
      case 'notes':
        return <EventNotesPage embedded />;
      case 'files':
        return <EventFilesPage embedded />;
      default:
        return null;
    }
  };

  // Skeleton loading state
  if (accessStatus !== 'granted') {
    return (
      <IonPage>
        <IonContent
          fullscreen
          scrollY={false}
          style={{
            '--background': '#050509',
            '--padding-top': '0px',
            '--padding-start': '0px',
            '--padding-end': '0px',
            '--padding-bottom': '0px',
          } as any}
        >
          <style>
            {`
              @keyframes skeleton-pulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.7; }
              }
              .skeleton-pulse {
                animation: skeleton-pulse 1.5s ease-in-out infinite;
              }
            `}
          </style>
          <div
            style={{
              display: 'flex',
              height: '100%',
              paddingTop: 'env(safe-area-inset-top)',
            }}
          >
            {/* LEFT SIDE NAV SKELETON */}
            <div
              style={{
                width: 62,
                background: '#0a0a0a',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              {/* Back button skeleton */}
              <div
                className="skeleton-pulse"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: 28,
                  height: 1,
                  background: 'rgba(255,255,255,0.1)',
                  marginBottom: 8,
                }}
              />
              {/* Section icon skeletons */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton-pulse"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: i === 0 ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                  }}
                />
              ))}
            </div>

            {/* MAIN CONTENT SKELETON */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Header skeleton */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(5, 5, 9, 0.95)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    className="skeleton-pulse"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(52, 211, 153, 0.15)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton-pulse"
                      style={{
                        width: 80,
                        height: 17,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.12)',
                        marginBottom: 6,
                      }}
                    />
                    <div
                      className="skeleton-pulse"
                      style={{
                        width: 140,
                        height: 12,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.08)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Chat content skeleton */}
              <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Message skeletons */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      alignSelf: i % 3 === 1 ? 'flex-end' : 'flex-start',
                      flexDirection: i % 3 === 1 ? 'row-reverse' : 'row',
                    }}
                  >
                    <div
                      className="skeleton-pulse"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="skeleton-pulse"
                      style={{
                        width: [180, 220, 140, 200, 160][i],
                        height: [48, 36, 60, 36, 48][i],
                        borderRadius: 16,
                        background: i % 3 === 1 ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Main layout (accessStatus === 'granted')
  return (
    <IonPage>
      <IonContent
        fullscreen
        scrollY={false}
        style={{
          '--background': '#050509',
          '--padding-top': '0px',
          '--padding-start': '0px',
          '--padding-end': '0px',
          '--padding-bottom': '0px',
        } as any}
      >
        <div
          style={{
            display: 'flex',
            height: '100%',
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          {/* LEFT SIDE NAV */}
          <div
            style={{
              width: 62,
              background: '#0a0a0a',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              height: '100%',
            }}
          >
            {/* Back Button */}
            <button
              onClick={handleBack}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ fontSize: 20, color: '#fff' }}
              />
            </button>

            <div
              style={{
                width: 28,
                height: 1,
                background: 'rgba(255,255,255,0.1)',
                marginBottom: 8,
              }}
            />

            {/* Section Icons */}
            {SECTIONS.map((section) => {
              const isSelected = selectedSection === section.id;
              const sectionColor = '#34d399'; // Green for chat-first

              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: isSelected
                      ? `linear-gradient(135deg, ${sectionColor}30 0%, ${sectionColor}15 100%)`
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <IonIcon
                    icon={section.icon}
                    style={{
                      fontSize: 22,
                      color: isSelected ? sectionColor : 'rgba(255,255,255,0.5)',
                    }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        right: -1,
                        width: 3,
                        height: 24,
                        background: sectionColor,
                        borderRadius: '3px 0 0 3px',
                      }}
                    />
                  )}
                </button>
              );
            })}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Settings Button */}
            {isAdmin && (
              <button
                onClick={handleSettings}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <IonIcon
                  icon={settingsOutline}
                  style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}
                />
              </button>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(5, 5, 9, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Section Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon
                    icon={currentSection?.icon || chatbubblesOutline}
                    style={{ fontSize: 20, color: '#34d399' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {currentSection?.label ?? 'Chat'}
                  </h2>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {event?.title ?? 'Event'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {renderSection()}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
