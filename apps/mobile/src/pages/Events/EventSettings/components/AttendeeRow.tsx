// apps/mobile/src/pages/Events/EventSettings/components/AttendeeRow.tsx
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal, trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import type { InvitedMemberRow } from '../types';
import { displayNameFromProfile, statusMeta } from '../utils';

export function AttendeeRow({
  m,
  onRemove,
}: {
  m: InvitedMemberRow;
  onRemove: (userId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const { primary, secondary } = displayNameFromProfile(m);
  const meta = statusMeta(m.status);

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: '14px 14px',
          minHeight: 68,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <AvatarImageMobile
          name={primary}
          bucket="profile-avatars"
          avatarPath={m.avatar_url || undefined}
          updatedAt={m.updated_at || undefined}
          size={44}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: '#f9fafb',
              fontWeight: 800,
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {primary}
          </div>

          {secondary && (
            <div
              style={{
                marginTop: 2,
                color: '#9ca3af',
                fontWeight: 600,
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {secondary}
            </div>
          )}

          <div style={{ marginTop: 6, display: 'inline-flex', gap: 6 }}>
            {/* ✅ Sub requested takes precedence */}
            {m.needs_sub ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px 7px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  background:
                    'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#93c5fd',
                }}
              >
                Sub requested
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 7px',
                  borderRadius: 999,
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  color: meta.color,
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                <IonIcon icon={meta.icon} style={{ fontSize: 12 }} />
                {meta.label}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowActions(true)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <IonIcon
            icon={ellipsisHorizontal}
            style={{ color: '#9ca3af', fontSize: 16 }}
          />
        </button>
      </div>

      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        header={primary}
        cssClass="amplee-action-sheet"
        buttons={[
          {
            text: 'Remove from Event',
            role: 'destructive',
            icon: trashOutline,
            handler: () => onRemove(m.user_id),
          },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />
    </>
  );
}
