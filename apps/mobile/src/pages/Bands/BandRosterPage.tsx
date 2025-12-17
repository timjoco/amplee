/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  callOutline,
  checkmarkCircle,
  chevronBackOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  copyOutline,
  logoInstagram,
  mailOutline,
  peopleOutline,
  personOutline,
  shieldCheckmarkOutline,
  trashOutline,
} from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type AvailabilityStatus = 'open' | 'limited' | 'unavailable';

type RosterMember = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  role: string;
  avatar_url: string | null;
  contact_email?: string | null;
  phone?: string | null;
  instagram?: string | null;
  availability: {
    status: AvailabilityStatus;
    status_note: string | null;
    away_until: string | null;
  } | null;
};

type BandRoster = {
  id: string;
  title: string;
  created_at: string;
  created_by: string | null;
};

type RosterMemberLite = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

// ─────────────────────────────────────────────────────────────
// Theme Colors (Blue for Rosters)
// ─────────────────────────────────────────────────────────────

const BLUE = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  light: '#60a5fa',
  lighter: '#93c5fd',
  dark: '#1d4ed8',
  glow: 'rgba(59, 130, 246, 0.4)',
  subtle: 'rgba(59, 130, 246, 0.08)',
  border: 'rgba(59, 130, 246, 0.25)',
};

// ─────────────────────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────────────────────

const glassCard = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
};

