/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner } from '@ionic/react';
import { locationOutline, closeCircleOutline } from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TEAL } from '../lib/styles';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Generate a UUID for session token (Mapbox bills by session, not request)
const generateSessionToken = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Final result returned to parent
export type AddressSuggestion = {
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

// Suggestion from Search Box API (before retrieval)
type SearchSuggestion = {
  mapbox_id: string;
  name: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  feature_type: string;
  context?: {
    place?: { name: string };
    region?: { name: string; region_code?: string };
    country?: { name: string; country_code?: string };
    postcode?: { name: string };
  };
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a venue or address...',
  label,
  disabled,
}: Props) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<string>(generateSessionToken());

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Box API - Step 1: Get suggestions
  const searchSuggestions = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        access_token: MAPBOX_TOKEN,
        session_token: sessionTokenRef.current,
        types: 'poi,address',
        limit: '8',
      });

      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`
      );

      if (!response.ok) {
        console.error('[AddressAutocomplete] Suggest failed:', response.status);
        setSuggestions([]);
        return;
      }

      const data = await response.json();
      const results: SearchSuggestion[] = (data.suggestions || []).map((s: any) => ({
        mapbox_id: s.mapbox_id,
        name: s.name,
        address: s.address,
        full_address: s.full_address,
        place_formatted: s.place_formatted,
        feature_type: s.feature_type,
        context: s.context,
      }));

      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('[AddressAutocomplete] Error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search Box API - Step 2: Retrieve full details when user selects
  const retrieveDetails = useCallback(async (suggestion: SearchSuggestion) => {
    if (!MAPBOX_TOKEN) return null;

    setIsRetrieving(true);
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        session_token: sessionTokenRef.current,
      });

      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?${params}`
      );

      if (!response.ok) {
        console.error('[AddressAutocomplete] Retrieve failed:', response.status);
        return null;
      }

      const data = await response.json();
      const feature = data.features?.[0];

      if (!feature) return null;

      const [lng, lat] = feature.geometry?.coordinates || [0, 0];
      const props = feature.properties || {};
      const context = props.context || {};

      const isPoi = props.feature_type === 'poi';

      // Generate new session token for next search session
      sessionTokenRef.current = generateSessionToken();

      return {
        id: suggestion.mapbox_id,
        placeName: props.name || suggestion.name,
        address: props.address || suggestion.address || '',
        fullAddress: props.full_address || suggestion.full_address || '',
        city: context.place?.name || '',
        state: context.region?.region_code || context.region?.name || '',
        country: context.country?.country_code || context.country?.name || '',
        postalCode: context.postcode?.name || '',
        lat,
        lng,
        isPoi,
      } as AddressSuggestion;
    } catch (error) {
      console.error('[AddressAutocomplete] Retrieve error:', error);
      return null;
    } finally {
      setIsRetrieving(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Debounce the search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        searchSuggestions(newValue);
      }, 300);
    },
    [onChange, searchSuggestions]
  );

  const handleSelect = useCallback(
    async (suggestion: SearchSuggestion) => {
      // Show loading state
      setShowDropdown(false);
      setSuggestions([]);

      // Retrieve full details with coordinates
      const fullDetails = await retrieveDetails(suggestion);

      if (fullDetails) {
        onChange(fullDetails.isPoi ? fullDetails.placeName : fullDetails.address);
        onSelect(fullDetails);
      } else {
        // Fallback if retrieve fails
        onChange(suggestion.name);
      }
    },
    [onChange, onSelect, retrieveDetails]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          break;
      }
    },
    [showDropdown, suggestions, selectedIndex, handleSelect]
  );

  const handleClear = useCallback(() => {
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
  }, [onChange]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#9ca3af',
            marginBottom: 8,
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          {isLoading || isRetrieving ? (
            <IonSpinner style={{ '--color': TEAL.light, width: 16, height: 16 }} />
          ) : (
            <IonIcon icon={locationOutline} style={{ fontSize: 18, color: '#6b7280' }} />
          )}
        </div>

        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled || isRetrieving}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{
            width: '100%',
            padding: '12px 36px 12px 40px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${showDropdown ? TEAL.border : 'rgba(255, 255, 255, 0.1)'}`,
            color: '#f9fafb',
            fontSize: 15,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />

        {value && !isRetrieving && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
            }}
          >
            <IonIcon icon={closeCircleOutline} style={{ fontSize: 18, color: '#6b7280' }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'rgba(15, 15, 20, 0.98)',
            border: `1px solid ${TEAL.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.mapbox_id}
              type="button"
              tabIndex={-1}
              onClick={() => handleSelect(suggestion)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: index === selectedIndex ? TEAL.subtle : 'transparent',
                border: 'none',
                borderBottom:
                  index < suggestions.length - 1
                    ? '1px solid rgba(255, 255, 255, 0.06)'
                    : 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#f9fafb',
                  marginBottom: 2,
                }}
              >
                {suggestion.name}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {suggestion.full_address || suggestion.place_formatted || suggestion.address || ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
