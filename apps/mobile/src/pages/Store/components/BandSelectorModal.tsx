import { IonIcon, IonSpinner } from '@ionic/react';
import {
  checkmarkOutline,
  closeOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { getAvatarUrl } from '../../../lib/cache/avatarUrlCache';
import { supabase } from '../../../lib/supabase';

// Premium purple/violet theme
const PREMIUM = {
  primary: '#8b5cf6',
  light: '#a78bfa',
  subtle: 'rgba(139, 92, 246, 0.08)',
  border: 'rgba(139, 92, 246, 0.25)',
};

const glassCard = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
};

type Band = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
};

type BandSelectorModalProps = {
  title: string;
  subtitle?: string;
  excludeBandIds?: string[];
  onSelect: (band: Band) => void;
  onClose: () => void;
  requireAdmin?: boolean;
};

export function BandSelectorModal({
  title,
  subtitle,
  excludeBandIds = [],
  onSelect,
  onClose,
  requireAdmin = true,
}: BandSelectorModalProps) {
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  // Load user's bands
  useEffect(() => {
    let alive = true;

    const loadBands = async () => {
      setLoading(true);

      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          setBands([]);
          return;
        }

        const { data, error } = await supabase
          .from('band_members')
          .select('role, bands(id, name, avatar_url)')
          .eq('user_id', userId);

        if (!alive) return;

        if (error) {
          console.error('[BandSelectorModal] error', error);
          setBands([]);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bandsData = (data || []).map((row: any) => {
          const b = Array.isArray(row.bands) ? row.bands[0] : row.bands;
          return {
            id: b?.id,
            name: b?.name || '',
            avatar_url: b?.avatar_url || null,
            role: row.role as 'admin' | 'member',
          };
        }).filter((b) => b.id);

        // Filter based on requirements
        let filteredBands = bandsData;
        if (requireAdmin) {
          filteredBands = filteredBands.filter((b) => b.role === 'admin');
        }
        if (excludeBandIds.length > 0) {
          filteredBands = filteredBands.filter((b) => !excludeBandIds.includes(b.id));
        }

        setBands(filteredBands);

        // Load avatar URLs
        const urlMap: Record<string, string> = {};
        await Promise.all(
          filteredBands.map(async (band) => {
            if (band.avatar_url) {
              try {
                const url = await getAvatarUrl('band-avatars', band.avatar_url);
                if (url) urlMap[band.id] = url;
              } catch (e) {
                console.warn('[BandSelectorModal] avatar error', e);
              }
            }
          })
        );

        if (alive) setAvatarUrls(urlMap);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void loadBands();

    return () => {
      alive = false;
    };
  }, [excludeBandIds, requireAdmin]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          ...glassCard,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 18, 0.98) 100%)',
          border: `1px solid ${PREMIUM.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: 20,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#9ca3af' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Band List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
              }}
            >
              <IonSpinner style={{ '--color': PREMIUM.light }} />
            </div>
          ) : bands.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 32,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{ fontSize: 24, color: '#6b7280' }}
                />
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                {requireAdmin
                  ? 'You need to be a band admin to start a trial or subscription.'
                  : 'No bands available.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bands.map((band) => (
                <button
                  key={band.id}
                  onClick={() => onSelect(band)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'left',
                    color: 'inherit',
                    transition: 'all 150ms ease',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: avatarUrls[band.id]
                        ? 'transparent'
                        : `linear-gradient(135deg, ${PREMIUM.primary} 0%, ${PREMIUM.light} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {avatarUrls[band.id] ? (
                      <img
                        src={avatarUrls[band.id]}
                        alt={band.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      band.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Name + Role */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#f9fafb',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {band.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {band.role === 'admin' ? 'Admin' : 'Member'}
                    </div>
                  </div>

                  {/* Select indicator */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: PREMIUM.subtle,
                      border: `1px solid ${PREMIUM.border}`,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <IonIcon
                      icon={checkmarkOutline}
                      style={{ fontSize: 16, color: PREMIUM.light }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