const glassCardHover = {
  ...glassCard,
  border: `1px solid ${BLUE.border}`,
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function BandRosterPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();

  // Data state
  const [loading, setLoading] = useState(true);
  const [bandName, setBandName] = useState('');
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [rosters, setRosters] = useState<BandRoster[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Roster expansion
  const [expandedRosterId, setExpandedRosterId] = useState<string | null>(null);
  const [rosterMembersByRosterId, setRosterMembersByRosterId] = useState<
    Record<string, RosterMemberLite[] | undefined>
  >({});

  // Create roster modal
  const [showCreateRoster, setShowCreateRoster] = useState(false);
  const [creatingRoster, setCreatingRoster] = useState(false);
  const [newRosterTitle, setNewRosterTitle] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Member detail sheet
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const [activeMember, setActiveMember] = useState<RosterMember | null>(null);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Current user & permissions
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  const getDisplayName = (m: {
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  }) => {
    const full = [m.first_name, m.last_name].filter(Boolean).join(' ');
    return m.display_name || full || 'Unknown';
  };

  const getInitials = (m: {
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  }) => {
    const name = getDisplayName(m);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // ─────────────────────────────────────────────────────────────
  // Computed values
  // ─────────────────────────────────────────────────────────────

  const isAdmin = useMemo(() => {
    if (!myUserId) return false;
    const me = members.find((m) => m.user_id === myUserId);
    return me?.role === 'admin';
  }, [members, myUserId]);

  const adminUserIds = useMemo(
    () => members.filter((m) => m.role === 'admin').map((m) => m.user_id),
    [members]
  );

  const selectionHasAdmin = useMemo(() => {
    const set = new Set(selectedUserIds);
    return adminUserIds.some((id) => set.has(id));
  }, [selectedUserIds, adminUserIds]);

  const selectedPreview = useMemo(() => {
    const byId = new Map(members.map((m) => [m.user_id, m]));
    return selectedUserIds
      .map((id) => byId.get(id))
      .filter(Boolean) as RosterMember[];
  }, [members, selectedUserIds]);

  // ─────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────

  const toggleSelected = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const copyText = async (txt: string, field: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.warn('[clipboard] failed', e);
    }
  };

  const instagramUrl = (s: string) => {
    const raw = s.trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const handle = raw.startsWith('@') ? raw.slice(1) : raw;
    return `https://instagram.com/${handle}`;
  };

  const openMemberSheet = (m: RosterMember) => {
    setActiveMember(m);
    setShowMemberSheet(true);
  };

  const beginCreateRoster = () => {
    setError(null);
    if (!isAdmin) {
      setError('Only band admins can create rosters.');
      return;
    }
    setNewRosterTitle('');
    setSelectedUserIds([...adminUserIds]);
    setShowCreateRoster(true);
  };

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMyUserId(data.user?.id ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive || !bandId) return;

      try {
        setLoading(true);
        setError(null);

        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('name')
          .eq('id', bandId)
          .maybeSingle();
        if (bandErr) throw bandErr;
        if (band) setBandName(band.name ?? '');

        const { data: rosterData, error: rosterErr } = await supabase
          .from('band_members')
          .select(
            `
              user_id,
              role,
              created_at,
              profiles!band_memberships_user_id_fkey(
                id,
                first_name,
                last_name,
                display_name,
                avatar_url,
                contact_email,
                phone,
                instagram
              )
            `
          )
          .eq('band_id', bandId)
          .order('created_at', { ascending: true });

        if (rosterErr) throw rosterErr;
        if (!alive) return;

        const formattedMembers: RosterMember[] = (rosterData ?? []).map(
          (m: any) => {
            const profile = Array.isArray(m.profiles)
              ? m.profiles[0]
              : m.profiles;

            return {
              id: m.user_id,
              user_id: m.user_id,
              first_name: profile?.first_name ?? null,
              last_name: profile?.last_name ?? null,
              display_name: profile?.display_name ?? null,
              role: m.role,
              avatar_url: profile?.avatar_url ?? null,
              contact_email: profile?.contact_email ?? null,
              phone: profile?.phone ?? null,
              instagram: profile?.instagram ?? null,
              availability: null,
            };
          }
        );

        setMembers(formattedMembers);

        const { data: rostersData, error: rostersErr } = await supabase
          .from('band_rosters')
          .select('id,title,created_at,created_by')
          .eq('band_id', bandId)
          .order('created_at', { ascending: false });

        if (rostersErr) throw rostersErr;
        if (!alive) return;

        setRosters((rostersData ?? []) as any);
      } catch (err: any) {
        console.error('[BandRosterPage] error:', err);
        if (alive) setError(err?.message || 'Failed to load roster');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const loadRosterMembers = async (rosterId: string) => {
    if (!bandId) return;
    if (rosterMembersByRosterId[rosterId]) return;

    const { data: rm, error: rmErr } = await supabase
      .from('band_roster_members')
      .select('user_id')
      .eq('roster_id', rosterId);

    if (rmErr) throw rmErr;

    const userIds: string[] = (rm ?? [])
      .map((r: any) => r.user_id)
      .filter(Boolean);

    if (userIds.length === 0) {
      setRosterMembersByRosterId((prev) => ({ ...prev, [rosterId]: [] }));
      return;
    }

    const { data: bm, error: bmErr } = await supabase
      .from('band_members')
      .select(
        `
          role,
          user_id,
          profiles!band_memberships_user_id_fkey(
            id,
            first_name,
            last_name,
            display_name,
            avatar_url
          )
        `
      )
      .eq('band_id', bandId)
      .in('user_id', userIds);

    if (bmErr) throw bmErr;

    const formatted: RosterMemberLite[] = (bm ?? []).map((row: any) => {
      const profile = Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;
      return {
        user_id: row.user_id,
        role: row.role,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      };
    });

    const byId = new Map(formatted.map((m) => [m.user_id, m]));
    const ordered = userIds
      .map((id) => byId.get(id))
      .filter(Boolean) as RosterMemberLite[];

    setRosterMembersByRosterId((prev) => ({ ...prev, [rosterId]: ordered }));
  };

  const slugifyRosterName = (s: string) => {
    const base = s
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    return base || `roster-${Date.now()}`;
  };

  const submitCreateRoster = async () => {
    if (!bandId) return;

    if (!isAdmin) {
      setError('Only band admins can create rosters.');
      return;
    }

    const title = newRosterTitle.trim();
    if (!title) {
      setError('Enter a roster title.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Select at least one member.');
      return;
    }
    if (!selectionHasAdmin) {
      setError('Roster must include at least one admin.');
      return;
    }

    setError(null);
    setCreatingRoster(true);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const user = userData?.user;
      if (userErr || !user) throw new Error('Please sign in.');

      // ✅ REQUIRED by your schema
      const name = slugifyRosterName(title);

      const { data: roster, error: rErr } = await supabase
        .from('band_rosters')
        .insert({
          band_id: bandId,
          name, // ✅ fixes 23502
          title, // you already had this
          created_by: user.id,
        } as any)
        .select('id,title,created_at,created_by')
        .single();

      if (rErr) throw rErr;

      const rows = selectedUserIds.map((uid) => ({
        roster_id: roster.id,
        user_id: uid,
      }));

      const { error: rmErr } = await supabase
        .from('band_roster_members')
        .insert(rows as any);

      if (rmErr) throw rmErr;

      setRosters((prev) => [roster as any, ...prev]);

      const lite: RosterMemberLite[] = selectedPreview.map((m) => ({
        user_id: m.user_id,
        first_name: m.first_name,
        last_name: m.last_name,
        display_name: m.display_name,
        avatar_url: m.avatar_url,
        role: m.role,
      }));
      setRosterMembersByRosterId((prev) => ({ ...prev, [roster.id]: lite }));

      setShowCreateRoster(false);
      setNewRosterTitle('');
      setSelectedUserIds([]);
    } catch (e: any) {
      console.error('[submitCreateRoster]', e);
      setError(String(e?.message ?? 'Failed to create roster'));
    } finally {
      setCreatingRoster(false);
    }
  };

  const deleteRoster = async (rosterId: string) => {
    if (!isAdmin) {
      setError('Only band admins can delete rosters.');
      return;
    }

    try {
      setError(null);
      const { error: delErr } = await supabase
        .from('band_rosters')
        .delete()
        .eq('id', rosterId);
      if (delErr) throw delErr;

      setRosters((prev) => prev.filter((r) => r.id !== rosterId));
      setRosterMembersByRosterId((prev) => {
        const next = { ...prev };
        delete next[rosterId];
        return next;
      });
      if (expandedRosterId === rosterId) setExpandedRosterId(null);
    } catch (e: any) {
      console.error('[deleteRoster]', e);
      setError(String(e?.message ?? 'Failed to delete roster'));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

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
              onClick={() => navigate(`/bands/${bandId}`)}
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

            {/* Title Section */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={peopleOutline}
                  style={{ color: BLUE.light, fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Rosters
                </h1>
              </div>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    marginTop: 2,
                    marginLeft: 28,
                  }}
                >
                  {bandName}
                </div>
              )}
            </div>

            {/* Admin Badge */}
            {myUserId && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: isAdmin
                    ? BLUE.subtle
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isAdmin ? BLUE.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                }}
              >
                <IonIcon
                  icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                  style={{
                    fontSize: 14,
                    color: isAdmin ? BLUE.light : '#6b7280',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isAdmin ? BLUE.light : '#6b7280',
                  }}
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="roster-content"
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <IonSpinner
                style={{
                  '--color': BLUE.primary,
                  width: 32,
                  height: 32,
                }}
              />
              <div
                style={{
                  color: '#6b7280',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Loading rosters...
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              maxWidth: 600,
              margin: '0 auto',
              paddingBottom: 40,
            }}
          >
            {/* Error Banner */}
            {error && (
              <div
                style={{
                  ...glassCard,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: 14,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <IonIcon
                  icon={closeOutline}
                  style={{ color: '#f87171', fontSize: 18, marginTop: 1 }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ color: '#fca5a5', fontSize: 14, fontWeight: 500 }}
                  >
                    {error}
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    padding: 4,
                  }}
                >
                  <IonIcon icon={closeOutline} style={{ fontSize: 16 }} />
                </button>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SAVED ROSTERS SECTION
            ───────────────────────────────────────────────────────────── */}
            <section style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: BLUE.primary,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Saved Rosters
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {rosters.length}
                  </span>
                </div>

                {/* Create Button */}
                {isAdmin && (
                  <button
                    onClick={beginCreateRoster}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: BLUE.primary,
                      border: 'none',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: `0 4px 12px ${BLUE.glow}`,
                    }}
                  >
                    <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
                    New Roster
                  </button>
                )}
              </div>

              {/* Non-admin notice */}
              {!isAdmin && (
                <div
                  style={{
                    ...glassCard,
                    padding: 12,
                    marginBottom: 12,
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
                    Only band admins can create or delete rosters
                  </span>
                </div>
              )}

              {/* Roster List */}
              {rosters.length === 0 ? (
                <div
                  style={{
                    ...glassCard,
                    padding: 32,
                    textAlign: 'center',
                  }}
                >
                  <IonIcon
                    icon={peopleOutline}
                    style={{
                      fontSize: 36,
                      color: '#4b5563',
                      marginBottom: 12,
                    }}
                  />
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    No rosters created yet
                  </div>
                  {isAdmin && (
                    <div
                      style={{ color: '#4b5563', fontSize: 13, marginTop: 4 }}
                    >
                      Create one to save different band lineups
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {rosters.map((roster) => {
                    const isExpanded = expandedRosterId === roster.id;
                    const rosterMembers = rosterMembersByRosterId[roster.id];

                    return (
                      <div
                        key={roster.id}
                        style={{
                          ...glassCard,
                          overflow: 'hidden',
                          border: isExpanded
                            ? `1px solid ${BLUE.border}`
                            : glassCard.border,
                        }}
                      >
                        {/* Roster Header */}
                        <button
                          onClick={async () => {
                            try {
                              if (isExpanded) {
                                setExpandedRosterId(null);
                                return;
                              }
                              setExpandedRosterId(roster.id);
                              await loadRosterMembers(roster.id);
                            } catch (e: any) {
                              setError(
                                String(
                                  e?.message ?? 'Failed to load roster members'
                                )
                              );
                            }
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 14,
                            background: 'transparent',
                            border: 'none',
                            color: '#f9fafb',
                            textAlign: 'left',
                          }}
                        >
                          {/* Roster Icon */}
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: BLUE.subtle,
                              border: `1px solid ${BLUE.border}`,
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <IonIcon
                              icon={peopleOutline}
                              style={{ color: BLUE.light, fontSize: 18 }}
                            />
                          </div>

                          {/* Roster Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 15,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {roster.title}
                            </div>
                            <div
                              style={{
                                color: '#6b7280',
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              {rosterMembers
                                ? `${rosterMembers.length} member${
                                    rosterMembers.length !== 1 ? 's' : ''
                                  }`
                                : 'Tap to view'}
                            </div>
                          </div>

                          {/* Expand/Collapse Icon */}
                          <IonIcon
                            icon={
                              isExpanded ? chevronUpOutline : chevronDownOutline
                            }
                            style={{ color: '#6b7280', fontSize: 18 }}
                          />
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div
                            style={{
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                              padding: 12,
                              background: 'rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            {!rosterMembers ? (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  padding: 16,
                                }}
                              >
                                <IonSpinner
                                  style={{ '--color': BLUE.primary }}
                                />
                              </div>
                            ) : rosterMembers.length === 0 ? (
                              <div
                                style={{
                                  color: '#6b7280',
                                  fontSize: 13,
                                  textAlign: 'center',
                                  padding: 12,
                                }}
                              >
                                No members in this roster
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6,
                                }}
                              >
                                {rosterMembers.map((m) => {
                                  const name = getDisplayName(m);
                                  const initials = getInitials(m);

                                  return (
                                    <div
                                      key={m.user_id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border:
                                          '1px solid rgba(255, 255, 255, 0.04)',
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: 8,
                                          background: BLUE.subtle,
                                          border: `1px solid ${BLUE.border}`,
                                          display: 'grid',
                                          placeItems: 'center',
                                          color: BLUE.light,
                                          fontSize: 11,
                                          fontWeight: 700,
                                        }}
                                      >
                                        {initials}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            color: '#e5e7eb',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {name}
                                        </div>
                                        <div
                                          style={{
                                            color: '#6b7280',
                                            fontSize: 11,
                                            textTransform: 'capitalize',
                                          }}
                                        >
                                          {m.role}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Delete Button (Admin Only) */}
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteRoster(roster.id);
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '10px 14px',
                                  marginTop: 10,
                                  borderRadius: 10,
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                <IonIcon
                                  icon={trashOutline}
                                  style={{ fontSize: 15 }}
                                />
                                Delete Roster
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ─────────────────────────────────────────────────────────────
                BAND MEMBERS DIRECTORY
            ───────────────────────────────────────────────────────────── */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#22c55e',
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Band Members
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {members.length}
                </span>
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {members.map((member) => {
                  const displayName = getDisplayName(member);
                  const fullName = [member.first_name, member.last_name]
                    .filter(Boolean)
                    .join(' ');
                  const initials = getInitials(member);
                  const showFullName =
                    member.display_name &&
                    fullName &&
                    member.display_name !== fullName;

                  return (
                    <button
                      key={member.id}
                      onClick={() => openMemberSheet(member)}
                      style={{
                        ...glassCard,
                        width: '100%',
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        textAlign: 'left',
                        color: 'inherit',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#9ca3af',
                          fontSize: 14,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>

                      {/* Member Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: '#f9fafb',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {displayName}
                          </span>
                          {member.role === 'admin' && (
                            <IonIcon
                              icon={shieldCheckmarkOutline}
                              style={{ color: BLUE.light, fontSize: 14 }}
                            />
                          )}
                        </div>

                        {showFullName && (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fullName}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: 12,
                            color: '#6b7280',
                            textTransform: 'capitalize',
                            marginTop: showFullName ? 0 : 2,
                          }}
                        >
                          {member.role}
                        </div>
                      </div>

                      {/* Contact indicator */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#6b7280',
                          fontSize: 12,
                        }}
                      >
                        <span>View</span>
                        <IonIcon
                          icon={chevronDownOutline}
                          style={{ fontSize: 14 }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            CREATE ROSTER MODAL
        ───────────────────────────────────────────────────────────── */}
        <IonModal
          isOpen={showCreateRoster}
          onDidDismiss={() => setShowCreateRoster(false)}
        >
          <IonHeader translucent className="ion-no-border">
            <IonToolbar
              style={{
                '--background': 'rgba(8, 8, 14, 0.98)',
                '--border-width': 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: BLUE.subtle,
                      border: `1px solid ${BLUE.border}`,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <IonIcon
                      icon={addOutline}
                      style={{ color: BLUE.light, fontSize: 18 }}
                    />
                  </div>
                  <span
                    style={{
                      color: '#f9fafb',
                      fontWeight: 700,
                      fontSize: 17,
                    }}
                  >
                    New Roster
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateRoster(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#9ca3af',
                  }}
                >
                  <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
                </button>
              </div>
            </IonToolbar>
          </IonHeader>

          <IonContent
            fullscreen
            style={{
              '--background':
                'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
            }}
          >
            <div
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Title Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#9ca3af',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Roster Name
                </label>
                <input
                  value={newRosterTitle}
                  onChange={(e) => setNewRosterTitle(e.target.value)}
                  placeholder="e.g. Weekend Lineup, Full Band, Acoustic Set"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${
                      newRosterTitle ? BLUE.border : 'rgba(255, 255, 255, 0.08)'
                    }`,
                    color: '#f9fafb',
                    fontSize: 15,
                    outline: 'none',
                  }}
                  disabled={!isAdmin}
                />
              </div>

              {/* Member Selection */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Select Members
                  </label>
                  <span
                    style={{
                      fontSize: 12,
                      color:
                        selectedUserIds.length > 0 ? BLUE.light : '#6b7280',
                      fontWeight: 600,
                    }}
                  >
                    {selectedUserIds.length} selected
                  </span>
                </div>

                {/* Admin Warning */}
                {!selectionHasAdmin && (
                  <div
                    style={{
                      ...glassCard,
                      background: 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      padding: 12,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <IonIcon
                      icon={shieldCheckmarkOutline}
                      style={{ color: '#fbbf24', fontSize: 16 }}
                    />
                    <span style={{ color: '#fde68a', fontSize: 13 }}>
                      Roster must include at least one admin
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {members.map((m) => {
                    const name = getDisplayName(m);
                    const initials = getInitials(m);
                    const isChecked = selectedUserIds.includes(m.user_id);

                    return (
                      <button
                        key={m.user_id}
                        onClick={() => isAdmin && toggleSelected(m.user_id)}
                        disabled={!isAdmin}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 12,
                          background: isChecked
                            ? BLUE.subtle
                            : 'rgba(255, 255, 255, 0.02)',
                          border: isChecked
                            ? `1px solid ${BLUE.border}`
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          color: '#f9fafb',
                          textAlign: 'left',
                          opacity: isAdmin ? 1 : 0.5,
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: isChecked
                              ? BLUE.subtle
                              : 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${
                              isChecked
                                ? BLUE.border
                                : 'rgba(255, 255, 255, 0.08)'
                            }`,
                            display: 'grid',
                            placeItems: 'center',
                            color: isChecked ? BLUE.light : '#9ca3af',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {initials}
                        </div>

                        {/* Name & Role */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {name}
                            </span>
                            {m.role === 'admin' && (
                              <IonIcon
                                icon={shieldCheckmarkOutline}
                                style={{ color: BLUE.light, fontSize: 13 }}
                              />
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              textTransform: 'capitalize',
                            }}
                          >
                            {m.role}
                          </div>
                        </div>

                        {/* Checkbox */}
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: isChecked
                              ? BLUE.primary
                              : 'transparent',
                            border: `2px solid ${
                              isChecked
                                ? BLUE.primary
                                : 'rgba(255, 255, 255, 0.25)'
                            }`,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {isChecked && (
                            <IonIcon
                              icon={checkmarkCircle}
                              style={{ color: '#fff', fontSize: 14 }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={() => setShowCreateRoster(false)}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    borderRadius: 12,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e5e7eb',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitCreateRoster}
                  disabled={
                    !isAdmin ||
                    creatingRoster ||
                    !newRosterTitle.trim() ||
                    selectedUserIds.length === 0 ||
                    !selectionHasAdmin
                  }
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    borderRadius: 12,
                    background: BLUE.primary,
                    border: 'none',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    opacity:
                      !isAdmin ||
                      creatingRoster ||
                      !newRosterTitle.trim() ||
                      selectedUserIds.length === 0 ||
                      !selectionHasAdmin
                        ? 0.5
                        : 1,
                    boxShadow: `0 4px 12px ${BLUE.glow}`,
                  }}
                >
                  {creatingRoster ? (
                    <IonSpinner
                      style={{ '--color': '#fff', width: 20, height: 20 }}
                    />
                  ) : (
                    'Create Roster'
                  )}
                </button>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* ─────────────────────────────────────────────────────────────
            MEMBER DETAIL SHEET
        ───────────────────────────────────────────────────────────── */}
        <IonModal
          isOpen={showMemberSheet}
          onDidDismiss={() => {
            setShowMemberSheet(false);
            setActiveMember(null);
          }}
          initialBreakpoint={0.55}
          breakpoints={[0, 0.55, 0.85]}
        >
          <IonContent
            fullscreen
            style={{
              '--background':
                'linear-gradient(180deg, #0c0a14 0%, #08080e 100%)',
            }}
          >
            {activeMember ? (
              <div style={{ padding: 20 }}>
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: BLUE.subtle,
                      border: `1px solid ${BLUE.border}`,
                      display: 'grid',
                      placeItems: 'center',
                      color: BLUE.light,
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(activeMember)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: '#f9fafb',
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        {getDisplayName(activeMember)}
                      </span>
                      {activeMember.role === 'admin' && (
                        <IonIcon
                          icon={shieldCheckmarkOutline}
                          style={{ color: BLUE.light, fontSize: 16 }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: 13,
                        textTransform: 'capitalize',
                      }}
                    >
                      {activeMember.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowMemberSheet(false);
                      setActiveMember(null);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#9ca3af',
                    }}
                  >
                    <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
                  </button>
                </div>

                {/* Contact Cards */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {/* Email */}
                  {activeMember.contact_email && (
                    <div
                      style={{
                        ...glassCard,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <IonIcon
                          icon={mailOutline}
                          style={{ color: BLUE.light, fontSize: 18 }}
                        />
                        <span
                          style={{
                            color: '#9ca3af',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Email
                        </span>
                      </div>
                      <div
                        style={{
                          color: '#f9fafb',
                          fontSize: 15,
                          fontWeight: 500,
                          marginBottom: 12,
                        }}
                      >
                        {activeMember.contact_email}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() =>
                            copyText(activeMember.contact_email!, 'email')
                          }
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#e5e7eb',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <IonIcon
                            icon={
                              copiedField === 'email'
                                ? checkmarkCircle
                                : copyOutline
                            }
                            style={{ fontSize: 16 }}
                          />
                          {copiedField === 'email' ? 'Copied!' : 'Copy'}
                        </button>
                        <a
                          href={`mailto:${activeMember.contact_email}`}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: BLUE.primary,
                            border: 'none',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <IonIcon
                            icon={mailOutline}
                            style={{ fontSize: 16 }}
                          />
                          Email
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {activeMember.phone && (
                    <div
                      style={{
                        ...glassCard,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <IonIcon
                          icon={callOutline}
                          style={{ color: '#22c55e', fontSize: 18 }}
                        />
                        <span
                          style={{
                            color: '#9ca3af',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Phone
                        </span>
                      </div>
                      <div
                        style={{
                          color: '#f9fafb',
                          fontSize: 15,
                          fontWeight: 500,
                          marginBottom: 12,
                        }}
                      >
                        {activeMember.phone}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => copyText(activeMember.phone!, 'phone')}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#e5e7eb',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <IonIcon
                            icon={
                              copiedField === 'phone'
                                ? checkmarkCircle
                                : copyOutline
                            }
                            style={{ fontSize: 16 }}
                          />
                          {copiedField === 'phone' ? 'Copied!' : 'Copy'}
                        </button>
                        <a
                          href={`tel:${activeMember.phone}`}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: '#22c55e',
                            border: 'none',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <IonIcon
                            icon={callOutline}
                            style={{ fontSize: 16 }}
                          />
                          Call
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Instagram */}
                  {activeMember.instagram && (
                    <div
                      style={{
                        ...glassCard,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <IonIcon
                          icon={logoInstagram}
                          style={{ color: '#ec4899', fontSize: 18 }}
                        />
                        <span
                          style={{
                            color: '#9ca3af',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Instagram
                        </span>
                      </div>
                      <div
                        style={{
                          color: '#f9fafb',
                          fontSize: 15,
                          fontWeight: 500,
                          marginBottom: 12,
                        }}
                      >
                        {activeMember.instagram}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() =>
                            copyText(activeMember.instagram!, 'instagram')
                          }
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#e5e7eb',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <IonIcon
                            icon={
                              copiedField === 'instagram'
                                ? checkmarkCircle
                                : copyOutline
                            }
                            style={{ fontSize: 16 }}
                          />
                          {copiedField === 'instagram' ? 'Copied!' : 'Copy'}
                        </button>
                        <a
                          href={instagramUrl(activeMember.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: '#ec4899',
                            border: 'none',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <IonIcon
                            icon={logoInstagram}
                            style={{ fontSize: 16 }}
                          />
                          Open
                        </a>
                      </div>
                    </div>
                  )}

                  {/* No Contact Info */}
                  {!activeMember.contact_email &&
                    !activeMember.phone &&
                    !activeMember.instagram && (
                      <div
                        style={{
                          ...glassCard,
                          padding: 24,
                          textAlign: 'center',
                        }}
                      >
                        <IonIcon
                          icon={personOutline}
                          style={{
                            fontSize: 32,
                            color: '#4b5563',
                            marginBottom: 10,
                          }}
                        />
                        <div style={{ color: '#6b7280', fontSize: 14 }}>
                          No contact info saved yet
                        </div>
                        <div
                          style={{
                            color: '#4b5563',
                            fontSize: 13,
                            marginTop: 4,
                          }}
                        >
                          This member can add contact details in their profile
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '100%',
                }}
              >
                <IonSpinner style={{ '--color': BLUE.primary }} />
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
