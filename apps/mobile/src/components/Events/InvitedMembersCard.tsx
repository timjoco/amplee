/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner, IonText } from '@ionic/react';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  helpCircleOutline,
  peopleOutline,
} from 'ionicons/icons';
import {
  useEventInvitedMembers,
  type InvitedMemberRow,
} from '../../hooks/useEventInvitedMembers';

function initialsFromName(
  first?: string | null,
  last?: string | null,
  fallback?: string | null
) {
  const a = (first ?? '').trim();
  const b = (last ?? '').trim();
  const s = [a, b].filter(Boolean).join(' ').trim() || (fallback ?? '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase() || '?';
}

function statusMeta(status: string) {
  if (status === 'accepted') {
    return {
      label: 'Confirmed',
      icon: checkmarkCircleOutline,
      color: 'rgba(52, 211, 153, 0.95)',
      bg: 'rgba(52, 211, 153, 0.08)',
      border: 'rgba(52, 211, 153, 0.25)',
    };
  }
  if (status === 'declined') {
    return {
      label: 'Declined',
      icon: closeCircleOutline,
      color: 'rgba(248, 113, 113, 0.95)',
      bg: 'rgba(248, 113, 113, 0.08)',
      border: 'rgba(248, 113, 113, 0.25)',
    };
  }
  return {
    label: 'Pending',
    icon: helpCircleOutline,
    color: 'rgba(251, 191, 36, 0.95)',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.25)',
  };
}

function MemberRow({ m }: { m: InvitedMemberRow }) {
  const firstLast = [m.first_name, m.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const name = firstLast || m.display_name || 'Unknown';
  const meta = statusMeta(m.status);

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#cbd5e1',
          fontWeight: 800,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {initialsFromName(m.first_name, m.last_name, m.display_name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#f9fafb',
            fontWeight: 700,
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              borderRadius: 999,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              color: meta.color,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            <IonIcon icon={meta.icon} style={{ fontSize: 14 }} />
            {meta.label}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvitedMembersCard({ eventId }: { eventId: string }) {
  const { loading, error, grouped } = useEventInvitedMembers(eventId);

  const total =
    grouped.accepted.length + grouped.pending.length + grouped.declined.length;

  return (
    <div
      style={{
        marginTop: 12,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        background:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
        border: '1px solid rgba(52, 211, 153, 0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
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
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'rgba(52, 211, 153, 0.12)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IonIcon
            icon={peopleOutline}
            style={{ color: 'rgba(52, 211, 153, 0.95)', fontSize: 18 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f9fafb', fontWeight: 800, fontSize: 14 }}>
            Invited Members
          </div>
          <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
            {total} invited • {grouped.accepted.length} confirmed
          </div>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#9ca3af',
            fontSize: 13,
          }}
        >
          <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
          Loading invited members…
        </div>
      ) : error ? (
        <IonText color="danger">
          <p style={{ margin: 0, fontWeight: 700 }}>{error}</p>
        </IonText>
      ) : total === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          No invites found for this event.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {grouped.accepted.map((m) => (
            <MemberRow key={`${m.user_id}-accepted`} m={m} />
          ))}
          {grouped.pending.map((m) => (
            <MemberRow key={`${m.user_id}-pending`} m={m} />
          ))}
          {grouped.declined.map((m) => (
            <MemberRow key={`${m.user_id}-declined`} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
