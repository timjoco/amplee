/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonDatetime } from '@ionic/react';
import * as React from 'react';
import '../../theme/amplee.css';

export type DateTimePickerMobileProps = {
  value?: string | null;
  onChange?: (iso: string) => void;
  min?: string;
  max?: string;
};

export default function DateTimePickerMobile({
  value,
  onChange,
  min,
  max,
}: DateTimePickerMobileProps) {
  const [internal, setInternal] = React.useState<string | undefined>(
    value ?? undefined
  );

  React.useEffect(() => {
    setInternal(value ?? undefined);
  }, [value]);

  // Default: no past dates – kept in case we want it later
  const todayStartIso = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 18,
        padding: 6,
        background:
          'radial-gradient(circle at top, rgba(15,23,42,0.98), rgba(3,7,18,0.98))',
        boxShadow: '0 0 0 1px rgba(129,140,248,0.45)',
        overflow: 'hidden',
      }}
    >
      <IonDatetime
        presentation="date-time"
        preferWheel={true}
        value={internal}
        min={min}
        max={max}
        minuteValues="0,5,10,15,20,25,30,35,40,45,50,55"
        onIonChange={(e) => {
          const v = e.detail.value;
          if (typeof v === 'string') {
            setInternal(v);
            onChange?.(v);
          }
        }}
        showDefaultButtons={false}
        style={
          {
            width: '100%',
            // make the wheel sit nicely inside the square
            height: '260px',
            transform: 'scale(0.96)',
            transformOrigin: 'center',
            // wheel colors to match Amplee card
            '--background': 'transparent',
            '--background-rgb': '15,23,42',
            '--wheel-fade-background-rgb': '15,23,42',
            '--wheel-highlight-background': 'rgba(15,23,42,0.98)',
            '--wheel-border-radius': '16px',
          } as React.CSSProperties
        }
      />
    </div>
  );
}
