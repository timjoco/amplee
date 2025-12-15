import { IonIcon, IonSpinner, IonText } from '@ionic/react';
import { peopleOutline, personAddOutline } from 'ionicons/icons';
import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useEventInvitedMembers } from '../hooks/useEventInvitedMembers';
import { InvitedMemberRow } from '../types';
import { AddMembersModal } from './AddMembersModal';
import { AttendeeRow } from './AttendeeRow';

export function ManageAttendeesCard({
  eventId,
  bandId,
}: {
  eventId: string;
  bandId: string;
}) {
  const { loading, error, grouped, refetch } = useEventInvitedMembers(eventId);
  const [removing, setRemoving] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addedMembers, setAddedMembers] = useState<InvitedMemberRow[]>([]);

  const allAccepted = [
    ...grouped.accepted,
    ...addedMembers.filter((m) => m.status === 'accepted'),
  ];
  const allPending = [
    ...grouped.pending,
    ...addedMembers.filter((m) => m.status === 'pending'),
  ];
  const allDeclined = [
    ...grouped.declined,
    ...addedMembers.filter((m) => m.status === 'declined'),
  ];

  const filteredGrouped = {
    accepted: allAccepted.filter((m) => !removedIds.has(m.user_id)),
    pending: allPending.filter((m) => !removedIds.has(m.user_id)),
    declined: allDeclined.filter((m) => !removedIds.has(m.user_id)),
  };

  const total =
    filteredGrouped.accepted.length +
    filteredGrouped.pending.length +
    filteredGrouped.declined.length;

  const existingMemberIds = new Set([
    ...grouped.accepted.map((m) => m.user_id),
    ...grouped.pending.map((m) => m.user_id),
    ...grouped.declined.map((m) => m.user_id),
    ...addedMembers.map((m) => m.user_id),
  ]);
  removedIds.forEach((id) => existingMemberIds.delete(id));

  const handleRemoveMember = async (userId: string) => {
    if (removing) return;
    setRemoving(true);
    setRemovedIds((prev) => new Set(prev).add(userId));
    try {
      const { error } = await supabase
        .from('event_members')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
      if (error) {
        setRemovedIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        return;
      }
      await refetch?.({ silent: true });
    } finally {
      setRemoving(false);
    }
  };

  const handleMembersAdded = async (userIds: string[]) => {
    const newMembers: InvitedMemberRow[] = userIds.map((user_id) => ({
      user_id,
      first_name: null,
      last_name: null,
      display_name: 'New Member',
      avatar_url: null,
      status: 'pending',
      invited_at: null,
      updated_at: null,
    }));
    setAddedMembers((prev) => {
      const existing = new Set(prev.map((m) => m.user_id));
      const next = [...prev];
      newMembers.forEach((m) => {
        if (!existing.has(m.user_id)) next.push(m);
      });
      return next;
    });
    await refetch?.({ silent: true });
    setAddedMembers((prev) => {
      const nowReal = new Set([
        ...grouped.accepted.map((m) => m.user_id),
        ...grouped.pending.map((m) => m.user_id),
        ...grouped.declined.map((m) => m.user_id),
        ...userIds,
      ]);
      return prev.filter((m) => !nowReal.has(m.user_id));
    });
  };

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IonIcon
              icon={peopleOutline}
              style={{ color: '#a78bfa', fontSize: 18 }}
            />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: '#a78bfa',
              }}
            >
              Manage Attendees
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
              {total} member{total !== 1 ? 's' : ''} invited
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
          }}
        >
          <IonIcon icon={personAddOutline} style={{ fontSize: 16 }} /> Add
        </button>
      </div>
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#9ca3af',
            fontSize: 13,
            padding: '16px 0',
            justifyContent: 'center',
          }}
        >
          <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />{' '}
          Loading attendees…
        </div>
      ) : error ? (
        <IonText color="danger">
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{error}</p>
        </IonText>
      ) : total === 0 ? (
        <div
          style={{
            color: '#9ca3af',
            fontSize: 13,
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          <IonIcon
            icon={peopleOutline}
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.12)',
              marginBottom: 8,
              display: 'block',
            }}
          />
          <div>No members invited yet</div>
          <div style={{ fontSize: 12, marginTop: 4, color: '#6b7280' }}>
            Tap "Add" to invite band members
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredGrouped.accepted.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#34D399',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: 4,
                  marginBottom: 4,
                }}
              >
                Confirmed ({filteredGrouped.accepted.length})
              </div>
              {filteredGrouped.accepted.map((m) => (
                <AttendeeRow
                  key={`${m.user_id}-accepted`}
                  m={m}
                  onRemove={handleRemoveMember}
                />
              ))}
            </>
          )}
          {filteredGrouped.pending.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#FBBF24',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: filteredGrouped.accepted.length > 0 ? 12 : 4,
                  marginBottom: 4,
                }}
              >
                Pending ({filteredGrouped.pending.length})
              </div>
              {filteredGrouped.pending.map((m) => (
                <AttendeeRow
                  key={`${m.user_id}-pending`}
                  m={m}
                  onRemove={handleRemoveMember}
                />
              ))}
            </>
          )}
          {filteredGrouped.declined.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#F87171',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop:
                    filteredGrouped.accepted.length > 0 ||
                    filteredGrouped.pending.length > 0
                      ? 12
                      : 4,
                  marginBottom: 4,
                }}
              >
                Declined ({filteredGrouped.declined.length})
              </div>
              {filteredGrouped.declined.map((m) => (
                <AttendeeRow
                  key={`${m.user_id}-declined`}
                  m={m}
                  onRemove={handleRemoveMember}
                />
              ))}
            </>
          )}
        </div>
      )}
      <AddMembersModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        bandId={bandId}
        eventId={eventId}
        existingMemberIds={existingMemberIds}
        onMembersAdded={handleMembersAdded}
      />
    </div>
  );
}
