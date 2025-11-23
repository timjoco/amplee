/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/react';
import {
  chevronForwardOutline,
  gridOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type BandLibraryTabProps = {
  bandId: string;
};

export default function BandLibraryTab({ bandId }: BandLibraryTabProps) {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [songCount, setSongCount] = React.useState<number | null>(null);
  const [setlistCount, setSetlistCount] = React.useState<number | null>(null);

  const handleOpenSetlists = React.useCallback(() => {
    if (!bandId) {
      console.warn('[BandLibraryTab] Missing bandId for setlists nav');
      return;
    }
    nav(`/bands/${bandId}/setlists`);
  }, [bandId, nav]);

  React.useEffect(() => {
    if (!bandId) return;

    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const [{ count: songs }, { count: sets }] = await Promise.all([
          supabase
            .from('songs')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId),
          supabase
            .from('setlist_templates')
            .select('id', { count: 'exact', head: true })
            .eq('band_id', bandId),
        ]);

        if (!alive) return;
        setSongCount(songs ?? 0);
        setSetlistCount(sets ?? 0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <IonSpinner />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <IonText color="light">
        <h2
          style={{
            margin: 0,
            marginBottom: 12,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 0.06,
            textTransform: 'uppercase',
          }}
        >
          Library
        </h2>
      </IonText>

      {/* Songs summary */}
      <IonCard
        button
        onClick={() => nav(`/bands/${bandId}/songs`)}
        style={{
          margin: 0,
          marginBottom: 14,
          borderRadius: 16,
          background:
            'linear-gradient(135deg, rgba(15,15,20,1), rgba(39,18,38,1))',
          border: '1px solid rgba(244,114,182,0.35)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
        }}
      >
        <IonCardContent
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(244,114,182,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IonIcon
              icon={musicalNotesOutline}
              style={{ fontSize: 22, color: 'rgba(244,114,182,0.95)' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#F9FAFB',
                }}
              >
                Songs
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: 'rgba(248,250,252,0.7)',
                }}
              >
                {songCount ?? 0} total
              </span>
            </div>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 13,
                color: 'rgba(209,213,219,0.9)',
              }}
            >
              Open your band&apos;s full song library.
            </p>
          </div>

          <IonIcon
            icon={chevronForwardOutline}
            style={{
              fontSize: 20,
              color: 'rgba(248,250,252,0.7)',
            }}
          />
        </IonCardContent>
      </IonCard>

      {/* Setlists summary – deep link into songs page, setlist tab */}
      <IonCard
        button
        onClick={handleOpenSetlists}
        style={{
          margin: 0,
          marginTop: 10,
          borderRadius: 16,
          background:
            'linear-gradient(135deg, rgba(15,15,20,1), rgba(20,24,35,1))',
          border: '1px solid rgba(148,163,184,0.35)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
        }}
      >
        <IonCardContent
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(148,163,184,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IonIcon
              icon={gridOutline}
              style={{ fontSize: 22, color: 'rgba(148,163,184,0.95)' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#F9FAFB',
                }}
              >
                Setlists
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: 'rgba(248,250,252,0.7)',
                }}
              >
                {setlistCount ?? 0} total
              </span>
            </div>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 13,
                color: 'rgba(209,213,219,0.9)',
              }}
            >
              Build and reuse setlists for your shows.
            </p>
          </div>

          <IonIcon
            icon={chevronForwardOutline}
            style={{
              fontSize: 20,
              color: 'rgba(248,250,252,0.7)',
            }}
          />
        </IonCardContent>
      </IonCard>
    </div>
  );
}
