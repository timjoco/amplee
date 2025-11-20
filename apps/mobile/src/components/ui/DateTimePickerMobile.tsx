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

  // Default: no past dates
  const todayStartIso = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  return (
    <div style={{ width: '100%' }}>
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
            '--background': 'transparent',
            '--background-rgb': '0, 0, 0', // not really used if background is transparent
            '--wheel-fade-background-rgb': '15, 23, 42',
            '--wheel-highlight-background': 'rgba(15,23,42,0.9)',
          } as React.CSSProperties
        }
      />
    </div>
  );
}
