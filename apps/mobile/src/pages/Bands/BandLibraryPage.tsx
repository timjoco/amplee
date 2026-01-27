/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, libraryOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandLibraryTab from '../../components/Bands/BandLibraryTab';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Theme Colors (Pink/Magenta for Library)
// ─────────────────────────────────────────────────────────────

const PINK = {
  primary: '#ec4899',
  light: '#f472b6',
  subtle: 'rgba(236, 72, 153, 0.08)',
  border: 'rgba(236, 72, 153, 0.25)',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function BandLibraryPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bandName, setBandName] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive || !bandId) return;

      const { data: band } = await supabase
        .from('bands')
        .select('name')
        .eq('id', bandId)
        .maybeSingle();

      if (band) {
        setBandName(band.name);
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title Section */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={libraryOutline}
                  style={{ color: PINK.light, fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Library
                </h1>
              </div>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    marginTop: 2,
                    marginLeft: 28,
                  }}
                >
                  {bandName}
                </div>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <IonSpinner
                style={{
                  '--color': PINK.primary,
                  width: 32,
                  height: 32,
                }}
              />
              <div
                style={{
                  color: '#6b7280',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Loading library...
              </div>
            </div>
          </div>
        ) : (
          <BandLibraryTab bandId={bandId!} />
        )}
      </IonContent>
    </IonPage>
  );
}
