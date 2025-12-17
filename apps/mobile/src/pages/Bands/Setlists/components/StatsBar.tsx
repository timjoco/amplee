import { IonSpinner } from '@ionic/react';
import { glassCard, PINK } from '../lib/styles';

export function StatsBar({
  songCount,
  durationMinutes,
  durationLabel,
  savingReorder,
}: {
  songCount: number;
  durationMinutes: number; // 0 when unknown
  durationLabel: string; // "—" or "mm:ss"
  savingReorder: boolean;
}) {
  const hasDuration =
    durationMinutes > 0 && durationLabel && durationLabel !== '—';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: 12,
        marginBottom: 16,
      }}
    >
      {/* Songs */}
      <div
        style={{
          flex: 1,
          ...glassCard,
          border: `1px solid ${PINK.border}`,
          padding: '14px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: PINK.light,
            lineHeight: 1,
          }}
        >
          {songCount}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            marginTop: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {songCount === 1 ? 'Song' : 'Songs'}
        </div>
      </div>

      {/* Duration */}
      <div
        style={{
          flex: 1,
          ...glassCard,
          border: `1px solid ${PINK.border}`,
          padding: '14px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: PINK.light,
            lineHeight: 1,
          }}
        >
          {hasDuration ? durationLabel : '—'}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            marginTop: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Duration
        </div>
      </div>

      {savingReorder && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: PINK.subtle,
            border: `1px solid ${PINK.border}`,
            fontSize: 12,
            fontWeight: 600,
            color: PINK.light,
          }}
        >
          <IonSpinner
            style={{ '--color': PINK.light, width: 14, height: 14 }}
          />
          Saving...
        </div>
      )}
    </div>
  );
}
