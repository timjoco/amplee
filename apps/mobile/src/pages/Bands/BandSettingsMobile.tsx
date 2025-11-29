/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, warningOutline } from 'ionicons/icons';
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
    if (!bandId || myRole !== 'admin') return;

    try {
      setBusyDanger(true);
      setError(null);

      const { error: delErr } = await supabase
        .from('bands')
        .delete()
        .eq('id', bandId);

      if (delErr) throw delErr;

      setShowDeleteToast(true);
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
        {loading && (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonSpinner name="dots" style={{ color: '#a855f7' }} />
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              padding: 16,
            }}
          >
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

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
            {/* BAND HEADER SNAPSHOT (name + avatar) */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(148,163,184,0.18)',
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
                size={40}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: '#6b7280',
                    fontWeight: 600,
                  }}
                >
                  Band
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {bandName}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <>
                {/* Band profile card */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: 20,
                    padding: 20,
                  }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#a855f7',
                      }}
                    >
                      Band profile
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: '#9ca3af',
                      }}
                    >
                      Update the band name and avatar.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      borderTop: '1px solid rgba(148,163,184,0.18)',
                      paddingTop: 12,
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

                {/* Manage roles card */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(148,163,184,0.18)',
                    borderRadius: 20,
                    padding: 20,
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#e5e7eb',
                      }}
                    >
                      Manage roles
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: '#9ca3af',
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

                {/* Danger Zone (admin) */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    borderRadius: 20,
                    padding: 20,
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
                    }}
                  >
                    Delete this band for everyone. This cannot be undone.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowDeleteAlert(true)}
                    disabled={busyDanger}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(248, 113, 113, 0.5)',
                      background: 'rgba(248, 113, 113, 0.05)',
                      color: '#fca5a5',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: busyDanger ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      opacity: busyDanger ? 0.6 : 1,
                    }}
                  >
                    {busyDanger ? 'Working…' : 'Delete band'}
                  </button>
                </div>
              </>
            ) : (
              // Member-only: leave band card
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: 20,
                  padding: 20,
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
                    Leave band
                  </p>
                </div>
                <p
                  style={{
                    margin: '0 0 20px',
                    fontSize: 13,
                    color: '#9ca3af',
                  }}
                >
                  You’ll lose access to this band’s events and setlists.
                </p>

                <IonButton
                  expand="block"
                  fill="outline"
                  disabled={busyDanger}
                  onClick={() => setShowLeaveAlert(true)}
                  style={
                    {
                      '--border-radius': '999px',
                      '--border-color': 'rgba(248,113,113,0.95)',
                      '--color': 'rgba(248,113,113,0.98)',
                      '--background-hover': 'rgba(127,29,29,0.35)',
                      '--background-activated': 'rgba(127,29,29,0.55)',
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

      {/* Delete band alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete band?"
        message={`This will permanently delete ${trimmedBandName} for everyone.\n\nType the band name exactly to confirm.`}
        cssClass="custom-dark-alert delete-event-alert"
        inputs={[
          {
            name: 'confirm',
            type: 'text',
            placeholder: `Type "${trimmedBandName}"`,
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

              if (!trimmedBandName || val !== trimmedBandName) {
                setError(
                  `To delete this band, type "${trimmedBandName}" exactly.`
                );
                return false;
              }

              setShowDeleteAlert(false);
              void handleDeleteBand();
              return true;
            },
          },
        ]}
      />

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
