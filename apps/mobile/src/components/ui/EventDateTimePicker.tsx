/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonModal } from '@ionic/react';
import {
  calendarOutline,
  checkmarkOutline,
  closeOutline,
  timeOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';

type EventDateTimePickerProps = {
  open: boolean;
  label?: string;
  value?: string; // ISO string
  min?: string; // ISO string
  onChange: (iso: string | null) => void;
  onDismiss: () => void;
};

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function EventDateTimePicker({
  open,
  label = 'Select Date & Time',
  value,
  min,
  onChange,
  onDismiss,
}: EventDateTimePickerProps) {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  useEffect(() => {
    if (value) {
      const local = toLocalInputValue(value);
      if (local) {
        const [date, time] = local.split('T');
        setDateValue(date || '');
        setTimeValue(time || '');
      }
    } else {
      // Default to today's date and current hour (rounded)
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const local = toLocalInputValue(now.toISOString());
      const [date, time] = local.split('T');
      setDateValue(date || '');
      setTimeValue(time || '');
    }
  }, [value, open]);

  const handleConfirm = () => {
    if (dateValue && timeValue) {
      const combined = `${dateValue}T${timeValue}`;
      const d = new Date(combined);
      if (!Number.isNaN(d.getTime())) {
        onChange(d.toISOString());
        onDismiss();
      }
    }
  };

  const handleClear = () => {
    onChange(null);
    onDismiss();
  };

  const minDate = min ? toLocalInputValue(min).split('T')[0] : undefined;

  // Quick presets
  const presets = [
    { label: 'Today', offset: 0 },
    { label: 'Tomorrow', offset: 1 },
    { label: 'Next Week', offset: 7 },
  ];

  const handlePreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(20, 0, 0, 0); // Default to 8 PM
    const local = toLocalInputValue(d.toISOString());
    const [date, time] = local.split('T');
    setDateValue(date);
    setTimeValue(time);
  };

  // Format selected date for display
  const formattedPreview =
    dateValue && timeValue
      ? new Date(`${dateValue}T${timeValue}`).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';

  return (
    <IonModal
      isOpen={open}
      onDidDismiss={onDismiss}
      style={{
        '--background': 'transparent',
      }}
    >
      <div
        onClick={onDismiss}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 20,
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            padding: 24,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: '#f9fafb',
                letterSpacing: -0.5,
              }}
            >
              {label}
            </h3>
            <button
              onClick={onDismiss}
              style={{
                border: 'none',
                background: 'rgba(148, 163, 184, 0.2)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
              }}
            >
              <IonIcon
                icon={closeOutline}
                style={{ fontSize: 20, color: '#9ca3af' }}
              />
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(52, 211, 153, 0.95)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Quick Select
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset.offset)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: 'rgba(52, 211, 153, 0.95)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(52, 211, 153, 0.5)';
                    e.currentTarget.style.background =
                      'rgba(52, 211, 153, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(52, 211, 153, 0.3)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Input */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(52, 211, 153, 0.95)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              <IonIcon icon={calendarOutline} style={{ fontSize: 16 }} />
              Date
            </label>
            <input
              type="date"
              value={dateValue}
              min={minDate}
              onChange={(e) => setDateValue(e.target.value)}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(52, 211, 153, 0.3)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#e5e7eb',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Time Input */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(52, 211, 153, 0.95)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              <IonIcon icon={timeOutline} style={{ fontSize: 16 }} />
              Time
            </label>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(52, 211, 153, 0.3)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#e5e7eb',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Preview */}
          {formattedPreview && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.08))',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(52, 211, 153, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Selected
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#e5e7eb',
                }}
              >
                {formattedPreview}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!dateValue || !timeValue}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid rgba(52, 211, 153, 0.5)',
                background: 'rgba(52, 211, 153, 0.95)',
                color: '#000000',
                fontSize: 15,
                fontWeight: 800,
                cursor: dateValue && timeValue ? 'pointer' : 'not-allowed',
                opacity: dateValue && timeValue ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <IonIcon icon={checkmarkOutline} style={{ fontSize: 20 }} />
              Confirm
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: 'rgba(248, 113, 113, 0.95)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={onDismiss}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </IonModal>
  );
}
