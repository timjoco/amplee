import { IonIcon } from '@ionic/react';
import {
  cashOutline,
  checkmarkCircleOutline,
  locationOutline,
} from 'ionicons/icons';
import { glassCard, TEAL } from '../lib/styles';

type Props = {
  stopCount: number;
  confirmedCount: number;
  netProfit: number;
  currency?: string;
};

export function TourStatsBar({
  stopCount,
  confirmedCount,
  netProfit,
  currency = 'USD',
}: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      style={{
        ...glassCard,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: `1px solid ${TEAL.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Stops count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IonIcon
            icon={locationOutline}
            style={{ color: TEAL.light, fontSize: 16 }}
          />
          <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>
            {stopCount}
          </span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>
            {stopCount === 1 ? 'stop' : 'stops'}
          </span>
        </div>

        {/* Confirmed count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IonIcon
            icon={checkmarkCircleOutline}
            style={{ color: '#10b981', fontSize: 16 }}
          />
          <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>
            {confirmedCount}
          </span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>confirmed</span>
        </div>

        {/* Net profit */}
        {netProfit !== 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IonIcon
              icon={cashOutline}
              style={{
                color: netProfit >= 0 ? '#10b981' : '#ef4444',
                fontSize: 16,
              }}
            />
            <span
              style={{
                color: netProfit >= 0 ? '#10b981' : '#ef4444',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {netProfit >= 0 ? '+' : ''}
              {formatCurrency(netProfit)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
