import {
  IonButton,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonSpinner,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';

import type { AvailabilityForOption, Option } from '../types';
import { formatDateLabel } from '../utils';

type Props = {
  option: Option;
  membersCount: number;
  availability: AvailabilityForOption | undefined;
  isAdmin: boolean;
  saving: boolean;
  converting: string | null;
  onVote: (optionId: string, vote: 'yes' | 'no') => void;
  onConvert: (optionId: string) => void;
  onEdit: (option: Option) => void;
  onDelete: (optionId: string) => void;
};

export function DateOptionCard({
  option,
  membersCount,
  availability,
  isAdmin,
  saving,
  converting,
  onVote,
  onConvert,
  onEdit,
  onDelete,
}: Props) {
  const allYes = membersCount > 0 && option.yes === membersCount && option.no === 0;
  const label = formatDateLabel(option.starts_at);
  const conflictCount = availability?.conflictCount;
  const isCheckingAvailability = conflictCount == null;

  let slidingRef: HTMLIonItemSlidingElement | null = null;

  return (
    <IonItemSliding
      ref={(el) => {
        slidingRef = el;
      }}
      disabled={!isAdmin}
    >
      <IonItem
        lines="none"
        style={{
          '--background': 'transparent',
          '--padding-start': '0px',
          '--inner-padding-end': '0px',
          paddingInline: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            borderRadius: 14,
            padding: 14,
            background: allYes
              ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.08))'
              : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9))',
            border: allYes
              ? '1px solid rgba(52, 211, 153, 0.4)'
              : '1px solid rgba(148, 163, 184, 0.2)',
            paddingRight: isAdmin ? 24 : 14,
          }}
        >
          {isAdmin && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                right: 0,
                width: 6,
                background: 'rgba(251, 191, 36, 0.4)',
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
              }}
            />
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#e5e7eb',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: isCheckingAvailability
                    ? '1px solid rgba(148, 163, 184, 0.25)'
                    : conflictCount > 0
                    ? '1px solid rgba(248, 113, 113, 0.25)'
                    : '1px solid rgba(52, 211, 153, 0.25)',
                  background: isCheckingAvailability
                    ? 'rgba(148, 163, 184, 0.06)'
                    : conflictCount > 0
                    ? 'rgba(248, 113, 113, 0.08)'
                    : 'rgba(52, 211, 153, 0.08)',
                  color: isCheckingAvailability
                    ? 'rgba(148, 163, 184, 0.85)'
                    : conflictCount > 0
                    ? 'rgba(248, 113, 113, 0.9)'
                    : 'rgba(52, 211, 153, 0.9)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {isCheckingAvailability ? (
                  <>
                    <IonSpinner name="dots" style={{ width: 16, height: 16 }} />
                    Availability
                  </>
                ) : (
                  <>
                    <IonIcon
                      icon={conflictCount > 0 ? closeCircleOutline : checkmarkCircleOutline}
                      style={{ fontSize: 14 }}
                    />
                    {conflictCount > 0 ? `${conflictCount} unavailable` : 'All available'}
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onVote(option.id, 'yes')}
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border:
                  option.myVote === 'yes'
                    ? '2px solid rgba(251, 191, 36, 0.6)'
                    : '1px solid rgba(251, 191, 36, 0.3)',
                background:
                  option.myVote === 'yes'
                    ? 'rgba(251, 191, 36, 0.95)'
                    : 'rgba(15, 23, 42, 0.8)',
                color: option.myVote === 'yes' ? '#000000' : 'rgba(251, 191, 36, 0.95)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 16 }} />
              Yes ({option.yes})
            </button>

            <button
              type="button"
              onClick={() => onVote(option.id, 'no')}
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border:
                  option.myVote === 'no'
                    ? '2px solid rgba(248, 113, 113, 0.6)'
                    : '1px solid rgba(248, 113, 113, 0.3)',
                background:
                  option.myVote === 'no'
                    ? 'rgba(248, 113, 113, 0.95)'
                    : 'rgba(15, 23, 42, 0.8)',
                color: option.myVote === 'no' ? '#000000' : 'rgba(248, 113, 113, 0.95)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <IonIcon icon={closeCircleOutline} style={{ fontSize: 16 }} />
              No ({option.no})
            </button>
          </div>

          {isAdmin && allYes && (
            <button
              type="button"
              onClick={() => onConvert(option.id)}
              disabled={saving || converting === option.id}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(52, 211, 153, 0.5)',
                background: 'rgba(52, 211, 153, 0.95)',
                color: '#000000',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {converting === option.id ? (
                <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
              ) : (
                '✓ Convert to Event'
              )}
            </button>
          )}
        </div>
      </IonItem>

      {isAdmin && (
        <IonItemOptions
          side="end"
          style={{
            background: 'transparent',
            paddingInline: 4,
            paddingBlock: 2,
          }}
        >
          <IonItemOption
            style={{
              '--background': 'transparent',
              padding: 0,
              margin: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <IonButton
                size="small"
                fill="solid"
                onClick={() => {
                  onEdit(option);
                  slidingRef?.closeOpened?.();
                }}
                style={
                  {
                    '--background': 'rgba(15, 23, 42, 0.95)',
                    '--color': 'rgba(251, 191, 36, 0.95)',
                    borderRadius: 10,
                  } as any
                }
              >
                <IonIcon icon={createOutline} slot="start" />
                Edit
              </IonButton>

              <IonButton
                size="small"
                fill="solid"
                onClick={() => {
                  slidingRef?.closeOpened?.();
                  onDelete(option.id);
                }}
                style={
                  {
                    '--background': 'rgba(127, 29, 29, 0.95)',
                    '--color': '#fecaca',
                    borderRadius: 10,
                  } as any
                }
              >
                <IonIcon icon={trashOutline} slot="start" />
                Delete
              </IonButton>
            </div>
          </IonItemOption>
        </IonItemOptions>
      )}
    </IonItemSliding>
  );
}
