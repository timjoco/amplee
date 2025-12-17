import { IonIcon } from '@ionic/react';
import {
  alertCircleOutline,
  calendarOutline,
  chevronDownOutline,
  chevronUpOutline,
  personOutline,
  timeOutline,
} from 'ionicons/icons';
import { useState } from 'react';
import type { SameDayEvent } from '../types';
import { Conflict, normalizeConflicts } from '../utils/normalizeConflicts';

export default function EventWarnings({
  conflicts,
  sameDayEvents,
}: {
  conflicts: any[];
  sameDayEvents: SameDayEvent[];
}) {
  const [expandedSection, setExpandedSection] = useState<
    'conflicts' | 'sameDay' | null
  >(null);

  const normalizedConflicts: Conflict[] = normalizeConflicts(conflicts);
  const hasConflicts = normalizedConflicts.length > 0;
  const hasSameDayEvents = sameDayEvents.length > 0;

  if (!hasConflicts && !hasSameDayEvents) return null;

  const totalWarnings = normalizedConflicts.length + sameDayEvents.length;

  const formatReason = (c: Conflict) => {
    if (c.reason === 'status_unavailable') return 'marked as unavailable';
    if (c.awayUntil) {
      const date = new Date(c.awayUntil + 'T00:00:00');
      const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `away until ${formatted}`;
    }
    return 'may have a conflict';
  };

  return (
    <div
      style={{
        marginTop: 14,
        marginBottom: 16,
        borderRadius: 14,
        background:
          'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'rgba(251, 191, 36, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IonIcon
            icon={alertCircleOutline}
            style={{ fontSize: 18, color: '#fbbf24' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fde68a',
              marginBottom: 2,
            }}
          >
            {totalWarnings} warning{totalWarnings > 1 ? 's' : ''} found
          </div>
          <div style={{ fontSize: 11, color: 'rgba(253, 230, 138, 0.6)' }}>
            You can still create this event
          </div>
        </div>
      </div>

      {hasConflicts && (
        <div style={{ borderTop: '1px solid rgba(251, 191, 36, 0.15)' }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSection(
                expandedSection === 'conflicts' ? null : 'conflicts'
              )
            }
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={personOutline}
              style={{ fontSize: 14, color: '#fbbf24' }}
            />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#fde68a',
              }}
            >
              {normalizedConflicts.length} member
              {normalizedConflicts.length > 1 ? 's' : ''} may not be available
            </span>
            <IonIcon
              icon={
                expandedSection === 'conflicts'
                  ? chevronUpOutline
                  : chevronDownOutline
              }
              style={{ fontSize: 14, color: 'rgba(253, 230, 138, 0.5)' }}
            />
          </button>

          {expandedSection === 'conflicts' && (
            <div
              style={{
                padding: '8px 14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {normalizedConflicts.map((c, idx) => {
                const safeName = (c.name ?? '').trim() || 'Unknown';
                const key = c.profileId ?? `conflict-${idx}`;

                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#fde68a',
                        }}
                      >
                        {safeName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#fef3c7',
                          marginBottom: 2,
                        }}
                      >
                        {safeName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(254, 243, 199, 0.6)',
                          lineHeight: 1.4,
                        }}
                      >
                        {formatReason(c)}
                        {c.statusNote && (
                          <span
                            style={{
                              display: 'block',
                              marginTop: 2,
                              fontStyle: 'italic',
                              color: 'rgba(254, 243, 199, 0.5)',
                            }}
                          >
                            "{c.statusNote}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {hasSameDayEvents && (
        <div style={{ borderTop: '1px solid rgba(251, 191, 36, 0.15)' }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSection(
                expandedSection === 'sameDay' ? null : 'sameDay'
              )
            }
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={timeOutline}
              style={{ fontSize: 14, color: '#fbbf24' }}
            />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#fde68a',
              }}
            >
              {sameDayEvents.length} event{sameDayEvents.length > 1 ? 's' : ''}{' '}
              already on this date
            </span>
            <IonIcon
              icon={
                expandedSection === 'sameDay'
                  ? chevronUpOutline
                  : chevronDownOutline
              }
              style={{ fontSize: 14, color: 'rgba(253, 230, 138, 0.5)' }}
            />
          </button>

          {expandedSection === 'sameDay' && (
            <div
              style={{
                padding: '8px 14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {sameDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background:
                        'linear-gradient(135deg, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 12, color: '#6ee7b7' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fef3c7',
                      }}
                    >
                      {ev.title}
                    </div>
                    {ev.type && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(254, 243, 199, 0.5)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {ev.type}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
