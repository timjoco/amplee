/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, locationOutline } from 'ionicons/icons';
import { useState } from 'react';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { glassCard, TEAL } from '../lib/styles';

type AddressSuggestion = {
  id: string;
  placeName: string;
  address: string;
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  lat: number;
  lng: number;
  isPoi: boolean;
};

type Props = {
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    venue_name: string;
    venue_city?: string;
    venue_state?: string;
    venue_address?: string;
    venue_lat?: number;
    venue_lng?: number;
  }) => Promise<void>;
  saving: boolean;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#f9fafb',
  fontSize: 15,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: 8,
};

export function AddStopModal({ onClose, onSubmit, saving }: Props) {
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState('');

  const handleAddressSearchChange = (value: string) => {
    setAddressSearch(value);
    // Clear selection when user types something different
    if (selectedAddress && value !== selectedAddress.address && value !== selectedAddress.placeName) {
      setSelectedAddress(null);
    }
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion);
    // Show the address in the search box
    setAddressSearch(suggestion.address || suggestion.placeName);

    // If it's a POI (venue), auto-fill the venue name too
    if (suggestion.isPoi && suggestion.placeName) {
      setVenueName(suggestion.placeName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Please select a date');
      return;
    }
    if (!venueName.trim()) {
      setError('Please enter a venue name');
      return;
    }

    setError('');

    if (selectedAddress) {
      await onSubmit({
        date,
        venue_name: venueName.trim(),
        venue_city: selectedAddress.city || undefined,
        venue_state: selectedAddress.state || undefined,
        venue_address: selectedAddress.address || undefined,
        venue_lat: selectedAddress.lat,
        venue_lng: selectedAddress.lng,
      });
    } else {
      // No address selected, just submit with venue name
      await onSubmit({
        date,
        venue_name: venueName.trim(),
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          ...glassCard,
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          padding: 0,
          overflow: 'visible',
          border: `1px solid ${TEAL.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: TEAL.subtle,
                border: `1px solid ${TEAL.border}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IonIcon
                icon={locationOutline}
                style={{ fontSize: 18, color: TEAL.light }}
              />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Add Stop
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Venue Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Venue Name *</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g., The Fillmore, RecordBar"
              disabled={saving}
              style={inputStyle}
            />
          </div>

          {/* Address Search with Autocomplete */}
          <div style={{ marginBottom: 16 }}>
            <AddressAutocomplete
              value={addressSearch}
              onChange={handleAddressSearchChange}
              onSelect={handleAddressSelect}
              label="Address"
              placeholder="Search venue name or address..."
              disabled={saving}
            />
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6, marginBottom: 0 }}>
              Search by venue name or street address to get coordinates
            </p>
          </div>

          {/* Selected address info */}
          {selectedAddress && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: TEAL.subtle,
                border: `1px solid ${TEAL.border}`,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: TEAL.light,
                  marginBottom: 4,
                }}
              >
                {selectedAddress.isPoi ? 'Venue Found' : 'Address Selected'}
              </div>
              <div style={{ fontSize: 14, color: '#f9fafb' }}>
                {selectedAddress.address}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {[selectedAddress.city, selectedAddress.state, selectedAddress.country]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
                opacity: saving ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !date || !venueName.trim()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                background: TEAL.primary,
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: `0 4px 14px ${TEAL.glow}`,
                opacity: saving || !date || !venueName.trim() ? 0.6 : 1,
              }}
            >
              {saving ? (
                <>
                  <IonSpinner style={{ '--color': '#fff', width: 16, height: 16 }} />
                  Adding...
                </>
              ) : (
                'Add Stop'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
