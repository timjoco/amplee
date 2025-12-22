import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { IonIcon } from '@ionic/react';
import {
  addOutline,
  musicalNotesOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { glassCard, PINK } from '../lib/styles';
import { SetlistTemplateItemRow } from '../types/setlistTypes';
import { SortableTemplateItemCard } from './SortableTemplateItemCard';

export function SongsSection({
  items,
  sensors,
  onDragEnd,
  onDeleteItem,
  onAddClick,
  onEmptyCtaClick,
  isAddPressed,
  isAdmin,
}: {
  items: SetlistTemplateItemRow[];
  sensors: any;
  onDragEnd: (event: DragEndEvent) => void;
  onDeleteItem: (id: string) => void;
  onAddClick: () => void;
  onEmptyCtaClick: () => void;
  isAddPressed: boolean;
  isAdmin: boolean;
}) {
  return (
    <div
      style={{
        ...glassCard,
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IonIcon
            icon={musicalNotesOutline}
            style={{ fontSize: 18, color: PINK.light }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Songs
          </span>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: PINK.primary,
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: `0 4px 12px ${PINK.glow}`,
              transform: isAddPressed ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 100ms ease-out',
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            Add
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: PINK.subtle,
              border: `1px solid ${PINK.border}`,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <IonIcon
              icon={sparklesOutline}
              style={{ fontSize: 24, color: PINK.light }}
            />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: '#e5e7eb',
              marginBottom: 6,
            }}
          >
            {isAdmin ? 'Start building your setlist' : 'No songs yet'}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6b7280',
              marginBottom: isAdmin ? 16 : 0,
            }}
          >
            {isAdmin
              ? 'Add songs from your library and drag to reorder'
              : 'This setlist is empty. Ask an admin to add songs.'}
          </p>

          {isAdmin && (
            <button
              type="button"
              onClick={onEmptyCtaClick}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                background: PINK.primary,
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: `0 4px 14px ${PINK.glow}`,
              }}
            >
              Add your first song
            </button>
          )}
        </div>
      ) : (
        /* Song List */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={isAdmin ? onDragEnd : undefined}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={items.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((row, index) => (
                <SortableTemplateItemCard
                  key={row.id}
                  row={row}
                  index={index}
                  onDelete={() => onDeleteItem(row.id)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
