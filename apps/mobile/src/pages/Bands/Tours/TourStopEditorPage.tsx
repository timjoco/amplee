/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonToolbar,
} from '@ionic/react';
import {
  bedOutline,
  busOutline,
  callOutline,
  carOutline,
  cashOutline,
  checkmarkCircle,
  chevronBackOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeCircle,
  createOutline,
  documentTextOutline,
  fastFoodOutline,
  listOutline,
  locationOutline,
  musicalNotesOutline,
  personOutline,
  saveOutline,
  shieldCheckmarkOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { EmptyState } from './components/EmptyState';
import { useTourStopSetlist } from './hooks/useTourStopSetlist';
import { glassCard, TEAL } from './lib/styles';
import type {
  TourStopRow,
  TourStopStatus,
  TravelMethod,
} from './types/tourTypes';
import {
  TOUR_STOP_STATUS_LABELS,
  TRAVEL_METHOD_LABELS,
} from './types/tourTypes';

type RouteParams = {
  bandId: string;
  tourId: string;
  stopId: string;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.04)',
  color: '#f9fafb',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: 6,
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
};

// Move these outside the component to prevent re-creation on every render
const FieldGroup = ({
  children,
  columns = 1,
}: {
  children: React.ReactNode;
  columns?: number;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: 12,
      padding: 14,
      width: '100%',
      boxSizing: 'border-box',
    }}
  >
    {children}
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

type SectionKey =
  | 'schedule'
  | 'setlist'
  | 'venue'
  | 'contacts'
  | 'lodging'
  | 'travel'
  | 'hospitality'
  | 'financials';

