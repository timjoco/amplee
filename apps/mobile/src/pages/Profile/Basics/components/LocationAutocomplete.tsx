import { IonSpinner } from '@ionic/react';
import * as React from 'react';

import { fetchLocationsFromApi } from '../utils';

type Props = {
  value: string;
  editable: boolean;
  onChange: (next: string) => void;
};

export function LocationAutocomplete({ value, editable, onChange }: Props) {
  const [query, setQuery] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const debounceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value ?? '';
    setQuery(next);
    onChange(next);

    if (!editable) return;

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      if (!next.trim()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      const results = await fetchLocationsFromApi(next);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 250);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <input
        type="text"
        value={query}
        placeholder="City, State"
        readOnly={!editable}
        onChange={handleChange}
        onFocus={() => {
          if (editable && suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        style={{
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
        }}
      />

      {editable && open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            marginTop: 4,
            borderRadius: 14,
            background:
              'linear-gradient(145deg, rgba(20,15,25,0.98) 0%, rgba(12,8,18,0.98) 100%)',
            border: '1px solid rgba(168,85,247,0.2)',
            boxShadow:
              '0 12px 28px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,0.1)',
            zIndex: 50,
            maxHeight: 220,
            overflowY: 'auto',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelect(s)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  i < suggestions.length - 1
                    ? '1px solid rgba(148,163,184,0.08)'
                    : 'none',
                color: '#e5e7eb',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {s}
            </button>
          ))}
          {loading && (
            <div
              style={{
                padding: '12px 16px',
                fontSize: 13,
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IonSpinner
                name="crescent"
                style={{ width: 14, height: 14, color: '#a855f7' }}
              />
              Searching…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
