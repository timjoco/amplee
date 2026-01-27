import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, locationOutline } from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { StopTagData } from './StopTag';

type TourStop = {
  id: string;
  venue_name: string;
  venue_city: string | null;
  venue_state: string | null;
  date: string | null;
  status: string;
};

type StopPickerModalProps = {
  isOpen: boolean;
  tourId: string | undefined;
  onClose: () => void;
  onSelect: (stop: StopTagData) => void;
};

// Teal theme
const TEAL = {
  primary: '#14b8a6',
  light: '#2dd4bf',
  bg: 'rgba(20, 184, 166, 0.08)',
  bgActive: 'rgba(20, 184, 166, 0.15)',
  border: 'rgba(20, 184, 166, 0.25)',
};

export function TourChatStopPickerModal({
  isOpen,
  tourId,
  onClose,
  onSelect,
}: StopPickerModalProps) {
  const [stops, setStops] = useState<TourStop[]>([]);
  const [filteredStops, setFilteredStops] = useState<TourStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch stops when modal opens
  useEffect(() => {
    if (!isOpen || !tourId) {
      return;
    }

    let alive = true;

    const fetchStops = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('tour_stops')
        .select('id, venue_name, venue_city, venue_state, date, status')
        .eq('tour_id', tourId)
        .order('date', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('[stop picker fetch error]', error);
        setLoading(false);
        return;
      }

      setStops(data ?? []);
      setFilteredStops(data ?? []);
      setLoading(false);
    };

    void fetchStops();

    return () => {
      alive = false;
    };
  }, [isOpen, tourId]);

  // Filter stops based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStops(stops);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = stops.filter(
      (stop) =>
        stop.venue_name.toLowerCase().includes(query) ||
        stop.venue_city?.toLowerCase().includes(query) ||
        stop.venue_state?.toLowerCase().includes(query)
    );
    setFilteredStops(filtered);
  }, [searchQuery, stops]);

  const handleSelect = useCallback(
    (stop: TourStop) => {
      onSelect({
        id: stop.id,
        venueName: stop.venue_name,
        date: stop.date,
        city: stop.venue_city,
      });
      setSearchQuery('');
    },
    [onSelect]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      breakpoints={[0, 0.5, 0.75, 1]}
      initialBreakpoint={0.75}
      style={{
        '--background': '#0a0a0f',
      }}
    >
      <IonHeader>
        <IonToolbar
          style={{
            '--background': 'rgba(15, 15, 25, 0.98)',
            '--border-color': TEAL.border,
          }}
        >
          <IonButtons slot="start">
            <IonButton onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle
            style={{
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            Tag a Stop
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        style={{
          '--background': '#0a0a0f',
        }}
      >
        <div style={{ padding: '12px 16px 8px' }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
            placeholder="Search stops..."
            debounce={150}
            style={{
              '--background': TEAL.bg,
              '--border-radius': '12px',
              '--box-shadow': 'none',
              '--placeholder-color': 'rgba(156, 163, 175, 0.8)',
              '--icon-color': TEAL.primary,
            }}
          />
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              gap: 12,
            }}
          >
            <IonSpinner name="dots" color="primary" />
            <IonText color="medium">Loading stops...</IonText>
          </div>
        ) : filteredStops.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <IonIcon
              icon={locationOutline}
              style={{
                fontSize: 48,
                color: 'rgba(20, 184, 166, 0.4)',
                marginBottom: 16,
              }}
            />
            <IonText color="medium">
              {stops.length === 0
                ? 'No stops on this tour yet'
                : 'No stops match your search'}
            </IonText>
          </div>
        ) : (
          <IonList
            lines="none"
            style={{
              background: 'transparent',
              padding: '0 8px',
            }}
          >
            {filteredStops.map((stop) => (
              <IonItem
                key={stop.id}
                button
                onClick={() => handleSelect(stop)}
                style={{
                  '--background': 'transparent',
                  '--background-activated': TEAL.bgActive,
                  '--background-hover': TEAL.bg,
                  '--padding-start': '12px',
                  '--inner-padding-end': '12px',
                  '--min-height': '56px',
                  borderRadius: 12,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: TEAL.bg,
                    border: `1px solid ${TEAL.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={locationOutline}
                    style={{
                      fontSize: 18,
                      color: TEAL.primary,
                    }}
                  />
                </div>

                <IonLabel>
                  <h2
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#e5e7eb',
                      marginBottom: 2,
                    }}
                  >
                    {stop.venue_name}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(156, 163, 175, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {stop.date && (
                      <span style={{ color: TEAL.light, fontWeight: 500 }}>
                        {formatDate(stop.date)}
                      </span>
                    )}
                    {stop.venue_city && (
                      <>
                        {stop.date && <span style={{ opacity: 0.4 }}>•</span>}
                        <span>
                          {stop.venue_city}
                          {stop.venue_state && `, ${stop.venue_state}`}
                        </span>
                      </>
                    )}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
}
