/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonModal,
  IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import '../../theme/amplee.css';

type AmpleeDateTimeWheelProps = {
  open: boolean;
  label?: string;
  value?: string | null; // ISO in
  min?: string;
  max?: string;
  minuteStep?: number;
  onChange?: (iso: string | null) => void;
  onDismiss?: () => void;
};

export default function AmpleeDateTimeWheel({
  open,
  label = 'Pick date & time',
  value,
  min,
  max,
  minuteStep = 5,
  onChange,
  onDismiss,
}: AmpleeDateTimeWheelProps) {
  const [internal, setInternal] = useState<string | undefined>(
    value ?? undefined
  );

  useEffect(() => {
    setInternal(value ?? undefined);
  }, [value]);

  const minuteValues = React.useMemo(() => {
    const step = Math.max(1, minuteStep);
    const vals: number[] = [];
    for (let m = 0; m < 60; m += step) vals.push(m);
    return vals.join(',');
  }, [minuteStep]);

  const handleDone = () => {
    if (typeof internal === 'string') {
      onChange?.(internal);
    } else {
      onChange?.(null);
    }
    onDismiss?.();
  };

  const handleClose = () => {
    onDismiss?.();
  };

  return (
    <IonModal isOpen={open} onDidDismiss={handleClose}>
      <IonContent
        style={{
          '--background':
            'radial-gradient(circle at top, rgba(34, 15, 42, 0.98), #020617 55%)',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '92%',
              maxWidth: 380,
              borderRadius: 22,
              padding: 16,
              border: '1px solid rgba(52, 211, 153, 0.95)',
              boxShadow: '0 18px 60px rgba(0,0,0,0.9)',
              background:
                'radial-gradient(circle at top, rgba(15,23,42,0.98), rgba(3,7,18,0.98))',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <IonText>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#EDE9FE',
                }}
              >
                {label}
              </p>
            </IonText>

            {/* WHEEL CONTAINER – blended + crops bottom */}
            <div
              style={{
                borderRadius: 18,
                padding: 4,
                background:
                  'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(3,7,18,0.98))',
                boxShadow: '0 0 0 1px rgba(15,23,42,0.9)',
                border: '1px solid rgba(15,23,42,0.95)',
                overflow: 'hidden',
                height: 240, // fixes visible area
              }}
            >
              <IonDatetime
                presentation="date-time"
                preferWheel={true}
                value={internal}
                min={min}
                max={max}
                minuteValues={minuteValues}
                onIonChange={(e) => {
                  const v = e.detail.value;
                  if (typeof v === 'string') {
                    setInternal(v);
                  }
                }}
                showDefaultButtons={false}
                style={
                  {
                    // slightly taller + shifted up so bottom bits are hidden
                    width: '112%',
                    marginLeft: '-6%',
                    height: 290,
                    transform: 'translateY(-10px) scale(0.96)',
                    transformOrigin: 'center',
                    '--background': 'transparent',
                    '--background-rgb': '15,23,42',
                    '--wheel-fade-background-rgb': '15,23,42',
                    '--wheel-highlight-background': 'rgba(52, 211, 153, 0.35)',
                    '--wheel-border-radius': '16px',
                  } as React.CSSProperties
                }
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
                marginTop: 4,
              }}
            >
              <IonButton
                expand="block"
                fill="outline"
                color="medium"
                onClick={handleClose}
                style={{ borderRadius: 999 }}
              >
                Close
              </IonButton>
              <IonButton
                expand="block"
                onClick={handleDone}
                style={{
                  '--background': 'rgba(52,211,153,0.95)',
                  '--background-activated': 'rgba(16,185,129,1)',
                  '--color': '#022c22',
                  borderRadius: 999,
                }}
              >
                Done
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}
