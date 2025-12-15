import { IonSpinner, IonToggle } from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import EventDateTimePicker from '../../../../components/ui/EventDateTimePicker';
import type { EventRow, EventType } from '../types';
import { EVENT_TYPE_OPTIONS } from '../types';
import { fromLocalToIso, toLocalInputValue } from '../utils';

export type EventDetailsUpdates = {
  title: string | null;
  location: string | null;
  type: EventType;
  starts_at: string | null;
  ends_at: string | null;
};

export type SettingsEventDetailsCardProps = {
  event: EventRow;
  isAdmin: boolean;
  savingEvent: boolean;
  savingPublic: boolean;
  onSave: (updates: EventDetailsUpdates) => Promise<void> | void;
  onTogglePublic: (next: boolean) => Promise<void> | void;
};

function formatDateTimeLabelFromLocal(local: string) {
  if (!local) return 'Tap to choose date & time';
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return 'Tap to choose date & time';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function SettingsEventDetailsCard({
  event,
  isAdmin,
  savingEvent,
  savingPublic,
  onSave,
  onTogglePublic,
}: SettingsEventDetailsCardProps) {
  // Draft state (Option B)
  const [title, setTitle] = useState(event.title ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [type, setType] = useState<EventType>(
    (event.type as EventType) ?? 'show'
  );
  const [start, setStart] = useState(toLocalInputValue(event.starts_at));
  const [end, setEnd] = useState(toLocalInputValue(event.ends_at));

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Reset draft when event changes
  useEffect(() => {
    setTitle(event.title ?? '');
    setLocation(event.location ?? '');
    setType((event.type as EventType) ?? 'show');
    setStart(toLocalInputValue(event.starts_at));
    setEnd(toLocalInputValue(event.ends_at));
  }, [
    event.id,
    event.title,
    event.location,
    event.type,
    event.starts_at,
    event.ends_at,
  ]);

  const inputStyle = useMemo(
    () => ({
      width: '100%',
      borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.2)',
      padding: '12px 14px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      color: '#e5e7eb',
      fontSize: 14,
      outline: 'none',
    }),
    []
  );

  const labelStyle = useMemo(
    () => ({
      margin: 0,
      fontSize: 11,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      color: '#6b7280',
      fontWeight: 600,
      marginBottom: 8,
    }),
    []
  );

  const handleSave = async () => {
    await onSave({
      title: title.trim() ? title.trim() : null,
      location: location.trim() ? location.trim() : null,
      type,
      starts_at: fromLocalToIso(start),
      ends_at: fromLocalToIso(end),
    });
  };

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.04) 100%)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: '#34d399',
          }}
        >
          Event details
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
          Edit the core info for this event
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div>
          <p style={labelStyle}>Title</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div>
          <p style={labelStyle}>Location</p>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Venue / location"
            style={inputStyle}
          />
        </div>

        {/* Type */}
        <div>
          <p style={labelStyle}>Type</p>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
            style={{ ...inputStyle, appearance: 'none' as const }}
          >
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start */}
        <div>
          <p style={labelStyle}>Start</p>
          <button
            type="button"
            onClick={() => setShowStartPicker(true)}
            style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer' }}
          >
            {formatDateTimeLabelFromLocal(start)}
          </button>
        </div>

        {/* End */}
        <div>
          <p style={labelStyle}>End (optional)</p>
          <button
            type="button"
            onClick={() => setShowEndPicker(true)}
            style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer' }}
          >
            {end
              ? formatDateTimeLabelFromLocal(end)
              : 'Tap to set an end time (optional)'}
          </button>
        </div>

        <EventDateTimePicker
          open={showStartPicker}
          label="Pick start date & time"
          value={start ? new Date(start).toISOString() : undefined}
          onChange={(iso) => setStart(iso ? toLocalInputValue(iso) : '')}
          onDismiss={() => setShowStartPicker(false)}
        />

        <EventDateTimePicker
          open={showEndPicker}
          label="Pick end time (optional)"
          value={end ? new Date(end).toISOString() : undefined}
          min={start ? new Date(start).toISOString() : undefined}
          onChange={(iso) => setEnd(iso ? toLocalInputValue(iso) : '')}
          onDismiss={() => setShowEndPicker(false)}
        />

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={savingEvent}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: '1px solid rgba(52,211,153,0.4)',
            background: savingEvent
              ? 'rgba(52,211,153,0.1)'
              : 'linear-gradient(135deg, rgba(52,211,153,0.9) 0%, rgba(16,185,129,0.9) 100%)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: savingEvent ? 'not-allowed' : 'pointer',
            opacity: savingEvent ? 0.7 : 1,
            boxShadow: savingEvent ? 'none' : '0 4px 14px rgba(52,211,153,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {savingEvent ? (
            <>
              <IonSpinner name="crescent" style={{ width: 18, height: 18 }} />{' '}
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>

        {/* Public toggle */}
        {isAdmin && (
          <div
            style={{
              marginTop: 4,
              paddingTop: 16,
              borderTop: '1px solid rgba(148,163,184,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ ...labelStyle, marginBottom: 0 }}>Public listing</p>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                Show on your public band page
              </p>
            </div>
            <IonToggle
              checked={!!event.is_public}
              color="success"
              disabled={savingPublic}
              onIonChange={(e) => onTogglePublic(!!e.detail.checked)}
              style={{ transform: 'scale(0.9)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
