import { IonIcon } from '@ionic/react';
import { locationOutline, personOutline } from 'ionicons/icons';

import { LocationAutocomplete } from './LocationAutocomplete';

type Props = {
  displayName: string;
  firstName: string;
  lastName: string;
  location: string;
  onDisplayNameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onLocationChange: (value: string) => void;
};

export function PersonalInfoCard({
  displayName,
  firstName,
  lastName,
  location,
  onDisplayNameChange,
  onFirstNameChange,
  onLastNameChange,
  onLocationChange,
}: Props) {
  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    color: '#e5e7eb',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '20px 24px',
        marginTop: 12,
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 16,
        }}
      >
        <IonIcon icon={personOutline} style={{ fontSize: 14 }} />
        <span>Personal Info</span>
      </div>

      {/* Display name */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Display name</label>
        <input
          type="text"
          value={displayName}
          placeholder="How you appear to your band"
          onChange={(e) => onDisplayNameChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* First & Last name row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={labelStyle}>First name</label>
          <input
            type="text"
            value={firstName}
            placeholder="First"
            onChange={(e) => onFirstNameChange(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Last name</label>
          <input
            type="text"
            value={lastName}
            placeholder="Last"
            onChange={(e) => onLastNameChange(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 6,
          }}
        >
          <IonIcon icon={locationOutline} style={{ fontSize: 12 }} />
          Location
        </label>
        <LocationAutocomplete
          value={location}
          onChange={onLocationChange}
          editable={true}
        />
      </div>
    </div>
  );
}
