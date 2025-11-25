/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonIcon,
  IonModal,
  IonSpinner,
  IonText,
} from '@ionic/react';
import {
  chevronForwardOutline,
  gridOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabase';

type SetlistRow = {
  id: string;
  event_id: string;
  song_id: string | null;
  title: string;
  musical_key: string | null;
  bpm: number | null;
  notes: string | null;
  order_index: number;
};

type Template = {
  id: string;
  name: string;
};

type Song = {
  id: string;
  title: string;
};

type EventSetlistTabMobileProps = {
  eventId: string;
  bandId: string;
  isAdmin: boolean;
  onSummaryChange?: (summary: { songCount: number }) => void;
};

export default function EventSetlistTabMobile({
  eventId,
  bandId,
  isAdmin,
  onSummaryChange,
}: EventSetlistTabMobileProps) {
  const navigate = useNavigate();

  const [rows, setRows] = useState<SetlistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(
    null
  );

  // songs for this band (to resolve song_id by title if needed)
  const [songs, setSongs] = useState<Song[]>([]);

  // 🔹 Push summary up only when song count changes (ignore callback identity)
  useEffect(() => {
    if (!onSummaryChange) return;
    onSummaryChange({ songCount: rows.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  // ---- Load event setlist ----
  useEffect(() => {
    let alive = true;

    if (!eventId) {
      console.error('EventSetlistTabMobile: eventId is required');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);

      // Load event setlist items
      const { data, error } = await supabase
        .from('event_setlist_items')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('[EventSetlistTabMobile] load error', error);
        setRows([]);
      } else {
        setRows((data || []) as SetlistRow[]);
      }

      // Load event to get the saved template_id
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('setlist_template_id')
        .eq('id', eventId)
        .single();

      if (!alive) return;

      if (eventErr) {
        console.error('[EventSetlistTabMobile] load event error', eventErr);
      } else if (eventData?.setlist_template_id) {
        setActiveTemplateId(eventData.setlist_template_id);

        // Fetch the template name
        const { data: templateData, error: templateErr } = await supabase
          .from('setlist_templates')
          .select('name')
          .eq('id', eventData.setlist_template_id)
          .single();

        if (!alive) return;

        if (templateErr) {
          console.error(
            '[EventSetlistTabMobile] load template name error',
            templateErr
          );
        } else if (templateData) {
          setActiveTemplateName(templateData.name);
        }
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  // ---- Load songs for band (for title → song_id fallback) ----
  useEffect(() => {
    if (!bandId) return;
    let alive = true;

    (async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('id,title')
        .eq('band_id', bandId)
        .order('title', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('[EventSetlistTabMobile] load songs error', error);
        setSongs([]);
      } else {
        setSongs((data || []) as Song[]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const songIdByTitle = useMemo(() => {
    const map = new Map<string, string>();
    songs.forEach((s) => {
      const key = s.title.trim().toLowerCase();
      if (!map.has(key)) map.set(key, s.id);
    });
    return map;
  }, [songs]);

  // ---- Load templates (lazy) ----
  const ensureTemplatesLoaded = useCallback(async () => {
    if (!bandId) {
      console.warn('[EventSetlistTabMobile] no bandId when loading templates');
      return;
    }

    if (templates.length > 0) {
      setTemplatesOpen(true);
      return;
    }

    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('setlist_templates')
        .select('id,name')
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[EventSetlistTabMobile] load templates error', error);
        setTemplates([]);
      } else {
        setTemplates((data || []) as Template[]);
      }

      setTemplatesOpen(true);
    } finally {
      setLoadingTemplates(false);
    }
  }, [bandId, templates.length]);

  // ---- Apply template to this event (replace existing setlist) ----
  const applyTemplate = useCallback(
    async (templateId: string) => {
      if (!eventId || !templateId || applyingTemplate) return;
      setApplyingTemplate(true);

      try {
        const { data: tItems, error: tErr } = await supabase
          .from('setlist_template_items')
          .select('*')
          .eq('template_id', templateId)
          .order('order_index', { ascending: true });

        if (tErr) {
          console.error(
            '[EventSetlistTabMobile] fetch template items error',
            tErr
          );
          return;
        }

        const items = (tItems || []) as any[];

        const { error: delErr } = await supabase
          .from('event_setlist_items')
          .delete()
          .eq('event_id', eventId);

        if (delErr) {
          console.error(
            '[EventSetlistTabMobile] clear event setlist error',
            delErr
          );
          return;
        }

        const inserts = items.map((it, i) => ({
          event_id: eventId,
          song_id: it.song_id ?? null,
          title: it.title,
          musical_key: it.musical_key ?? null,
          bpm: it.bpm ?? null,
          notes: it.notes ?? null,
          order_index: i,
        }));

        const { data: newRows, error: insErr } = await supabase
          .from('event_setlist_items')
          .insert(inserts)
          .select('*')
          .order('order_index', { ascending: true });

        if (insErr) {
          console.error(
            '[EventSetlistTabMobile] apply template insert error',
            insErr
          );
          return;
        }

        // Persist the template on the event so it survives navigation
        const { error: updateErr } = await supabase
          .from('events')
          .update({ setlist_template_id: templateId })
          .eq('id', eventId);

        if (updateErr) {
          console.error(
            '[EventSetlistTabMobile] update event template_id error',
            updateErr
          );
        }

        setRows((newRows || []) as SetlistRow[]);
        setTemplatesOpen(false);
        setActiveTemplateId(templateId);

        const tpl = templates.find((t) => t.id === templateId) || null;
        setActiveTemplateName(tpl?.name ?? null);
      } finally {
        setApplyingTemplate(false);
      }
    },
    [eventId, applyingTemplate, templates]
  );

  const hasSongs = rows.length > 0;
  const hasBandSongs = songs.length > 0;

  const headerSetlistName =
    activeTemplateName || (hasSongs ? 'Custom setlist' : 'No setlist loaded');

  if (loading && rows.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '16px 16px 80px 16px',
        }}
      >
        <IonSpinner name="crescent" style={{ color: '#9ca3af' }} />
        <IonText>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: 15 }}>
            Loading setlist…
          </p>
        </IonText>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px 16px 80px 16px',
      }}
    >
      {/* Setlist content */}
      {rows.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '32px 20px 40px',
            textAlign: 'center',
            gap: 16,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, rgba(244, 114, 182, 0.15), rgba(244, 114, 182, 0.05))',
              border: '2px solid rgba(244, 114, 182, 0.3)',
              marginBottom: 8,
            }}
          >
            <IonIcon
              icon={musicalNotesOutline}
              style={{ fontSize: 36, color: 'rgba(244, 114, 182, 0.95)' }}
            />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: '#e5e7eb',
              letterSpacing: -0.5,
            }}
          >
            No Songs Yet
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: '#9ca3af',
              lineHeight: 1.6,
              maxWidth: 280,
            }}
          >
            {isAdmin
              ? 'Create or load a setlist to get started.'
              : 'Your band admin will add songs for this event.'}
          </p>

          {isAdmin && (
            <>
              {hasBandSongs ? (
                <IonButton
                  expand="block"
                  onClick={ensureTemplatesLoaded}
                  disabled={loadingTemplates || applyingTemplate}
                  style={
                    {
                      marginTop: 12,
                      '--background': 'rgba(15, 23, 42, 0.8)',
                      '--background-hover': 'rgba(15, 23, 42, 0.95)',
                      '--background-activated': 'rgba(15, 23, 42, 1)',
                      '--color': '#9ca3af',
                      '--border-radius': '12px',
                      '--padding-top': '12px',
                      '--padding-bottom': '12px',
                      fontSize: 14,
                      fontWeight: 700,
                      textTransform: 'none',
                      letterSpacing: 0.3,
                    } as any
                  }
                >
                  <IonIcon icon={gridOutline} slot="start" />
                  {applyingTemplate
                    ? 'Applying…'
                    : loadingTemplates
                    ? 'Loading…'
                    : 'Load setlist'}
                </IonButton>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/bands/${bandId}`);
                    window.dispatchEvent(
                      new CustomEvent('amplee:band-tab', {
                        detail: { tab: 'library' },
                      })
                    );
                  }}
                  style={{
                    marginTop: 8,
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid rgba(244, 114, 182, 0.5)',
                    background: 'rgba(244, 114, 182, 0.95)',
                    color: '#000000',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  <IonIcon
                    icon={gridOutline}
                    style={{ fontSize: 18, pointerEvents: 'none' }}
                  />
                  Go to Library
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Header stats bar with setlist name */}
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.6))',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (activeTemplateId) {
                    navigate(`/bands/${bandId}/setlists/${activeTemplateId}`);
                  }
                }}
                disabled={!activeTemplateId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: activeTemplateId ? 'pointer' : 'default',
                  textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{
                    fontSize: 18,
                    color: '#9ca3af',
                    flexShrink: 0,
                    pointerEvents: 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  {headerSetlistName}
                </span>
                {activeTemplateId && (
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{
                      fontSize: 16,
                      color: 'rgba(244, 114, 182, 0.8)',
                      flexShrink: 0,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: 'rgba(244, 114, 182, 0.95)',
                    lineHeight: 1,
                  }}
                >
                  {rows.length}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {rows.length === 1 ? 'Song' : 'Songs'}
                </div>
              </div>
            </div>
          </div>

          {/* Song list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((row, index) => (
              <SetlistRowCard
                key={row.id}
                row={row}
                index={index}
                bandId={bandId}
                navigate={navigate}
                songIdByTitle={songIdByTitle}
              />
            ))}
          </div>

          {/* Load / Replace setlist button */}
          {isAdmin && (
            <div style={{ marginTop: 18 }}>
              <IonButton
                expand="block"
                onClick={ensureTemplatesLoaded}
                disabled={loadingTemplates || applyingTemplate}
                style={
                  {
                    '--background': 'rgba(15, 23, 42, 0.8)',
                    '--background-hover': 'rgba(15, 23, 42, 0.95)',
                    '--background-activated': 'rgba(15, 23, 42, 1)',
                    '--color': '#9ca3af',
                    '--border-radius': '12px',
                    '--padding-top': '14px',
                    '--padding-bottom': '14px',
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'none',
                    letterSpacing: 0.3,
                  } as any
                }
              >
                <IonIcon icon={gridOutline} slot="start" />
                {applyingTemplate
                  ? 'Applying…'
                  : loadingTemplates
                  ? 'Loading…'
                  : 'Replace setlist'}
              </IonButton>
            </div>
          )}
        </>
      )}

      {/* Template picker modal */}
      {isAdmin && (
        <IonModal
          isOpen={templatesOpen}
          onDidDismiss={() => {
            if (!applyingTemplate && !loadingTemplates) {
              setTemplatesOpen(false);
            }
          }}
        >
          <IonContent
            style={{
              '--background':
                'linear-gradient(135deg, rgba(5,5,9,0.98), rgba(5,5,12,0.98))',
            }}
          >
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 380,
                  borderRadius: 20,
                  padding: 22,
                  background: 'rgba(15, 23, 42, 0.98)',
                  border: '1px solid rgba(244, 114, 182, 0.5)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background:
                        'linear-gradient(135deg, rgba(244, 114, 182, 0.25), rgba(244, 114, 182, 0.08))',
                      border: '1px solid rgba(244, 114, 182, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IonIcon
                      icon={musicalNotesOutline}
                      style={{
                        fontSize: 20,
                        color: 'rgba(244, 114, 182, 0.96)',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#F9FAFB',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Select a Setlist
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#9ca3af',
                      }}
                    >
                      Load songs into this event from your saved setlists.
                    </div>
                  </div>
                </div>

                {/* Content */}
                {loadingTemplates || applyingTemplate ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px 0 8px',
                      gap: 10,
                    }}
                  >
                    <IonSpinner
                      name="crescent"
                      style={{ width: 18, height: 18, color: '#f472b6' }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        color: '#9ca3af',
                      }}
                    >
                      {applyingTemplate ? 'Applying setlist…' : 'Loading…'}
                    </span>
                  </div>
                ) : templates.length === 0 ? (
                  <div
                    style={{
                      padding: '22px 10px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        marginBottom: 6,
                        fontSize: 14,
                        color: '#e5e7eb',
                        fontWeight: 500,
                      }}
                    >
                      No saved setlists yet
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#9ca3af',
                      }}
                    >
                      Create one from your band Library, then come back here to
                      load it into this event.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      marginTop: 4,
                      marginBottom: 4,
                      maxHeight: 260,
                      overflowY: 'auto',
                    }}
                  >
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t.id)}
                        style={{
                          width: '100%',
                          border: 'none',
                          padding: '12px 14px',
                          borderRadius: 12,
                          background:
                            'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(24, 24, 38, 0.95))',
                          color: '#F9FAFB',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                          }}
                        >
                          {t.name}
                        </span>
                        <IonIcon
                          icon={chevronForwardOutline}
                          style={{
                            fontSize: 18,
                            color: 'rgba(244, 114, 182, 0.85)',
                            flexShrink: 0,
                            pointerEvents: 'none',
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer buttons */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setTemplatesOpen(false)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      background: 'rgba(15, 23, 42, 0.95)',
                      color: '#e5e7eb',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>
      )}
    </div>
  );
}

/* ------------------ Simple Row Card (now as button) ------------------ */

type RowCardProps = {
  row: SetlistRow;
  index: number;
  bandId: string;
  navigate: ReturnType<typeof useNavigate>;
  songIdByTitle: Map<string, string>;
};

function SetlistRowCard({
  row,
  index,
  bandId,
  navigate,
  songIdByTitle,
}: RowCardProps) {
  const hasMetadata = row.musical_key || row.bpm;

  const resolvedSongId =
    row.song_id ?? songIdByTitle.get(row.title.trim().toLowerCase()) ?? null;

  const isClickable = !!resolvedSongId;

  const handleClick = () => {
    if (!resolvedSongId) return;
    navigate(`/bands/${bandId}/songs/${resolvedSongId}`);
  };

  return (
    <button
      type="button"
      onClick={isClickable ? handleClick : undefined}
      disabled={!isClickable}
      style={{
        width: '100%',
        position: 'relative',
        background:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 16,
        padding: '14px 14px 14px 18px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      {/* Position badge */}
      <div
        style={{
          minWidth: 32,
          height: 32,
          borderRadius: 10,
          background:
            'linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(244, 114, 182, 0.1))',
          border: '1px solid rgba(244, 114, 182, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 800,
          color: 'rgba(244, 114, 182, 0.95)',
          pointerEvents: 'none',
        }}
      >
        {index + 1}
      </div>

      {/* Song info */}
      <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#e5e7eb',
            marginBottom: hasMetadata ? 6 : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: 0.2,
          }}
          title={row.title}
        >
          {row.title}
        </div>

        {hasMetadata && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 13,
              color: '#9ca3af',
            }}
          >
            {row.musical_key && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  borderRadius: 6,
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9ca3af',
                  }}
                >
                  🎵
                </span>
                <span
                  style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#9ca3af',
                  }}
                >
                  {row.musical_key}
                </span>
              </div>
            )}

            {row.bpm && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  borderRadius: 6,
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                }}
              >
                <span style={{ fontSize: 11 }}>⏱️</span>
                <span
                  style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#9ca3af',
                  }}
                >
                  {row.bpm}
                </span>
              </div>
            )}
          </div>
        )}

        {row.notes && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: '#6b7280',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.notes}
          </div>
        )}
      </div>

      {/* Chevron to song sheet */}
      {isClickable && (
        <IonIcon
          icon={chevronForwardOutline}
          style={{
            fontSize: 22,
            color: 'rgba(244, 114, 182, 0.8)',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
}
