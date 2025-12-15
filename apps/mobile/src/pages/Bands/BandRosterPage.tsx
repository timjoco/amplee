/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, informationCircleOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type AvailabilityStatus = 'open' | 'limited' | 'unavailable';

type RosterMember = {
  id: string; // band_members row id
  user_id: string; // auth user id
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

export default function BandRosterPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bandName, setBandName] = useState('');
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [rosters, setRosters] = useState<BandRoster[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [expandedRosterId, setExpandedRosterId] = useState<string | null>(null);
  const [rosterMembersByRosterId, setRosterMembersByRosterId] = useState<
    Record<string, RosterMemberLite[] | undefined>
  >({});

  const [showCreateRoster, setShowCreateRoster] = useState(false);
  const [creatingRoster, setCreatingRoster] = useState(false);
  const [newRosterTitle, setNewRosterTitle] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const [activeMember, setActiveMember] = useState<RosterMember | null>(null);

  const getDisplayName = (m: {
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  }) => {
    const full = [m.first_name, m.last_name].filter(Boolean).join(' ');
    return m.display_name || full || 'Unknown';
  };

  const selectedPreview = useMemo(() => {
    const byId = new Map(members.map((m) => [m.user_id, m]));
    return selectedUserIds
      .map((id) => byId.get(id))
      .filter(Boolean) as RosterMember[];
  }, [members, selectedUserIds]);

  // ✅ Current user + admin gate (derived from loaded members)
  const [myUserId, setMyUserId] = useState<string | null>(null);

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

  const toggleSelected = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

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
              id: m.id,
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
          .select('id,created_at,created_by')
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

  const openMemberSheet = (m: RosterMember) => {
    setActiveMember(m);
    setShowMemberSheet(true);
  };

  const copyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
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

  const beginCreateRoster = () => {
    setError(null);

    if (!isAdmin) {
      setError('Only band admins can create rosters.');
      return;
    }

    setNewRosterTitle('');

    // ✅ Default selection includes all admins (prevents “no admin roster”)
    // If you prefer “at least one admin” rather than all, you can just include your own admin id.
    const defaultIds = Array.from(new Set([...adminUserIds]));
    setSelectedUserIds(defaultIds);

    setShowCreateRoster(true);
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

    // ✅ Hard rule: roster must include an admin
    if (!selectionHasAdmin) {
      setError('Roster must include at least one admin.');
      return;
    }

    setError(null);
    setCreatingRoster(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('Please sign in.');

      const { data: roster, error: rErr } = await supabase
        .from('band_rosters')
        .insert({
          band_id: bandId,
          title,
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

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => navigate(`/bands/${bandId}`)}
              fill="clear"
              style={{ minWidth: 0, padding: 6, margin: 0, flexShrink: 0 }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.15,
                }}
              >
                Rosters
              </h1>
              {bandName && (
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                  {bandName}
                </div>
              )}
              {myUserId && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {isAdmin ? 'Admin access' : 'Member access'}
                </div>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{ display: 'grid', placeItems: 'center', height: '100%' }}
          >
            <IonSpinner style={{ '--color': '#38bdf8' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 16,
                padding: '16px',
                color: '#fca5a5',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '16px',
              maxWidth: '600px',
              margin: '0 auto',
              paddingBottom: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '14px 16px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <IonIcon
                icon={informationCircleOutline}
                style={{
                  color: '#60a5fa',
                  fontSize: 18,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: '#b5bac1',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Tap a member to view their contact info. Rosters are admin-only.
              </p>
            </div>

            {/* ✅ ADMIN-ONLY create */}
            {isAdmin ? (
              <IonButton
                expand="block"
                onClick={beginCreateRoster}
                style={{
                  marginBottom: 16,
                  '--background': 'rgba(147, 51, 234, 0.92)',
                  '--border-radius': '14px',
                }}
              >
                Create Roster
              </IonButton>
            ) : (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#9ca3af',
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                Only band admins can create or delete rosters.
              </div>
            )}

            {/* Saved Rosters */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
                Saved Rosters
              </div>

              {rosters.length === 0 ? (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: 14,
                    color: '#9ca3af',
                    fontSize: 13,
                  }}
                >
                  No rosters yet.
                </div>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {rosters.map((r) => {
                    const isOpen = expandedRosterId === r.id;
                    const rosterMembers = rosterMembersByRosterId[r.id];

                    return (
                      <div
                        key={r.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 16,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: 14,
                          }}
                        >
                          <button
                            onClick={async () => {
                              try {
                                if (isOpen) {
                                  setExpandedRosterId(null);
                                  return;
                                }
                                setExpandedRosterId(r.id);
                                await loadRosterMembers(r.id);
                              } catch (e: any) {
                                setError(
                                  String(
                                    e?.message ??
                                      'Failed to load roster members'
                                  )
                                );
                              }
                            }}
                            style={{
                              flex: 1,
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              color: '#f9fafb',
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 15 }}>
                              {r.title}
                            </div>
                            <div
                              style={{
                                color: '#9ca3af',
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              {isOpen ? 'Tap to hide' : 'Tap to view members'}
                            </div>
                          </button>

                          {/* ✅ ADMIN-ONLY delete */}
                          {isAdmin && (
                            <IonButton
                              fill="clear"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteRoster(r.id);
                              }}
                              style={{ margin: 0, minWidth: 0 }}
                            >
                              <span
                                style={{
                                  color: '#ef4444',
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              >
                                Delete
                              </span>
                            </IonButton>
                          )}
                        </div>

                        {isOpen && (
                          <div
                            style={{
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                              padding: 12,
                              background: 'rgba(255,255,255,0.02)',
                            }}
                          >
                            {!rosterMembers ? (
                              <IonSpinner style={{ '--color': '#38bdf8' }} />
                            ) : rosterMembers.length === 0 ? (
                              <div style={{ color: '#9ca3af', fontSize: 13 }}>
                                No members in this roster.
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                }}
                              >
                                {rosterMembers.map((m) => {
                                  const name = getDisplayName(m);
                                  return (
                                    <div
                                      key={m.user_id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: 10,
                                        borderRadius: 12,
                                        background: 'rgba(255,255,255,0.03)',
                                        border:
                                          '1px solid rgba(255,255,255,0.05)',
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 34,
                                          height: 34,
                                          borderRadius: 10,
                                          background: 'rgba(255,255,255,0.08)',
                                          display: 'grid',
                                          placeItems: 'center',
                                          color: '#9ca3af',
                                          fontWeight: 800,
                                        }}
                                      >
                                        {name[0].toUpperCase()}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            color: '#f9fafb',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {name}
                                        </div>
                                        <div
                                          style={{
                                            color: '#9ca3af',
                                            fontSize: 12,
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Band Member Directory */}
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
              Band Members
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {members.map((member) => {
                const fullName = [member.first_name, member.last_name]
                  .filter(Boolean)
                  .join(' ');
                const displayName =
                  member.display_name || fullName || 'Unknown';
                const initial = (member.display_name ||
                  member.first_name ||
                  '?')[0].toUpperCase();

                return (
                  <button
                    key={member.id}
                    onClick={() => openMemberSheet(member)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16,
                      padding: '16px',
                      textAlign: 'left',
                      color: 'inherit',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          fontWeight: 800,
                          color: '#9ca3af',
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: '#f9fafb',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {displayName}
                        </div>

                        {member.display_name &&
                          fullName &&
                          member.display_name !== fullName && (
                            <div
                              style={{
                                fontSize: 11,
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
                            color: '#9ca3af',
                            textTransform: 'capitalize',
                          }}
                        >
                          {member.role}
                        </div>
                      </div>

                      <div style={{ color: '#9ca3af', fontSize: 12 }}>View</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create Roster Modal */}
            <IonModal
              isOpen={showCreateRoster}
              onDidDismiss={() => setShowCreateRoster(false)}
            >
              <IonHeader translucent>
                <IonToolbar style={{ '--background': 'rgba(8,8,12,0.98)' }}>
                  <div
                    style={{
                      padding: 16,
                      color: '#f9fafb',
                      fontWeight: 900,
                      fontSize: 18,
                    }}
                  >
                    New Roster
                  </div>
                </IonToolbar>
              </IonHeader>

              <IonContent
                fullscreen
                style={{
                  '--background':
                    'linear-gradient(180deg, #050509 0%, #020109 100%)',
                }}
              >
                <div
                  style={{
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {!isAdmin && (
                    <div
                      style={{
                        background: 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 14,
                        padding: 12,
                        color: '#fca5a5',
                        fontSize: 13,
                      }}
                    >
                      Only admins can create rosters.
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        color: '#9ca3af',
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      Roster title
                    </div>
                    <input
                      value={newRosterTitle}
                      onChange={(e) => setNewRosterTitle(e.target.value)}
                      placeholder="e.g. Weekend Lineup"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 14,
                        padding: '12px 14px',
                        color: '#f9fafb',
                        outline: 'none',
                      }}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
                    Select members ({selectedUserIds.length})
                  </div>

                  {!selectionHasAdmin && (
                    <div
                      style={{
                        background: 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        borderRadius: 14,
                        padding: 12,
                        color: '#fde68a',
                        fontSize: 13,
                      }}
                    >
                      This roster must include at least one admin.
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {members.map((m) => {
                      const name = getDisplayName(m);
                      const checked = selectedUserIds.includes(m.user_id);

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
                            borderRadius: 14,
                            background: checked
                              ? 'rgba(236, 72, 153, 0.12)'
                              : 'rgba(255,255,255,0.03)',
                            border: checked
                              ? '1px solid rgba(236, 72, 153, 0.35)'
                              : '1px solid rgba(255,255,255,0.06)',
                            color: '#f9fafb',
                            textAlign: 'left',
                            opacity: isAdmin ? 1 : 0.6,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 12,
                              background: 'rgba(255,255,255,0.08)',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#9ca3af',
                              fontWeight: 900,
                            }}
                          >
                            {name[0].toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 900,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {name}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#9ca3af',
                                textTransform: 'capitalize',
                              }}
                            >
                              {m.role}
                            </div>
                          </div>

                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 6,
                              border: '1px solid rgba(255,255,255,0.25)',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            {checked && (
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 4,
                                  background: '#ec4899',
                                }}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <IonButton
                      expand="block"
                      onClick={() => setShowCreateRoster(false)}
                      fill="outline"
                      style={{
                        flex: 1,
                        '--border-color': 'rgba(255,255,255,0.25)',
                        color: '#e5e7eb',
                      }}
                    >
                      Cancel
                    </IonButton>

                    <IonButton
                      expand="block"
                      disabled={
                        !isAdmin ||
                        creatingRoster ||
                        !newRosterTitle.trim() ||
                        selectedUserIds.length === 0 ||
                        !selectionHasAdmin
                      }
                      onClick={submitCreateRoster}
                      style={{
                        flex: 1,
                        '--background': 'rgba(147, 51, 234, 0.95)',
                        '--border-radius': '14px',
                      }}
                    >
                      {creatingRoster ? (
                        <IonSpinner style={{ '--color': '#fff' }} />
                      ) : (
                        'Create'
                      )}
                    </IonButton>
                  </div>
                </div>
              </IonContent>
            </IonModal>

            {/* Member Sheet (unchanged from your version) */}
            <IonModal
              isOpen={showMemberSheet}
              onDidDismiss={() => {
                setShowMemberSheet(false);
                setActiveMember(null);
              }}
              initialBreakpoint={0.65}
              breakpoints={[0, 0.45, 0.65, 0.9]}
            >
              <IonHeader translucent>
                <IonToolbar style={{ '--background': 'rgba(8,8,12,0.98)' }}>
                  <div
                    style={{
                      padding: 16,
                      color: '#f9fafb',
                      fontWeight: 900,
                      fontSize: 18,
                    }}
                  >
                    Member
                  </div>
                </IonToolbar>
              </IonHeader>

              <IonContent
                fullscreen
                style={{
                  '--background':
                    'linear-gradient(180deg, #050509 0%, #020109 100%)',
                }}
              >
                {activeMember ? (
                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 16,
                          background: 'rgba(255,255,255,0.08)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#9ca3af',
                          fontWeight: 900,
                          fontSize: 20,
                        }}
                      >
                        {getDisplayName(activeMember)[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: '#f9fafb',
                            fontWeight: 900,
                            fontSize: 18,
                          }}
                        >
                          {getDisplayName(activeMember)}
                        </div>
                        <div
                          style={{
                            color: '#9ca3af',
                            fontSize: 13,
                            textTransform: 'capitalize',
                          }}
                        >
                          {activeMember.role}
                        </div>
                      </div>
                      <IonButton
                        fill="clear"
                        onClick={() => {
                          setShowMemberSheet(false);
                          setActiveMember(null);
                        }}
                        style={{ margin: 0, minWidth: 0 }}
                      >
                        <span style={{ color: '#9ca3af', fontWeight: 800 }}>
                          Close
                        </span>
                      </IonButton>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {activeMember.contact_email ? (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            padding: 14,
                          }}
                        >
                          <div
                            style={{
                              color: '#9ca3af',
                              fontSize: 12,
                              marginBottom: 6,
                            }}
                          >
                            Email
                          </div>
                          <div
                            style={{
                              color: '#f9fafb',
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {activeMember.contact_email}
                          </div>
                          <div
                            style={{ display: 'flex', gap: 10, marginTop: 10 }}
                          >
                            <IonButton
                              expand="block"
                              onClick={() =>
                                copyText(activeMember.contact_email!)
                              }
                              style={{
                                flex: 1,
                                '--background': 'rgba(59,130,246,0.85)',
                                '--border-radius': '14px',
                              }}
                            >
                              Copy
                            </IonButton>
                            <IonButton
                              expand="block"
                              onClick={() =>
                                (window.location.href = `mailto:${activeMember.contact_email}`)
                              }
                              style={{
                                flex: 1,
                                '--background': 'rgba(34,197,94,0.85)',
                                '--border-radius': '14px',
                              }}
                            >
                              Email
                            </IonButton>
                          </div>
                        </div>
                      ) : null}

                      {activeMember.phone ? (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            padding: 14,
                          }}
                        >
                          <div
                            style={{
                              color: '#9ca3af',
                              fontSize: 12,
                              marginBottom: 6,
                            }}
                          >
                            Phone
                          </div>
                          <div
                            style={{
                              color: '#f9fafb',
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {activeMember.phone}
                          </div>
                          <div
                            style={{ display: 'flex', gap: 10, marginTop: 10 }}
                          >
                            <IonButton
                              expand="block"
                              onClick={() => copyText(activeMember.phone!)}
                              style={{
                                flex: 1,
                                '--background': 'rgba(59,130,246,0.85)',
                                '--border-radius': '14px',
                              }}
                            >
                              Copy
                            </IonButton>
                            <IonButton
                              expand="block"
                              onClick={() =>
                                (window.location.href = `tel:${activeMember.phone}`)
                              }
                              style={{
                                flex: 1,
                                '--background': 'rgba(34,197,94,0.85)',
                                '--border-radius': '14px',
                              }}
                            >
                              Call
                            </IonButton>
                          </div>
                        </div>
                      ) : null}

                      {activeMember.instagram ? (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            padding: 14,
                          }}
                        >
                          <div
                            style={{
                              color: '#9ca3af',
                              fontSize: 12,
                              marginBottom: 6,
                            }}
                          >
                            Instagram
                          </div>
                          <div
                            style={{
                              color: '#f9fafb',
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {activeMember.instagram}
                          </div>

                          <div
                            style={{ display: 'flex', gap: 10, marginTop: 10 }}
                          >
                            <IonButton
                              expand="block"
                              onClick={() => copyText(activeMember.instagram!)}
                              style={{
                                flex: 1,
                                '--background': 'rgba(59,130,246,0.85)',
                                '--border-radius': '14px',
                              }}
                            >
                              Copy
                            </IonButton>
                            <IonButton
                              expand="block"
                              onClick={() =>
                                window.open(
                                  instagramUrl(activeMember.instagram!),
                                  '_blank'
                                )
                              }
                              style={{
                                flex: 1,
                                '--background': 'rgba(236,72,153,0.85)',
                                '--border-radius': '14px',
                              }}
                            >
                              Open
                            </IonButton>
                          </div>
                        </div>
                      ) : null}

                      {!activeMember.contact_email &&
                      !activeMember.phone &&
                      !activeMember.instagram ? (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            padding: 14,
                            color: '#9ca3af',
                            fontSize: 13,
                          }}
                        >
                          No contact info saved for this member yet.
                        </div>
                      ) : null}
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
                    <IonSpinner style={{ '--color': '#38bdf8' }} />
                  </div>
                )}
              </IonContent>
            </IonModal>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
