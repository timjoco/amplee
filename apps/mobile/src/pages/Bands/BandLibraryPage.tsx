/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandLibraryTab from '../../components/Bands/BandLibraryTab';
import { supabase } from '../../lib/supabase';

export default function BandLibraryPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bandName, setBandName] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive || !bandId) return;

      // Get band info
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
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => navigate(`/bands/${bandId}`)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.15,
                }}
              >
                Library
              </h1>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#9ca3af',
                    marginTop: 4,
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
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonSpinner />
          </div>
        ) : (
          <BandLibraryTab bandId={bandId!} />
        )}
      </IonContent>
    </IonPage>
  );
}
