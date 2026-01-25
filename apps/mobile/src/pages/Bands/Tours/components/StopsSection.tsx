import { IonIcon } from '@ionic/react';
import { addOutline, airplaneOutline } from 'ionicons/icons';
import { glassCard, TEAL } from '../lib/styles';
import type { TourStopWithFinancials } from '../types/tourTypes';
import { TourStopCard } from './TourStopCard';

type Props = {
  stops: TourStopWithFinancials[];
  onStopClick: (stopId: string) => void;
  onAddClick: () => void;
  isAddPressed: boolean;
  isAdmin: boolean;
};

export function StopsSection({
  stops,
  onStopClick,
  onAddClick,
  isAddPressed,
  isAdmin,
}: Props) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: TEAL.primary,
            }}
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
            Tour Stops
          </span>
        </div>

        {isAdmin && (
          <button
            onClick={onAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              background: TEAL.subtle,
              border: `1px solid ${TEAL.border}`,
              color: TEAL.light,
              fontSize: 13,
              fontWeight: 600,
              transform: isAddPressed ? 'scale(0.97)' : 'scale(1)',
              transition: 'all 120ms ease-out',
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            Add Stop
          </button>
        )}
      </div>

      {/* Stops List */}
      {stops.length === 0 ? (
        <div
          style={{
            ...glassCard,
            border: `1px solid ${TEAL.border}`,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: TEAL.subtle,
              border: `1px solid ${TEAL.border}`,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 14px',
            }}
          >
            <IonIcon
              icon={airplaneOutline}
              style={{ fontSize: 24, color: TEAL.light }}
            />
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: '#e5e7eb',
              marginBottom: 6,
            }}
          >
            No stops yet
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6b7280',
              marginBottom: isAdmin ? 16 : 0,
            }}
          >
            {isAdmin
              ? 'Add venues to build your tour itinerary.'
              : 'No stops have been added to this tour yet.'}
          </p>

          {isAdmin && (
            <button
              onClick={onAddClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 10,
                background: TEAL.primary,
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: `0 4px 14px ${TEAL.glow}`,
              }}
            >
              <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
              Add first stop
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {stops.map((stop) => (
            <TourStopCard
              key={stop.id}
              stop={stop}
              onClick={() => onStopClick(stop.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
