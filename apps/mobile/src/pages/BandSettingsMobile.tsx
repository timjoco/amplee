/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, warningOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandAvatarCardMobile from '../components/Bands/Settings/BandAvatarCardMobile';
import BandBasicsCardMobile from '../components/Bands/Settings/BandBasicsCardMobile';
import AvatarImageMobile from '../components/ui/AvatarImageMobile';
import { supabase } from '../lib/supabase';

type MembershipRole = 'admin' | 'member';

type MemberRow = {
  user_id: string;
  name: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
  role: MembershipRole | string | null;
};

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

  const [busyDanger, setBusyDanger] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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

        // band
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

        // members for admin management
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
    if (!bandId) return;
    try {
      setBusyDanger(true);
      setError(null);

      const { error: delErr } = await supabase
        .from('bands')
        .delete()
        .eq('id', bandId);

      if (delErr) throw delErr;

      nav('/home', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Failed to delete band.');
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
          <button
            type="button"
            onClick={() => nav(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={chevronBackOutline}
              style={{ fontSize: 20, color: '#8049afff', marginRight: 4 }}
            />
            <IonTitle style={{ color: '#e8e4ecff' }}>Band settings</IonTitle>
          </button>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {loading ? (
          <div
            style={{
              padding: 24,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <IonText color="light">
              <p>Loading…</p>
            </IonText>
          </div>
        ) : error ? (
          <div style={{ padding: 16 }}>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        ) : (
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
            {isAdmin ? (
              <>
                {/* Band profile */}
                <div
                  style={{
                    borderRadius: 18,
                    background:
                      'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                    border: '1px solid rgba(88,28,135,0.7)',
                    padding: 14,
                    boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 0.04,
                        textTransform: 'uppercase',
                        color: 'rgba(237,233,254,0.96)',
                      }}
                    >
                      Band profile
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12,
                        color: 'rgba(196,181,253,0.9)',
                      }}
                    >
                      Change the band name and avatar.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(148,163,184,0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
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

                {/* Manage roles */}
                <div
                  style={{
                    borderRadius: 18,
                    background:
                      'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                    border: '1px solid rgba(88,28,135,0.7)',
                    padding: 14,
                    boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 0.04,
                        textTransform: 'uppercase',
                        color: 'rgba(237,233,254,0.96)',
                      }}
                    >
                      Manage roles
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12,
                        color: 'rgba(196,181,253,0.9)',
                      }}
                    >
                      Promote or demote band members.
                    </p>
                  </div>

                  {membersError && (
                    <p
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: '#FCA5A5',
                      }}
                    >
                      {membersError}
                    </p>
                  )}

                  <IonList
                    lines="none"
                    style={{
                      marginTop: 8,
                      background: 'transparent',
                    }}
                  >
                    {members.map((m) => {
                      const role = m.role === 'admin' ? 'Admin' : 'Member';
                      const isSelf = m.user_id === currentUserId;
                      const canPromote =
                        isAdmin && m.role !== 'admin' && !isSelf;
                      const canDemote =
                        isAdmin && m.role === 'admin' && !isSelf;
                      const isRowBusy = memberBusyId === m.user_id;

                      return (
                        <IonItem
                          key={m.user_id}
                          lines="none"
                          style={
                            {
                              '--background': 'transparent',
                              paddingInline: 0,
                            } as any
                          }
                        >
                          <AvatarImageMobile
                            name={m.name}
                            bucket="profile-avatars"
                            avatarPath={m.avatar_path ?? undefined}
                            updatedAt={m.avatar_updated_at ?? undefined}
                            size={32}
                          />
                          <IonLabel className="ion-margin-start">
                            <h3
                              style={{
                                fontWeight: 600,
                                fontSize: 15,
                                marginBottom: 2,
                              }}
                            >
                              {m.name}
                              {isSelf && (
                                <span
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 11,
                                    color: '#9CA3AF',
                                  }}
                                >
                                  (you)
                                </span>
                              )}
                            </h3>
                            <p
                              style={{
                                fontSize: 12,
                                color:
                                  m.role === 'admin' ? '#FBBF24' : '#9CA3AF',
                              }}
                            >
                              {role}
                            </p>
                          </IonLabel>

                          {isAdmin && (canPromote || canDemote) && (
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
                                marginLeft: 8,
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid rgba(148,163,184,0.8)',
                                background: 'transparent',
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#E5E7EB',
                                opacity: isRowBusy ? 0.6 : 1,
                              }}
                            >
                              {isRowBusy
                                ? 'Working…'
                                : canPromote
                                ? 'Promote to admin'
                                : 'Demote to member'}
                            </button>
                          )}
                        </IonItem>
                      );
                    })}
                  </IonList>
                </div>

                {/* Danger Zone (admin: delete band) */}
                <div
                  style={{
                    borderRadius: 18,
                    background:
                      'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                    border: '1px solid rgba(220,38,38,0.7)',
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <IonIcon
                      icon={warningOutline}
                      style={{ marginRight: 8, color: '#FCA5A5' }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 0.04,
                        textTransform: 'uppercase',
                        color: 'rgba(254,226,226,0.96)',
                      }}
                    >
                      Danger Zone
                    </p>
                  </div>
                  <p
                    style={{
                      margin: '0 0 12px',
                      fontSize: 13,
                      color: 'rgba(254,202,202,0.9)',
                    }}
                  >
                    Delete this band for everyone. This is permanent.
                  </p>

                  <IonButton
                    expand="block"
                    color="danger"
                    disabled={busyDanger}
                    onClick={() => setShowDeleteAlert(true)}
                    style={{ '--border-radius': '999px' } as any}
                  >
                    {busyDanger ? 'Working…' : 'Delete band'}
                  </IonButton>
                </div>
              </>
            ) : (
              /* Member-only: leave band */
              <div
                style={{
                  borderRadius: 18,
                  background:
                    'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                  border: '1px solid rgba(220,38,38,0.7)',
                  padding: 14,
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <IonIcon
                    icon={warningOutline}
                    style={{ marginRight: 8, color: '#FCA5A5' }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 0.04,
                      textTransform: 'uppercase',
                      color: 'rgba(254,226,226,0.96)',
                    }}
                  >
                    Leave band
                  </p>
                </div>
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: 13,
                    color: 'rgba(254,202,202,0.9)',
                  }}
                >
                  You’ll lose access to this band’s events and setlists.
                </p>

                <IonButton
                  expand="block"
                  color="medium"
                  fill="outline"
                  disabled={busyDanger}
                  onClick={() => setShowLeaveAlert(true)}
                  style={
                    {
                      '--border-radius': '999px',
                      '--border-color': 'rgba(148,163,184,0.7)',
                    } as any
                  }
                >
                  {busyDanger ? 'Working…' : 'Leave band'}
                </IonButton>
              </div>
            )}

            {error && (
              <IonText color="danger">
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                  }}
                >
                  {error}
                </p>
              </IonText>
            )}
          </div>
        )}
      </IonContent>

      {/* Alerts */}
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
              handleLeaveBand();
            },
          },
        ]}
      />

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete band?"
        message={`This will permanently delete ${bandName} for everyone.\n\nType the band name exactly to confirm.`}
        style={
          {
            '--background': '#050509',
            '--color': '#E5E7EB',
            '--backdrop-opacity': '0.9',
            '--button-color': '#E5E7EB',
            '--border-radius': '18px',

            // 👇 make the alert a bit wider so text + input fit comfortably
            '--width': '92vw',
            '--max-width': '420px',
          } as any
        }
        inputs={[
          {
            name: 'confirm',
            type: 'text',
            placeholder: `Type "${bandName}"`,
          },
        ]}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setShowDeleteAlert(false),
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: (data) => {
              const val =
                typeof data?.confirm === 'string' ? data.confirm.trim() : '';

              if (val !== bandName) {
                setError(`To delete this band, type "${bandName}" exactly.`);
                return false; // keep alert open
              }

              setShowDeleteAlert(false);
              handleDeleteBand();
              return true;
            },
          },
        ]}
      />
    </IonPage>
  );
}
