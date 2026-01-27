/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  clipboardOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandProposalsTabMobile from '../../components/Bands/BandProposalsTabMobile';
import { supabase } from '../../lib/supabase';

export default function BandProposalsPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bandName, setBandName] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive || !user || !bandId) return;

      // Get band info
      const { data: band } = await supabase
        .from('bands')
        .select('name')
        .eq('id', bandId)
        .maybeSingle();

      if (band) {
        setBandName(band.name);
      }

      // Check admin status
      const { data, error } = await supabase
        .from('band_members')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!alive) return;
      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
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
              onClick={() => navigate(`/bands/${bandId}`)}
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
                  icon={clipboardOutline}
                  style={{ color: '#f59e0b', fontSize: 20 }}
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
                  Proposals
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

            {/* Role Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 10,
                background: isAdmin
                  ? 'rgba(245, 158, 11, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  isAdmin ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                }`,
              }}
            >
              <IonIcon
                icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                style={{
                  fontSize: 14,
                  color: isAdmin ? '#f59e0b' : '#6b7280',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isAdmin ? '#f59e0b' : '#6b7280',
                }}
              >
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
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
          <div style={{ padding: '8px 16px 0' }}>
            <BandProposalsTabMobile bandId={bandId!} isAdmin={isAdmin} />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