const SectionHeader = ({
  icon,
  title,
  section,
  color = TEAL.primary,
  expanded,
  onToggle,
}: {
  icon: string;
  title: string;
  section: SectionKey;
  color?: string;
  expanded: boolean;
  onToggle: (section: SectionKey) => void;
}) => (
  <button
    onClick={() => onToggle(section)}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      background: 'transparent',
      border: 'none',
      borderBottom: expanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <IonIcon icon={icon} style={{ fontSize: 18, color }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb' }}>
        {title}
      </span>
    </div>
    <IonIcon
      icon={expanded ? chevronUpOutline : chevronDownOutline}
      style={{ fontSize: 18, color: '#6b7280' }}
    />
  </button>
);

export default function TourStopEditorPage() {
  const nav = useNavigate();
  const { bandId, tourId, stopId } = useParams<RouteParams>();

  // User permissions
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const isAdmin = useMemo(() => myRole === 'admin', [myRole]);

  // Data state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stop, setStop] = useState<TourStopRow | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // View mode state - admins can toggle between edit and itinerary view
  const [viewMode, setViewMode] = useState<'edit' | 'itinerary'>('edit');

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['schedule', 'venue'])
  );

  // Form state - we'll store edits separately
  const [form, setForm] = useState<Partial<TourStopRow>>({});

  // Setlist hook
  const setlistHook = useTourStopSetlist(bandId, form.setlist_id);

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

  // Load stop data
  useEffect(() => {
    if (!stopId) return;

    let alive = true;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('tour_stops')
        .select('*')
        .eq('id', stopId)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.error('Failed to load stop:', error);
        setStop(null);
      } else {
        setStop(data);
        setForm(data ?? {});
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [stopId]);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateField = useCallback(
    <K extends keyof TourStopRow>(field: K, value: TourStopRow[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  const handleSave = async () => {
    if (!stopId || !isAdmin || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tour_stops')
        .update({
          ...form,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stopId);

      if (error) throw error;

      setStop((prev) => (prev ? { ...prev, ...form } : null));
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save stop:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!stopId || !isAdmin) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this stop? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('tour_stops')
        .delete()
        .eq('id', stopId);

      if (error) throw error;

      nav(`/bands/${bandId}/tours/${tourId}`, { replace: true });
    } catch (err) {
      console.error('Failed to delete stop:', err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const statusColor =
    form.status === 'confirmed'
      ? '#10b981'
      : form.status === 'cancelled'
      ? '#ef4444'
      : '#f59e0b';

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
            <div style={{ flex: 1, minWidth: 0 }}>
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
                {stop?.venue_name ?? (loading ? 'Loading...' : 'Stop')}
              </h1>
              {stop?.date && (
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  {formatDate(stop.date)}
                  {stop.venue_city && ` · ${stop.venue_city}`}
                  {stop.venue_state && `, ${stop.venue_state}`}
                </p>
              )}
            </div>

            {/* Status Badge */}
            {stop && (
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: `${statusColor}20`,
                  border: `1px solid ${statusColor}40`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: statusColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}
                >
                  {TOUR_STOP_STATUS_LABELS[form.status as TourStopStatus]}
                </span>
              </div>
            )}

            {/* View Mode Toggle - only for admins */}
            {isAdmin && (
              <button
                onClick={() =>
                  setViewMode((prev) => (prev === 'edit' ? 'itinerary' : 'edit'))
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background:
                    viewMode === 'itinerary'
                      ? TEAL.subtle
                      : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    viewMode === 'itinerary'
                      ? TEAL.border
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                }}
              >
                <IonIcon
                  icon={viewMode === 'edit' ? listOutline : createOutline}
                  style={{
                    fontSize: 14,
                    color: viewMode === 'itinerary' ? TEAL.light : '#9ca3af',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: viewMode === 'itinerary' ? TEAL.light : '#9ca3af',
                  }}
                >
                  {viewMode === 'edit' ? 'View' : 'Edit'}
                </span>
              </button>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        {loading ? (
          <EmptyState variant="loading" message="Loading stop..." />
        ) : !stop ? (
          <EmptyState
            variant="notFound"
            icon={locationOutline}
            title="Stop not found"
            message="This stop may have been deleted."
          />
        ) : (
          <div
            style={{
              padding: 16,
              paddingBottom: 120,
              maxWidth: 600,
              margin: '0 auto',
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
                  Viewing as member. Only admins can edit.
                </span>
              </div>
            )}

            {/* Stop Overview - shown for members OR admins in itinerary view */}
            {(!isAdmin || viewMode === 'itinerary') && (
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
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon
                    icon={locationOutline}
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
                    Stop Overview
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
                  {TOUR_STOP_STATUS_LABELS[form.status as TourStopStatus]}
                </span>
              </div>

              {/* Date */}
              {form.date && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IonIcon icon={timeOutline} style={{ fontSize: 14, color: TEAL.light }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Date</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f9fafb' }}>
                    {formatDate(form.date)}
                  </div>
                </div>
              )}

              {/* Venue */}
              {(form.venue_name || form.venue_address || form.venue_city) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IonIcon icon={locationOutline} style={{ fontSize: 14, color: '#3b82f6' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Venue</span>
                  </div>
                  {form.venue_name && (
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f9fafb' }}>
                      {form.venue_name}
                    </div>
                  )}
                  {(form.venue_address || form.venue_city) && (
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                      {[form.venue_address, form.venue_city, form.venue_state]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                  {form.venue_capacity && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      Capacity: {form.venue_capacity.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Times Grid */}
              {(form.load_in_time || form.sound_check_time || form.doors_time || form.set_time || form.curfew_time) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <IonIcon icon={timeOutline} style={{ fontSize: 14, color: TEAL.light }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Schedule</span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {form.load_in_time && (
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 6,
                          padding: '6px 8px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                          Load In
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
                          {formatTime(form.load_in_time)}
                        </div>
                      </div>
                    )}
                    {form.sound_check_time && (
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 6,
                          padding: '6px 8px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                          Sound Check
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
                          {formatTime(form.sound_check_time)}
                        </div>
                      </div>
                    )}
                    {form.doors_time && (
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 6,
                          padding: '6px 8px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                          Doors
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
                          {formatTime(form.doors_time)}
                        </div>
                      </div>
                    )}
                    {form.set_time && (
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 6,
                          padding: '6px 8px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                          Set Time
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
                          {formatTime(form.set_time)}
                        </div>
                      </div>
                    )}
                    {form.curfew_time && (
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 6,
                          padding: '6px 8px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                          Curfew
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
                          {formatTime(form.curfew_time)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Setlist */}
              {setlistHook.assignedSetlist && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IonIcon
                        icon={musicalNotesOutline}
                        style={{ fontSize: 14, color: '#f472b6' }}
                      />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        Setlist
                      </span>
                    </div>
                    {setlistHook.formatTotalDuration() && (
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        {setlistHook.formatTotalDuration()}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 8,
                      border: '1px solid rgba(236, 72, 153, 0.2)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        background: 'rgba(236, 72, 153, 0.1)',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f472b6' }}>
                        {setlistHook.assignedSetlist.name}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                        {setlistHook.assignedSetlist.items.length} songs
                      </span>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {setlistHook.assignedSetlist.items.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.song_id) {
                              nav(`/bands/${bandId}/songs/${item.song_id}`);
                            }
                          }}
                          disabled={!item.song_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderBottom:
                              index < setlistHook.assignedSetlist!.items.length - 1
                                ? '1px solid rgba(255, 255, 255, 0.04)'
                                : 'none',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: item.song_id ? 'pointer' : 'default',
                          }}
                        >
                          <span
                            style={{
                              width: 20,
                              fontSize: 11,
                              color: '#6b7280',
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}.
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              color: item.song_id ? '#f472b6' : '#e5e7eb',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.title}
                          </span>
                          {item.musical_key && (
                            <span
                              style={{
                                fontSize: 11,
                                color: '#9ca3af',
                                marginLeft: 8,
                                flexShrink: 0,
                              }}
                            >
                              {item.musical_key}
                            </span>
                          )}
                          {item.duration_seconds && (
                            <span
                              style={{
                                fontSize: 11,
                                color: '#6b7280',
                                marginLeft: 8,
                                flexShrink: 0,
                              }}
                            >
                              {setlistHook.formatDuration(item.duration_seconds)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Row */}
              {(form.promoter_name || form.production_contact_name) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <IonIcon icon={callOutline} style={{ fontSize: 14, color: '#8b5cf6' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Contacts</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {form.promoter_name && (
                      <div
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          borderRadius: 6,
                          padding: '6px 10px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 2 }}>
                          Promoter
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e5e7eb' }}>
                          {form.promoter_name}
                        </div>
                      </div>
                    )}
                    {form.production_contact_name && (
                      <div
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          borderRadius: 6,
                          padding: '6px 10px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 2 }}>
                          Production
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e5e7eb' }}>
                          {form.production_contact_name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hotel */}
              {form.hotel_name && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IonIcon icon={bedOutline} style={{ fontSize: 14, color: '#f59e0b' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Lodging</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#e5e7eb' }}>
                    {form.hotel_name}
                  </div>
                  {form.hotel_address && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {form.hotel_address}
                    </div>
                  )}
                  {form.hotel_confirmation && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      Confirmation: {form.hotel_confirmation}
                    </div>
                  )}
                </div>
              )}

              {/* Travel */}
              {(form.travel_departure_location || form.travel_method) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IonIcon icon={carOutline} style={{ fontSize: 14, color: '#ec4899' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Travel</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#e5e7eb' }}>
                    {form.travel_method && (
                      <span style={{ fontWeight: 500 }}>
                        {TRAVEL_METHOD_LABELS[form.travel_method]}
                      </span>
                    )}
                    {form.travel_departure_location && (
                      <span>
                        {form.travel_method ? ' from ' : 'From '}
                        {form.travel_departure_location}
                      </span>
                    )}
                    {form.travel_departure_time && (
                      <span> at {formatTime(form.travel_departure_time)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {form.notes && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IonIcon icon={documentTextOutline} style={{ fontSize: 14, color: '#6b7280' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Notes</span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#d1d5db',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {form.notes}
                  </div>
                </div>
              )}

              {/* Empty state if nothing filled in */}
              {!form.date &&
                !form.venue_name &&
                !form.load_in_time &&
                !form.hotel_name &&
                !form.travel_departure_location &&
                !form.notes && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px 0',
                      color: '#6b7280',
                      fontSize: 13,
                    }}
                  >
                      No details have been added to this stop yet.
                  </div>
                )}
              </div>
            )}

            {/* Edit Sections - only shown for admins in edit mode */}
            {isAdmin && viewMode === 'edit' && (
              <>
                {/* Schedule Section */}
                <div style={{ ...glassCard, marginBottom: 16, overflow: 'hidden' }}>
                  <SectionHeader
                    icon={timeOutline}
                    title="Schedule"
                    section="schedule"
                    expanded={expandedSections.has('schedule')}
                    onToggle={toggleSection}
                  />
              {expandedSections.has('schedule') && (
                <FieldGroup columns={2}>
                  <Field label="Date">
                    <input
                      type="date"
                      value={form.date ?? ''}
                      onChange={(e) => updateField('date', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={form.status ?? 'tentative'}
                      onChange={(e) =>
                        updateField('status', e.target.value as TourStopStatus)
                      }
                      disabled={!isAdmin}
                      style={selectStyle}
                    >
                      {Object.entries(TOUR_STOP_STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Load In">
                    <input
                      type="time"
                      value={form.load_in_time ?? ''}
                      onChange={(e) => updateField('load_in_time', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Sound Check">
                    <input
                      type="time"
                      value={form.sound_check_time ?? ''}
                      onChange={(e) => updateField('sound_check_time', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Doors">
                    <input
                      type="time"
                      value={form.doors_time ?? ''}
                      onChange={(e) => updateField('doors_time', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Set Time">
                    <input
                      type="time"
                      value={form.set_time ?? ''}
                      onChange={(e) => updateField('set_time', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Curfew">
                    <input
                      type="time"
                      value={form.curfew_time ?? ''}
                      onChange={(e) => updateField('curfew_time', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                </FieldGroup>
              )}
            </div>

                {/* Setlist Section */}
                <div style={{ ...glassCard, marginBottom: 16, overflow: 'hidden' }}>
                  <SectionHeader
                    icon={musicalNotesOutline}
                    title="Setlist"
                    section="setlist"
                    color="#ec4899"
                    expanded={expandedSections.has('setlist')}
                    onToggle={toggleSection}
                  />
                  {expandedSections.has('setlist') && (
                    <div style={{ padding: 14 }}>
                      <Field label="Assign Setlist">
                        <select
                          value={form.setlist_id ?? ''}
                          onChange={(e) =>
                            updateField('setlist_id', e.target.value || null)
                          }
                          disabled={!isAdmin}
                          style={selectStyle}
                        >
                          <option value="">No setlist assigned</option>
                          {setlistHook.availableSetlists.map((setlist) => (
                            <option key={setlist.id} value={setlist.id}>
                              {setlist.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* Preview assigned setlist */}
                      {setlistHook.assignedSetlist && (
                        <div style={{ marginTop: 12 }}>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              marginBottom: 6,
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>
                              {setlistHook.assignedSetlist.items.length} songs
                            </span>
                            {setlistHook.formatTotalDuration() && (
                              <span>{setlistHook.formatTotalDuration()}</span>
                            )}
                          </div>
                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: 8,
                              maxHeight: 150,
                              overflowY: 'auto',
                            }}
                          >
                            {setlistHook.assignedSetlist.items.map((item, index) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '6px 10px',
                                  borderBottom:
                                    index < setlistHook.assignedSetlist!.items.length - 1
                                      ? '1px solid rgba(255, 255, 255, 0.04)'
                                      : 'none',
                                  fontSize: 13,
                                  color: '#d1d5db',
                                }}
                              >
                                <span style={{ width: 20, color: '#6b7280', fontSize: 11 }}>
                                  {index + 1}.
                                </span>
                                <span style={{ flex: 1 }}>{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {setlistHook.availableSetlists.length === 0 && (
                        <div
                          style={{
                            marginTop: 12,
                            textAlign: 'center',
                          }}
                        >
                          <p
                            style={{
                              margin: '0 0 12px',
                              fontSize: 13,
                              color: '#6b7280',
                            }}
                          >
                            No setlists created yet.
                          </p>
                          <button
                            onClick={() => nav(`/bands/${bandId}/library`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 16px',
                              borderRadius: 8,
                              background: 'rgba(236, 72, 153, 0.1)',
                              border: '1px solid rgba(236, 72, 153, 0.3)',
                              color: '#f472b6',
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            <IonIcon icon={musicalNotesOutline} style={{ fontSize: 16 }} />
                            Go to Library
                          </button>
                        </div>
                      )}

                      {setlistHook.availableSetlists.length > 0 && (
                        <button
                          onClick={() => nav(`/bands/${bandId}/library`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            marginTop: 12,
                            padding: '8px 12px',
                            borderRadius: 6,
                            background: 'rgba(236, 72, 153, 0.08)',
                            border: '1px solid rgba(236, 72, 153, 0.2)',
                            color: '#f472b6',
                            fontSize: 12,
                            width: '100%',
                          }}
                        >
                          <IonIcon icon={musicalNotesOutline} style={{ fontSize: 14 }} />
                          Open Library
                        </button>
                      )}
                    </div>
                  )}
                </div>

            {/* Venue Section */}
            <div style={{ ...glassCard, marginBottom: 16, overflow: 'hidden' }}>
              <SectionHeader
                icon={locationOutline}
                title="Venue"
                section="venue"
                color="#3b82f6"
                expanded={expandedSections.has('venue')}
                onToggle={toggleSection}
              />
              {expandedSections.has('venue') && (
                <FieldGroup>
                  <Field label="Venue Name">
                    <input
                      type="text"
                      value={form.venue_name ?? ''}
                      onChange={(e) => updateField('venue_name', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                      placeholder="e.g. The Fillmore"
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      type="text"
                      value={form.venue_address ?? ''}
                      onChange={(e) => updateField('venue_address', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                      placeholder="Street address"
                    />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 12, minWidth: 0 }}>
                    <Field label="City">
                      <input
                        type="text"
                        value={form.venue_city ?? ''}
                        onChange={(e) => updateField('venue_city', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="State">
                      <input
                        type="text"
                        value={form.venue_state ?? ''}
                        onChange={(e) => updateField('venue_state', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Capacity">
                      <input
                        type="number"
                        value={form.venue_capacity ?? ''}
                        onChange={(e) =>
                          updateField(
                            'venue_capacity',
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, minWidth: 0 }}>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={form.venue_phone ?? ''}
                        onChange={(e) => updateField('venue_phone', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Website">
                      <input
                        type="url"
                        value={form.venue_website ?? ''}
                        onChange={(e) => updateField('venue_website', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                        placeholder="https://"
                      />
                    </Field>
                  </div>
                </FieldGroup>
              )}
            </div>

            {/* Contacts Section */}
            <div style={{ ...glassCard, marginBottom: 16, overflow: 'hidden' }}>
              <SectionHeader
                icon={callOutline}
                title="Contacts"
                section="contacts"
                color="#8b5cf6"
                expanded={expandedSections.has('contacts')}
                onToggle={toggleSection}
              />
              {expandedSections.has('contacts') && (
                <FieldGroup>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: TEAL.light,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 4,
                    }}
                  >
                    Promoter
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, minWidth: 0 }}>
                    <Field label="Name">
                      <input
                        type="text"
                        value={form.promoter_name ?? ''}
                        onChange={(e) => updateField('promoter_name', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={form.promoter_email ?? ''}
                        onChange={(e) => updateField('promoter_email', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={form.promoter_phone ?? ''}
                        onChange={(e) => updateField('promoter_phone', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: TEAL.light,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginTop: 8,
                      marginBottom: 4,
                    }}
                  >
                    Production
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, minWidth: 0 }}>
                    <Field label="Name">
                      <input
                        type="text"
                        value={form.production_contact_name ?? ''}
                        onChange={(e) =>
                          updateField('production_contact_name', e.target.value)
                        }
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={form.production_contact_email ?? ''}
                        onChange={(e) =>
                          updateField('production_contact_email', e.target.value)
                        }
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={form.production_contact_phone ?? ''}
                        onChange={(e) =>
                          updateField('production_contact_phone', e.target.value)
                        }
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              )}
            </div>

            {/* Lodging Section */}
            <div style={{ ...glassCard, marginBottom: 16, overflow: 'hidden' }}>
              <SectionHeader
                icon={bedOutline}
                title="Lodging"
                section="lodging"
                color="#f59e0b"
                expanded={expandedSections.has('lodging')}
                onToggle={toggleSection}
              />
              {expandedSections.has('lodging') && (
                <FieldGroup>
                  <Field label="Hotel Name">
                    <input
                      type="text"
                      value={form.hotel_name ?? ''}
                      onChange={(e) => updateField('hotel_name', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      type="text"
                      value={form.hotel_address ?? ''}
                      onChange={(e) => updateField('hotel_address', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Confirmation #">
                    <input
                      type="text"
                      value={form.hotel_confirmation ?? ''}
                      onChange={(e) => updateField('hotel_confirmation', e.target.value)}
                      disabled={!isAdmin}
                      style={inputStyle}
                    />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, minWidth: 0 }}>
                    <Field label="Check In">
                      <input
                        type="time"
                        value={form.hotel_check_in ?? ''}
                        onChange={(e) => updateField('hotel_check_in', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Check Out">
                      <input
                        type="time"
                        value={form.hotel_check_out ?? ''}
                        onChange={(e) => updateField('hotel_check_out', e.target.value)}
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              )}
            </div>

            {/* Travel Section */}
            <div style={{ ...glassCard, marginBottom: 16, overflow: 'hidden' }}>
              <SectionHeader
                icon={carOutline}
                title="Travel"
                section="travel"
                color="#ec4899"
                expanded={expandedSections.has('travel')}
                onToggle={toggleSection}
              />
              {expandedSections.has('travel') && (
                <FieldGroup>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, minWidth: 0 }}>
                    <Field label="Departure Location">
                      <input
                        type="text"
                        value={form.travel_departure_location ?? ''}
                        onChange={(e) =>
                          updateField('travel_departure_location', e.target.value)
                        }
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Departure Time">
                      <input
                        type="time"
                        value={form.travel_departure_time ?? ''}
                        onChange={(e) =>
                          updateField('travel_departure_time', e.target.value)
                        }
                        disabled={!isAdmin}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                  <Field label="Travel Method">
                    <select
                      value={form.travel_method ?? ''}
                      onChange={(e) =>
                        updateField('travel_method', e.target.value as TravelMethod)
                      }
                      disabled={!isAdmin}
                      style={selectStyle}
                    >
                      <option value="">Select method...</option>
                      {Object.entries(TRAVEL_METHOD_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Travel Notes">
                    <textarea
                      value={form.travel_notes ?? ''}
                      onChange={(e) => updateField('travel_notes', e.target.value)}
                      disabled={!isAdmin}
                      style={{
                        ...inputStyle,
                        minHeight: 80,
                        resize: 'vertical',
                      }}
                      placeholder="Flight numbers, pickup details, etc."
                    />
                  </Field>
                </FieldGroup>
              )}
            </div>

            {/* Hospitality Section */}
            <div style={{ ...glassCard, marginBottom: 16, overflow: 'hidden' }}>
              <SectionHeader
                icon={fastFoodOutline}
                title="Hospitality"
                section="hospitality"
                color="#10b981"
                expanded={expandedSections.has('hospitality')}
                onToggle={toggleSection}
              />
              {expandedSections.has('hospitality') && (
                <FieldGroup>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#d1d5db' }}>
                      Backline Provided
                    </span>
                    <button
                      onClick={() =>
                        updateField('backline_provided', !form.backline_provided)
                      }
                      disabled={!isAdmin}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: form.backline_provided
                          ? TEAL.primary
                          : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {form.backline_provided && (
                        <IonIcon
                          icon={checkmarkCircle}
                          style={{ fontSize: 16, color: '#fff' }}
                        />
                      )}
                    </button>
                  </div>
                  <Field label="Catering Notes">
                    <textarea
                      value={form.catering_notes ?? ''}
                      onChange={(e) => updateField('catering_notes', e.target.value)}
                      disabled={!isAdmin}
                      style={{
                        ...inputStyle,
                        minHeight: 60,
                        resize: 'vertical',
                      }}
                      placeholder="Meals provided, dietary restrictions, etc."
                    />
                  </Field>
                  <Field label="Green Room Notes">
                    <textarea
                      value={form.green_room_notes ?? ''}
                      onChange={(e) => updateField('green_room_notes', e.target.value)}
                      disabled={!isAdmin}
                      style={{
                        ...inputStyle,
                        minHeight: 60,
                        resize: 'vertical',
                      }}
                      placeholder="Hospitality rider details..."
                    />
                  </Field>
                </FieldGroup>
              )}
            </div>

                {/* General Notes */}
                <div style={{ ...glassCard, marginBottom: 16, padding: 14 }}>
                  <Field label="General Notes">
                    <textarea
                      value={form.notes ?? ''}
                      onChange={(e) => updateField('notes', e.target.value)}
                      disabled={!isAdmin}
                      style={{
                        ...inputStyle,
                        minHeight: 80,
                        resize: 'vertical',
                      }}
                      placeholder="Any additional notes for this stop..."
                    />
                  </Field>
                </div>
              </>
            )}

            {/* Action Buttons - only shown for admins in edit mode */}
            {isAdmin && viewMode === 'edit' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 20px',
                    borderRadius: 12,
                    background: hasChanges ? TEAL.primary : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: hasChanges ? '#fff' : '#6b7280',
                    fontSize: 15,
                    fontWeight: 600,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <IonIcon icon={saveOutline} style={{ fontSize: 18 }} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: 20 }} />
                </button>
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
