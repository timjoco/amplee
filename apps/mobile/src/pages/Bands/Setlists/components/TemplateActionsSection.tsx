import { IonIcon } from '@ionic/react';
import { createOutline, trashOutline } from 'ionicons/icons';
import { PINK, RED } from '../lib/styles';

export function TemplateActionsSection({
  onRenameClick,
  onDeleteClick,
  isRenamePressed,
  isDeletePressed,
}: {
  onRenameClick: () => void;
  onDeleteClick: () => void;
  isRenamePressed: boolean;
  isDeletePressed: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        marginTop: 8,
      }}
    >
      <button
        type="button"
        onClick={onRenameClick}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 16px',
          borderRadius: 12,
          background: PINK.subtle,
          border: `1px solid ${PINK.border}`,
          color: PINK.light,
          fontSize: 14,
          fontWeight: 600,
          transform: isRenamePressed ? 'scale(0.97)' : 'scale(1)',
          transition: 'all 100ms ease-out',
        }}
      >
        <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
        Rename
      </button>

      <button
        type="button"
        onClick={onDeleteClick}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 16px',
          borderRadius: 12,
          background: RED.subtle,
          border: `1px solid ${RED.border}`,
          color: RED.light,
          fontSize: 14,
          fontWeight: 600,
          transform: isDeletePressed ? 'scale(0.97)' : 'scale(1)',
          transition: 'all 100ms ease-out',
        }}
      >
        <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
        Delete
      </button>
    </div>
  );
}
