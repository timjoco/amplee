import { IonIcon, IonSegment, IonSegmentButton } from '@ionic/react';
import { chatbubbleOutline, mailOutline } from 'ionicons/icons';

import type { InviteMode } from '../types';

type Props = {
  mode: InviteMode;
  onModeChange: (mode: InviteMode) => void;
};

export function InviteModeSelector({ mode, onModeChange }: Props) {
  return (
    <>
      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBlock: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background: 'rgba(148,163,184,0.3)',
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.5,
            color: '#6b7280',
          }}
        >
          OR SEND DIRECTLY
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: 'rgba(148,163,184,0.3)',
          }}
        />
      </div>

      {/* Mode Selector */}
      <IonSegment
        value={mode}
        onIonChange={(e) => onModeChange(e.detail.value as InviteMode)}
        style={{
          '--background': 'rgba(15,23,42,0.9)',
          marginTop: 4,
          marginBottom: 8,
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.35)',
        }}
      >
        <IonSegmentButton value="email">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 0',
            }}
          >
            <IonIcon icon={mailOutline} style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Email</span>
          </div>
        </IonSegmentButton>
        <IonSegmentButton value="sms">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 0',
            }}
          >
            <IonIcon icon={chatbubbleOutline} style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Text</span>
          </div>
        </IonSegmentButton>
      </IonSegment>
    </>
  );
}
