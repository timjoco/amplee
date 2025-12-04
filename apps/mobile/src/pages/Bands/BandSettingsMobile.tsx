/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  musicalNotesOutline,
  peopleOutline,
  personOutline,
  shieldOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandAvatarCardMobile from '../../components/Bands/Settings/BandAvatarCardMobile';
import BandBasicsCardMobile from '../../components/Bands/Settings/BandBasicsCardMobile';
import AvatarImageMobile from '../../components/ui/AvatarImageMobile';
import { supabase } from '../../lib/supabase';

type MembershipRole = 'admin' | 'member';

type MemberRow = {
  user_id: string;
  name: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
  role: MembershipRole | string | null;
};

function MyBandRoleEditor({
  bandId,
  currentUserId,
}: {
  bandId: string;
  currentUserId: string | null;
}) {
  const [bandRoles, setBandRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId || !bandId) return;

    let active = true;

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('band_members')
          .select('band_role')
          .eq('band_id', bandId)
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (!active) return;

        if (fetchError) throw fetchError;

        // Parse comma-separated roles
        const rolesString = data?.band_role || '';
        const roles = rolesString
          ? rolesString
              .split(',')
              .map((r: string) => r.trim())
              .filter(Boolean)
          : [];

        setBandRoles(roles);
      } catch (err: any) {
        console.error('Failed to load band role:', err);
      }
    })();

    return () => {
      active = false;
    };
  }, [bandId, currentUserId]);

  const saveRoles = async (roles: string[]) => {
    if (!currentUserId) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      // Join roles with comma
      const rolesString = roles.join(', ');

      const { error: updateError } = await supabase
        .from('band_members')
        .update({ band_role: rolesString || null })
        .eq('band_id', bandId)
        .eq('user_id', currentUserId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } catch (err: any) {
      console.error('Failed to save band role:', err);
      setError(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    const trimmed = newRole.trim();
    if (!trimmed) return;
    if (bandRoles.includes(trimmed)) {
      setError('Role already added');
      return;
    }
    if (bandRoles.length >= 5) {
      setError('Maximum 5 roles allowed');
      return;
    }

    const updatedRoles = [...bandRoles, trimmed];
    setBandRoles(updatedRoles);
    setNewRole('');
    if (error) setError(null);

    // Auto-save
    await saveRoles(updatedRoles);
  };

  const handleRemoveRole = async (roleToRemove: string) => {
    const updatedRoles = bandRoles.filter((r) => r !== roleToRemove);
    setBandRoles(updatedRoles);

    // Auto-save
    await saveRoles(updatedRoles);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRole();
    }
  };

  return (
    <div>
      {/* Current roles */}
      {bandRoles.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {bandRoles.map((role) => (
            <div
              key={role}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: '#e5e7eb',
                  fontWeight: 500,
                }}
              >
                {role}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveRole(role)}
                disabled={saving}
                style={{
                  background: 'none',
                  border: 'none',
                  color: saving ? '#9ca3af' : '#f87171',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  padding: 0,
                  fontSize: 16,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new role */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          maxLength={30}
          placeholder="e.g., Lead Guitar, Drums, Vocals..."
          value={newRole}
          onChange={(e) => {
            setNewRole(e.target.value);
            if (error) setError(null);
          }}
          onKeyPress={handleKeyPress}
          disabled={bandRoles.length >= 5 || saving}
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: 14,
            color: '#e5e7eb',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            outline: 'none',
            fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1,
          }}
        />
        <button
          type="button"
          onClick={handleAddRole}
          disabled={!newRole.trim() || bandRoles.length >= 5 || saving}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'rgba(139, 92, 246, 0.2)',
            color: '#a78bfa',
            fontSize: 14,
            fontWeight: 600,
            cursor:
              !newRole.trim() || bandRoles.length >= 5 || saving
                ? 'not-allowed'
                : 'pointer',
            opacity:
              !newRole.trim() || bandRoles.length >= 5 || saving ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          {bandRoles.length} / 5 roles
        </span>

        {success && (
          <span
            style={{
              fontSize: 11,
              color: '#10b981',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ✓ Saved
          </span>
        )}
      </div>

      {error && (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 12,
            color: '#f87171',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default function BandSettingsMobile() {
  const params = useParams<{ bandId?: string; id?: string }>();
  const bandId = params.bandId ?? params.id ?? null;
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bandName, setBandName] = useState<string>('Band');
  const [bandAvatarPath, setBandAvatarPath] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<MembershipRole>('member');

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // delete and leave state
  const [busyDanger, setBusyDanger] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  const trimmedBandName = bandName.trim();

  useEffect(() => {
    if (!bandId) {
      nav('/home', { replace: true });
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: auth } = await supabase.auth.getUser();
        if (!active) return;
        const user = auth?.user;
        if (!user) {
          setError('You must be signed in.');
          return;
        }
        setCurrentUserId(user.id);

        // membership
        const { data: mem, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!active) return;

        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band.');
          return;
        }

        setMyRole((mem.role as MembershipRole) ?? 'member');

        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('id, name, avatar_url')
          .eq('id', bandId)
          .maybeSingle();

        if (!active) return;

        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found.');
          return;
        }

        setBandName(band.name);
        setBandAvatarPath(band.avatar_url ?? null);

        const { data: memRows, error: memRowsErr } = await supabase
          .from('band_members')
          .select(
            'user_id, role, profiles(display_name, avatar_url, updated_at)'
          )
          .eq('band_id', bandId)
          .order('created_at', { ascending: true });

        if (!active) return;

        if (memRowsErr) {
          setMembersError(memRowsErr.message);
          setMembers([]);
        } else {
          const rows: MemberRow[] =
            (memRows ?? []).map((r: any) => ({
              user_id: r.user_id,
              role: r.role,
              name: r.profiles?.display_name || 'Band member',
              avatar_path: r.profiles?.avatar_url || null,
              avatar_updated_at: r.profiles?.updated_at || null,
            })) ?? [];
          setMembers(rows);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Failed to load band settings.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [bandId, nav]);

  async function handleLeaveBand() {
    if (!bandId || !currentUserId) return;
    try {
      setBusyDanger(true);
      setError(null);

      const { error: delErr } = await supabase
        .from('band_members')
        .delete()
        .match({ band_id: bandId, user_id: currentUserId });

      if (delErr) throw delErr;

      nav('/home', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Failed to leave band.');
    } finally {
      setBusyDanger(false);
    }
  }

  async function handleDeleteBand() {
    if (!bandId || myRole !== 'admin' || busyDanger) return;

    const expected = trimmedBandName;
    const typed = deleteConfirmText.trim();

    if (!expected || typed !== expected) {
      setDeleteError('Band name does not match. Check the spelling.');
      return;
    }

    try {
      setBusyDanger(true);
      setDeleteError(null);

      const { error: delErr } = await supabase
        .from('bands')
        .delete()
        .eq('id', bandId);

      if (delErr) {
        setDeleteError('Failed to delete band. Please try again.');
        return;
      }

      setShowDeleteAlert(false);
      setShowDeleteToast(true);
    } catch (e: any) {
      setDeleteError(e?.message || 'Failed to delete band.');
    } finally {
      setBusyDanger(false);
    }
  }

  async function promoteToAdmin(userId: string) {
    if (myRole !== 'admin') return;
    try {
      setMemberBusyId(userId);
      setMembersError(null);

      const { error } = await supabase
        .from('band_members')
        .update({ role: 'admin' })
        .match({ band_id: bandId, user_id: userId });

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: 'admin' } : m))
      );
    } catch (e: any) {
      setMembersError(e?.message || 'Failed to promote member.');
    } finally {
      setMemberBusyId(null);
    }
  }

  async function demoteToMember(userId: string) {
    if (myRole !== 'admin') return;
    if (userId === currentUserId) {
      setMembersError("You can't demote yourself.");
      return;
    }
    try {
      setMemberBusyId(userId);
      setMembersError(null);

      const { error } = await supabase
        .from('band_members')
        .update({ role: 'member' })
        .match({ band_id: bandId, user_id: userId });

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: 'member' } : m))
      );
    } catch (e: any) {
      setMembersError(e?.message || 'Failed to demote member.');
    } finally {
      setMemberBusyId(null);
    }
  }

  if (!bandId) {
    return null;
  }

  const isAdmin = myRole === 'admin';

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              onClick={() => nav(-1)}
              style={{ minWidth: 0, paddingInline: 4 }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 22 }}
              />
            </IonButton>
          </IonButtons>

          <div
            style={{
              paddingInline: 12,
              paddingBlock: 8,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: '#F9FAFB',
                letterSpacing: '-0.5px',
              }}
            >
              Band settings
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              Manage band profile and members
            </p>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '40px 16px',
            }}
          >
            <IonSpinner
              name="dots"
              style={{ '--color': 'rgba(168, 85, 247, 0.8)' } as any}
            />
            <IonText
              style={{ color: 'rgba(156, 163, 175, 0.9)', fontSize: 14 }}
            >
              Loading settings…
            </IonText>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              padding: '16px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                background: 'transparent',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                borderRadius: 20,
                padding: '32px 24px',
                textAlign: 'center',
                marginTop: 24,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'rgba(248, 113, 113, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                }}
              >
                <IonIcon
                  icon={warningOutline}
                  style={{ fontSize: 32, color: 'rgba(248, 113, 113, 0.9)' }}
                />
              </div>
              <IonText color="light">
                <h2
                  style={{
                    margin: '0 0 8px',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'rgba(241, 245, 249, 0.95)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Something went wrong
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: 'rgba(248, 113, 113, 0.9)',
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </p>
              </IonText>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div
            style={{
              padding: 16,
              paddingBottom: 24,
              color: '#E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Band Header Card */}
            <div
              style={{
                background: 'transparent',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: 20,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <AvatarImageMobile
                name={bandName}
                bucket="band-avatars"
                avatarPath={bandAvatarPath || undefined}
                updatedAt={undefined}
                size={48}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'rgba(168, 85, 247, 0.8)',
                    fontWeight: 700,
                  }}
                >
                  Band
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'rgba(241, 245, 249, 0.95)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {bandName}
                </p>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: isAdmin
                    ? 'rgba(251, 191, 36, 0.1)'
                    : 'rgba(148, 163, 184, 0.1)',
                  border: isAdmin
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isAdmin
                      ? 'rgba(251, 191, 36, 0.95)'
                      : 'rgba(148, 163, 184, 0.9)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 20,
                padding: '24px 20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{
                      fontSize: 20,
                      color: 'rgba(139, 92, 246, 0.9)',
                    }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'rgba(241, 245, 249, 0.95)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    My Role in Band
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 13,
                      color: 'rgba(148, 163, 184, 0.8)',
                    }}
                  >
                    Let bandmates know your instrument or position
                  </p>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(139, 92, 246, 0.15)',
                  paddingTop: 16,
                }}
              >
                <MyBandRoleEditor
                  bandId={bandId}
                  currentUserId={currentUserId}
                />
              </div>
            </div>

            {isAdmin ? (
              <>
                {/* Band Profile Card */}
                <div
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: 20,
                    padding: '24px 20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IonIcon
                        icon={personOutline}
                        style={{
                          fontSize: 20,
                          color: 'rgba(168, 85, 247, 0.9)',
                        }}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'rgba(241, 245, 249, 0.95)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        Band Profile
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 13,
                          color: 'rgba(148, 163, 184, 0.8)',
                        }}
                      >
                        Update the band name and avatar
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      borderTop: '1px solid rgba(168, 85, 247, 0.15)',
                      paddingTop: 16,
                    }}
                  >
                    <BandBasicsCardMobile
                      bandId={bandId}
                      initialName={bandName}
                    />
                    <BandAvatarCardMobile
                      bandId={bandId}
                      bandName={bandName}
                      initialPath={bandAvatarPath || undefined}
                    />
                  </div>
                </div>

                {/* Manage Roles Card */}
                <div
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: 20,
                    padding: '24px 20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(148, 163, 184, 0.1)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IonIcon
                        icon={peopleOutline}
                        style={{
                          fontSize: 20,
                          color: 'rgba(148, 163, 184, 0.9)',
                        }}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'rgba(241, 245, 249, 0.95)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        Manage Roles
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 13,
                          color: 'rgba(148, 163, 184, 0.8)',
                        }}
                      >
                        Promote or demote band members
                      </p>
                    </div>
                  </div>

                  {membersError && (
                    <div
                      style={{
                        marginBottom: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(248, 113, 113, 0.1)',
                        border: '1px solid rgba(248, 113, 113, 0.2)',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: 'rgba(248, 113, 113, 0.9)',
                        }}
                      >
                        {membersError}
                      </p>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                      paddingTop: 16,
                    }}
                  >
                    {members.map((m) => {
                      const isSelf = m.user_id === currentUserId;
                      const canPromote =
                        isAdmin && m.role !== 'admin' && !isSelf;
                      const canDemote =
                        isAdmin && m.role === 'admin' && !isSelf;
                      const isRowBusy = memberBusyId === m.user_id;

                      return (
                        <div
                          key={m.user_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                          }}
                        >
                          <AvatarImageMobile
                            name={m.name}
                            bucket="profile-avatars"
                            avatarPath={m.avatar_path ?? undefined}
                            updatedAt={m.avatar_updated_at ?? undefined}
                            size={36}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'rgba(241, 245, 249, 0.95)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {m.name}
                              {isSelf && (
                                <span
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 11,
                                    color: 'rgba(148, 163, 184, 0.7)',
                                    fontWeight: 500,
                                  }}
                                >
                                  (you)
                                </span>
                              )}
                            </p>
                            <p
                              style={{
                                margin: '2px 0 0',
                                fontSize: 12,
                                fontWeight: 600,
                                color:
                                  m.role === 'admin'
                                    ? 'rgba(251, 191, 36, 0.9)'
                                    : 'rgba(148, 163, 184, 0.7)',
                              }}
                            >
                              {m.role === 'admin' ? 'Admin' : 'Member'}
                            </p>
                          </div>

                          {(canPromote || canDemote) && (
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => {
                                if (canPromote) {
                                  promoteToAdmin(m.user_id);
                                } else if (canDemote) {
                                  demoteToMember(m.user_id);
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: canPromote
                                  ? '1px solid rgba(52, 211, 153, 0.3)'
                                  : '1px solid rgba(148, 163, 184, 0.3)',
                                background: canPromote
                                  ? 'rgba(52, 211, 153, 0.1)'
                                  : 'rgba(148, 163, 184, 0.1)',
                                fontSize: 11,
                                fontWeight: 600,
                                color: canPromote
                                  ? 'rgba(52, 211, 153, 0.95)'
                                  : 'rgba(148, 163, 184, 0.9)',
                                opacity: isRowBusy ? 0.6 : 1,
                                cursor: isRowBusy ? 'not-allowed' : 'pointer',
                                transition: 'all 150ms ease',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isRowBusy
                                ? 'Working…'
                                : canPromote
                                ? 'Promote'
                                : 'Demote'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Danger Zone (Admin) */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(127,29,29,0.15) 0%, rgba(80,20,20,0.1) 100%)',
                    border: '1px solid rgba(248, 113, 113, 0.25)',
                    borderRadius: 20,
                    padding: 20,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <IonIcon
                      icon={warningOutline}
                      style={{ fontSize: 20, color: '#fca5a5' }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#fca5a5',
                      }}
                    >
                      Danger Zone
                    </p>
                  </div>
                  <p
                    style={{
                      margin: '0 0 20px',
                      fontSize: 13,
                      color: '#9ca3af',
                      lineHeight: 1.5,
                    }}
                  >
                    Delete this band for everyone. This action cannot be undone.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setShowDeleteAlert(true);
                    }}
                    disabled={busyDanger}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1px solid rgba(248, 113, 113, 0.4)',
                      background:
                        'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.15) 100%)',
                      color: '#fca5a5',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: busyDanger ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      opacity: busyDanger ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
                    Delete band
                  </button>
                </div>
              </>
            ) : (
              /* Member View - Leave Band Card */
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(127,29,29,0.15) 0%, rgba(80,20,20,0.1) 100%)',
                  border: '1px solid rgba(248, 113, 113, 0.25)',
                  borderRadius: 20,
                  padding: 20,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <IonIcon
                    icon={shieldOutline}
                    style={{ fontSize: 20, color: '#fca5a5' }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: '#fca5a5',
                    }}
                  >
                    Leave Band
                  </p>
                </div>
                <p
                  style={{
                    margin: '0 0 20px',
                    fontSize: 13,
                    color: '#9ca3af',
                    lineHeight: 1.5,
                  }}
                >
                  You'll lose access to this band's events, setlists, and
                  proposals. You can rejoin if invited again.
                </p>

                <button
                  type="button"
                  onClick={() => setShowLeaveAlert(true)}
                  disabled={busyDanger}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    background:
                      'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.15) 100%)',
                    color: '#fca5a5',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: busyDanger ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    opacity: busyDanger ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {busyDanger ? 'Leaving…' : 'Leave band'}
                </button>
              </div>
            )}
          </div>
        )}
      </IonContent>

      {/* Leave band alert */}
      <IonAlert
        isOpen={showLeaveAlert}
        onDidDismiss={() => setShowLeaveAlert(false)}
        header="Leave band?"
        message={`You'll be removed from ${bandName} and lose access to its events and setlists.`}
        style={
          {
            '--background': '#050509',
            '--color': '#E5E7EB',
            '--backdrop-opacity': '0.9',
            '--button-color': '#E5E7EB',
            '--border-radius': '18px',
          } as any
        }
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setShowLeaveAlert(false),
          },
          {
            text: 'Leave',
            role: 'destructive',
            handler: () => {
              setShowLeaveAlert(false);
              void handleLeaveBand();
            },
          },
        ]}
      />

      {/* Custom Delete Confirmation Modal */}
      {showDeleteAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => {
              setShowDeleteAlert(false);
              setDeleteConfirmText('');
              setDeleteError(null);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 360,
              background:
                'linear-gradient(145deg, rgba(20,15,25,0.98) 0%, rgba(12,8,18,0.98) 100%)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: 24,
              padding: 24,
              boxShadow:
                '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(248,113,113,0.1)',
            }}
          >
            {/* Warning Icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.1) 100%)',
                border: '1px solid rgba(248,113,113,0.3)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <IonIcon
                icon={trashOutline}
                style={{ fontSize: 26, color: '#f87171' }}
              />
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#f9fafb',
                textAlign: 'center',
                letterSpacing: '-0.3px',
              }}
            >
              Delete this band?
            </h2>

            <p
              style={{
                margin: '12px 0 20px',
                fontSize: 14,
                color: '#9ca3af',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              This will permanently delete the band for all members including
              events, setlists, and proposals. Type{' '}
              <span style={{ color: '#f87171', fontWeight: 600 }}>
                {trimmedBandName}
              </span>{' '}
              to confirm.
            </p>

            {/* Confirm Input */}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => {
                setDeleteConfirmText(e.target.value);
                if (deleteError) setDeleteError(null);
              }}
              placeholder={trimmedBandName}
              autoFocus
              style={{
                width: '100%',
                borderRadius: 12,
                border: deleteError
                  ? '1px solid rgba(248,113,113,0.6)'
                  : '1px solid rgba(148,163,184,0.25)',
                padding: '12px 14px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                color: '#e5e7eb',
                fontSize: 15,
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(248,113,113,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(248,113,113,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = deleteError
                  ? 'rgba(248,113,113,0.6)'
                  : 'rgba(148,163,184,0.25)';
                e.target.style.boxShadow = 'none';
              }}
            />

            {/* Error Message */}
            {deleteError && (
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 13,
                  color: '#f87171',
                  textAlign: 'center',
                }}
              >
                {deleteError}
              </p>
            )}

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAlert(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={busyDanger}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteBand}
                disabled={busyDanger || !deleteConfirmText.trim()}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(220,38,38,0.5)',
                  background:
                    'linear-gradient(135deg, rgba(220,38,38,0.9) 0%, rgba(185,28,28,0.9) 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor:
                    busyDanger || !deleteConfirmText.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                  opacity: busyDanger || !deleteConfirmText.trim() ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {busyDanger ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{ width: 16, height: 16 }}
                    />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success delete toast */}
      <IonToast
        isOpen={showDeleteToast}
        message="Band successfully deleted."
        duration={1800}
        onDidDismiss={() => {
          setShowDeleteToast(false);
          nav('/home', { replace: true });
        }}
        cssClass="amplee-toast-success"
      />
    </IonPage>
  );
}
