/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  gridOutline,
} from 'ionicons/icons';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type TemplateRow = {
  id: string;
  name: string;
  created_at: string | null;
};

type RouteParams = {
  bandId: string;
};

// this is the list of setlists, each one is clickable and takes us to the SetlistTemplateEditorMobile.tsx
export default function BandSetlistPageMobile() {
  const nav = useNavigate();
  const { bandId } = useParams<RouteParams>();

  const [loading, setLoading] = React.useState(true);
  const [templates, setTemplates] = React.useState<TemplateRow[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    if (!bandId) return;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('setlist_templates')
          .select('id,name,created_at')
          .eq('band_id', bandId)
          .order('created_at', { ascending: false });

        if (!alive) return;

        if (error) {
          console.error('[BandSetlistsPageMobile] load error', error);
          setTemplates([]);
        } else {
          setTemplates((data || []) as TemplateRow[]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const handleCreateSetlist = async () => {
    if (!bandId || creating) return;
    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('setlist_templates')
        .insert({
          band_id: bandId,
          name: 'New Setlist',
        } as any)
        .select('id')
        .single();

      if (error) {
        console.error('[BandSetlistsPageMobile] create setlist error', error);
        return;
      }

      const id = (data as any)?.id as string;
      if (id) {
        nav(`/bands/${bandId}/setlists/${id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const renderBody = () => {
    if (loading && templates.length === 0) {
      return (
        <div
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IonSpinner name="dots" />
          <IonText color="medium">
            <p style={{ margin: 0 }}>Loading setlists…</p>
          </IonText>
        </div>
      );
    }

    if (!loading && templates.length === 0) {
      return (
        <div
          style={{
            padding: 16,
            paddingTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'radial-gradient(circle, rgba(244,114,182,0.22) 0%, rgba(15,23,42,1) 55%)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.9)',
              border: '2px solid rgba(244,114,182,0.45)',
            }}
          >
            <IonIcon
              icon={gridOutline}
              style={{ fontSize: 30, color: 'rgba(244,114,182,0.96)' }}
            />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: '#e5e7eb',
              letterSpacing: -0.2,
            }}
          >
            No setlists yet
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#9ca3af',
              maxWidth: 280,
              lineHeight: 1.5,
            }}
          >
            Create a pink-tinged setlist and drag songs into the perfect order
            for your show.
          </p>

          <IonButton
            onClick={handleCreateSetlist}
            disabled={creating}
            style={
              {
                marginTop: 10,
                '--background': 'rgba(244,114,182,0.96)',
                '--background-activated': 'rgba(236,72,153,1)',
                '--color': '#000000',
                '--border-radius': '999px',
                paddingInline: 22,
                fontWeight: 800,
              } as any
            }
          >
            <IonIcon icon={addOutline} slot="start" />
            {creating ? 'Creating…' : 'New setlist'}
          </IonButton>
        </div>
      );
    }

    return (
      <div
        style={{
          padding: 16,
          paddingBottom: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {templates.map((t) => {
          const created = t.created_at
            ? new Date(t.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            : null;

          const isDeleting = deletingId === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => nav(`/bands/${bandId}/setlists/${t.id}`)}
              style={{
                border: 'none',
                padding: 0,
                margin: 0,
                background: 'transparent',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  borderRadius: 18,
                  padding: 14,
                  width: '100%',
                  background:
                    'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(24,24,38,0.96))',
                  boxShadow: '0 14px 32px rgba(0,0,0,0.75)',
                  border: '1px solid rgba(244,114,182,0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Top row: icon, name, chevron */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    columnGap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background:
                        'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(15,23,42,0.9))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid rgba(244,114,182,0.6)',
                    }}
                  >
                    <IonIcon
                      icon={gridOutline}
                      style={{
                        fontSize: 22,
                        color: 'rgba(244,114,182,0.96)',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#F9FAFB',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={t.name}
                    >
                      {t.name}
                    </span>
                    {created && (
                      <span
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: '#9ca3af',
                        }}
                      >
                        Created {created}
                      </span>
                    )}
                  </div>

                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{
                      fontSize: 20,
                      color: 'rgba(244,114,182,0.85)',
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IonButton
            onClick={handleCreateSetlist}
            disabled={creating}
            fill="outline"
            size="small"
            style={
              {
                '--color': 'rgba(244,114,182,0.96)',
                '--border-color': 'rgba(244,114,182,0.96)',
                '--background-activated': 'rgba(244,114,182,0.12)',
                '--border-color-activated': 'rgba(244,114,182,1)',
                '--color-activated': '#F9FAFB',
                borderRadius: 999,
                fontWeight: 700,
              } as any
            }
          >
            <IonIcon icon={addOutline} slot="start" />
            {creating ? 'Creating…' : 'New setlist'}
          </IonButton>
        </div>
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
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
              paddingInline: 12,
              paddingBlock: 6,
              gap: 10,
            }}
          >
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </IonButton>

            <IonTitle
              style={{
                color: '#F9FAFB',
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: 0.25,
                paddingInline: 0,
              }}
            >
              Setlists
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background':
            'linear-gradient(180deg, #050509 0%, #020109 55%, #050509 100%)',
        }}
      >
        {renderBody()}
      </IonContent>
    </IonPage>
  );
}
