import { IonIcon } from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';

import type { Option } from '../types';
import { formatShortDate } from '../utils';

type Props = {
  options: Option[];
  membersCount: number;
};

export function ProposalStatsHeader({ options, membersCount }: Props) {
  // Highest YES percentage across options
  // In case of tie, choose the earliest date
  const bestYes =
    membersCount > 0 && options.length > 0
      ? options.reduce(
          (acc, o) => {
            const pct = (o.yes / membersCount) * 100;
            if (pct > acc.pct) {
              return { pct, yes: o.yes, option: o };
            }
            if (pct === acc.pct && acc.option) {
              const thisDate = new Date(o.starts_at);
              const accDate = new Date(acc.option.starts_at);
              if (thisDate < accDate) {
                return { pct, yes: o.yes, option: o };
              }
            }
            return acc;
          },
          { pct: 0, yes: 0, option: null as Option | null }
        )
      : { pct: 0, yes: 0, option: null as Option | null };

  const bestYesPct = Math.round(bestYes.pct);
  const bestDateLabel = bestYes.option
    ? formatShortDate(bestYes.option.starts_at)
    : null;

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(251, 191, 36, 0.04))',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        borderRadius: 16,
        padding: '20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: 'rgba(251, 191, 36, 0.95)',
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          {bestYes.yes}/{membersCount}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: bestDateLabel ? 8 : 0,
          }}
        >
          Front Runner
        </div>
        {bestDateLabel && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(251, 191, 36, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IonIcon icon={calendarOutline} style={{ fontSize: 14 }} />
            {bestDateLabel}
          </div>
        )}
      </div>

      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `conic-gradient(
            rgba(251, 191, 36, 0.8) 0% ${bestYesPct}%,
            rgba(15, 23, 42, 0.8) ${bestYesPct}% 100%
          )`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            color: 'rgba(251, 191, 36, 0.95)',
          }}
        >
          {bestYesPct}%
        </div>
      </div>
    </div>
  );
}
