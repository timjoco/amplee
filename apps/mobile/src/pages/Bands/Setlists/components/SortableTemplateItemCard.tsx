import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IonIcon } from '@ionic/react';
import {
  musicalNotesOutline,
  reorderThreeOutline,
  speedometerOutline,
} from 'ionicons/icons';
import { PINK, RED } from '../lib/styles';
import { SetlistTemplateItemRow } from '../types/setlistTypes';

export function SortableTemplateItemCard({
  row,
  index,
  onDelete,
  isAdmin,
}: {
  row: SetlistTemplateItemRow;
  index: number;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !isAdmin });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: isDragging ? PINK.subtle : 'rgba(255, 255, 255, 0.02)',
          border: isDragging
            ? `1px solid ${PINK.border}`
            : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: isDragging
            ? `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${PINK.glow}`
            : 'none',
          transition: 'background 150ms, border 150ms, box-shadow 150ms',
        }}
      >
        {/* Drag handle + index */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            width: 28,
            flexShrink: 0,
          }}
        >
          {isAdmin && (
            <button
              type="button"
              aria-label="Reorder"
              {...attributes}
              {...listeners}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 4,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                touchAction: 'none',
                borderRadius: 6,
              }}
            >
              <IonIcon
                icon={reorderThreeOutline}
                style={{ fontSize: 20, color: '#6b7280' }}
              />
            </button>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: PINK.light,
            }}
          >
            {index + 1}
          </span>
        </div>

        {/* Song info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#f9fafb',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 4,
            }}
          >
            {row.title}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 13, color: PINK.light, opacity: 0.7 }}
              />
              <span>{row.musical_key || '—'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IonIcon
                icon={speedometerOutline}
                style={{ fontSize: 13, color: PINK.light, opacity: 0.7 }}
              />
              <span>{row.bpm ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Remove button (Admin Only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: RED.subtle,
              border: `1px solid ${RED.border}`,
              color: RED.light,
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
