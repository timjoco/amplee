import { IonButton, IonIcon } from '@ionic/react';
import {
  calendarOutline,
  createOutline,
  locationOutline,
  personOutline,
  trashOutline,
} from 'ionicons/icons';

import type { Proposal } from '../types';

type Props = {
  proposal: Proposal;
  myId: string | null;
  proposedByName: string | null;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function ProposalDetailsCard({
  proposal,
  myId,
  proposedByName,
  isAdmin,
  onEdit,
  onDelete,
}: Props) {
  const locationText = proposal.venue?.trim() || 'Location TBD';
  const proposedByText = proposal.created_by
    ? proposal.created_by === myId
      ? 'You'
      : proposedByName || 'Bandmate'
    : 'Unknown';

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
        border: '1px solid rgba(251, 191, 36, 0.25)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
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
            background:
              'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IonIcon
            icon={calendarOutline}
            style={{
              fontSize: 20,
              color: 'rgba(251, 191, 36, 0.95)',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Proposed Gig
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#e5e7eb',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {proposal.title || 'Proposed Gig'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IonIcon
            icon={locationOutline}
            style={{ fontSize: 16, color: 'rgba(251, 191, 36, 0.7)' }}
          />
          <span style={{ fontSize: 14, color: '#9ca3af' }}>{locationText}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IonIcon
            icon={personOutline}
            style={{ fontSize: 16, color: 'rgba(251, 191, 36, 0.7)' }}
          />
          <span style={{ fontSize: 14, color: '#9ca3af' }}>
            Proposed by {proposedByText}
          </span>
        </div>
      </div>

      {isAdmin && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            gap: 8,
          }}
        >
          <IonButton
            size="small"
            fill="outline"
            expand="block"
            style={
              {
                flex: 1,
                '--border-color': 'rgba(251, 191, 36, 0.5)',
                '--color': 'rgba(251, 191, 36, 0.95)',
                '--background-activated': 'rgba(251, 191, 36, 0.15)',
                borderRadius: 12,
              } as any
            }
            onClick={onEdit}
          >
            <IonIcon icon={createOutline} slot="start" />
            Edit
          </IonButton>
          <IonButton
            size="small"
            fill="outline"
            style={
              {
                '--border-color': 'rgba(248, 113, 113, 0.5)',
                '--color': 'rgba(248, 113, 113, 0.95)',
                '--background-activated': 'rgba(248, 113, 113, 0.15)',
                borderRadius: 12,
              } as any
            }
            onClick={onDelete}
          >
            <IonIcon icon={trashOutline} slot="icon-only" />
          </IonButton>
        </div>
      )}
    </div>
  );
}
