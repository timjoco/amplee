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
  value?: string;
  min?: string;
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
              'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(17, 24, 39, 0.95))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: 24,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            boxSizing: 'border-box',
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
                background:
                  'linear-gradient(135deg, rgba(196, 181, 253, 0.95), rgba(167, 139, 250, 0.95))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: -0.5,
              }}
            >
              {label}
            </h3>
            <button
              onClick={onDismiss}
              style={{
                border: 'none',
                background: 'rgba(75, 85, 99, 0.3)',
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
                e.currentTarget.style.background = 'rgba(75, 85, 99, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(75, 85, 99, 0.3)';
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
                color: 'rgba(167, 139, 250, 0.9)',
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
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'rgba(196, 181, 253, 0.95)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.background =
                      'rgba(139, 92, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
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
                color: 'rgba(167, 139, 250, 0.9)',
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
                maxWidth: '100%', // Prevent overflow
                boxSizing: 'border-box', // Include padding/border in width
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#e5e7eb',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'inherit',
                WebkitAppearance: 'none', // Reset iOS styling
                appearance: 'none',
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
                color: 'rgba(167, 139, 250, 0.9)',
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
                maxWidth: '100%', // Prevent overflow
                boxSizing: 'border-box', // Include padding/border in width
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#e5e7eb',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'inherit',
                WebkitAppearance: 'none', // Reset iOS styling
                appearance: 'none',
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
                  'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.08))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(167, 139, 250, 0.8)',
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
                border: '1px solid rgba(139, 92, 246, 0.5)',
                background:
                  'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.95))',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 800,
                cursor: dateValue && timeValue ? 'pointer' : 'not-allowed',
                opacity: dateValue && timeValue ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow:
                  dateValue && timeValue
                    ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                if (dateValue && timeValue) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (dateValue && timeValue) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(139, 92, 246, 0.3)';
                }
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
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'rgba(248, 113, 113, 0.95)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'rgba(248, 113, 113, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
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
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.7)';
                  e.currentTarget.style.color = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                  e.currentTarget.style.color = '#9ca3af';
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
