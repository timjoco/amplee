/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonContent, IonIcon, IonModal, IonSpinner } from '@ionic/react';
import {
  chevronForwardOutline,
  gridOutline,
  musicalNotesOutline,
  sparklesOutline,
  speedometerOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Theme Colors (Pink for Setlists)
// ─────────────────────────────────────────────────────────────

const PINK = {
  primary: '#ec4899',
  light: '#f472b6',
  lighter: '#f9a8d4',
  subtle: 'rgba(236, 72, 153, 0.08)',
  border: 'rgba(236, 72, 153, 0.25)',
  glow: 'rgba(236, 72, 153, 0.4)',
};

// ─────────────────────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────────────────────

const glassCard = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

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

  const [songs, setSongs] = useState<Song[]>([]);

  // Push summary up only when song count changes
  useEffect(() => {
    if (!onSummaryChange) return;
    onSummaryChange({ songCount: rows.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  const loadEventSetlist = useCallback(async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from('event_setlist_items')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true });

    if (error) {
      setRows([]);
      return;
    }
    setRows((data || []) as SetlistRow[]);
  }, [eventId]);

  // ---- Load event setlist + active template label ----
  useEffect(() => {
    let alive = true;

    if (!eventId) {
      console.error('EventSetlistTabMobile: eventId is required');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);

      await loadEventSetlist();
      if (!alive) return;

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

        const { data: templateData, error: templateErr } = await supabase
          .from('setlist_templates')
          .select('name')
          .eq('id', eventData.setlist_template_id)
          .single();

        if (!alive) return;

        if (!templateErr && templateData) {
          setActiveTemplateName(templateData.name);
        }
      } else {
        setActiveTemplateId(null);
        setActiveTemplateName(null);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId, loadEventSetlist]);

  // ---- Load songs for band (title → song_id fallback) ----
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

  const ensureTemplatesLoaded = useCallback(async () => {
    if (!bandId) return;

    setLoadingTemplates(true);
    try {
      // ✅ Only templates that have >= 1 item
      const { data, error } = await supabase
        .from('setlist_templates')
        .select('id,name,setlist_template_items!inner(id)')
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[EventSetlistTabMobile] load templates error', error);
        setTemplates([]);
      } else {
        // `!inner` can return duplicates (one row per item), so de-dupe by template id
        const uniq = new Map<string, { id: string; name: string }>();
        (data || []).forEach((t: any) => {
          uniq.set(t.id, { id: t.id, name: t.name });
        });
        setTemplates([...uniq.values()]);
      }

      setTemplatesOpen(true);
    } finally {
      setLoadingTemplates(false);
    }
  }, [bandId]);

  // ---- Apply template to this event ----
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

        if (tErr) return;

        const items = (tItems || []) as any[];
        if (items.length === 0) {
          console.warn('[setlist] template has 0 items', templateId);
          return;
        }

        const { error: delErr } = await supabase
          .from('event_setlist_items')
          .delete()
          .eq('event_id', eventId);

        if (delErr) return;

        const inserts = items.map((it, i) => ({
          event_id: eventId,
          song_id: it.song_id ?? null,
          title: it.title,
          musical_key: it.musical_key ?? null,
          bpm: it.bpm ?? null,
          notes: it.notes ?? null,
          order_index: i,
        }));

        // Insert without select (avoids RLS “returned 0 rows” confusion)
        const { error: insErr } = await supabase
          .from('event_setlist_items')
          .insert(inserts);

        if (insErr) return;

        const { error: updateErr } = await supabase
          .from('events')
          .update({ setlist_template_id: templateId })
          .eq('id', eventId);

        // Always re-fetch to guarantee UI updates
        await loadEventSetlist();

        setTemplatesOpen(false);
        setActiveTemplateId(templateId);
        setActiveTemplateName(
          templates.find((t) => t.id === templateId)?.name ?? null
        );
      } finally {
        setApplyingTemplate(false);
      }
    },
    [eventId, bandId, applyingTemplate, templates, loadEventSetlist]
  );

  const hasSongs = rows.length > 0;
  const headerSetlistName =
    activeTemplateName || (hasSongs ? 'Custom setlist' : 'No setlist loaded');

  // ─────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────

  if (loading && rows.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
          gap: 12,
        }}
      >
        <IonSpinner
          style={{ '--color': PINK.primary, width: 28, height: 28 }}
        />
        <span style={{ fontSize: 14, color: '#6b7280' }}>
          Loading setlist...
        </span>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '16px 16px 80px 16px' }}>
      {rows.length === 0 ? (
        <div
          style={{
            ...glassCard,
            border: `1px solid ${PINK.border}`,
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: PINK.subtle,
              border: `1px solid ${PINK.border}`,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}
          >
            <IonIcon
              icon={sparklesOutline}
              style={{ fontSize: 28, color: PINK.light }}
            />
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#e5e7eb',
              marginBottom: 8,
            }}
          >
            No Songs Yet
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.5,
              marginBottom: isAdmin ? 20 : 0,
            }}
          >
            {isAdmin
              ? 'Load a setlist to get started with this event.'
              : 'Your band admin will add songs for this event.'}
          </p>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                void ensureTemplatesLoaded();
              }}
              disabled={loadingTemplates || applyingTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '14px 20px',
                borderRadius: 12,
                background: PINK.primary,
                border: 'none',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loadingTemplates || applyingTemplate ? 0.6 : 1,
              }}
            >
              <IonIcon icon={gridOutline} style={{ fontSize: 18 }} />
              {applyingTemplate
                ? 'Applying…'
                : loadingTemplates
                ? 'Loading…'
                : 'Load Setlist'}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                if (activeTemplateId) {
                  navigate(`/bands/${bandId}/setlists/${activeTemplateId}`);
                }
              }}
              disabled={!activeTemplateId}
              style={{
                flex: 1,
                ...glassCard,
                border: `1px solid ${PINK.border}`,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: activeTemplateId ? 'pointer' : 'default',
                textAlign: 'left',
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 18, color: PINK.light, flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#f9fafb',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {headerSetlistName}
              </span>
              {activeTemplateId && (
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{ fontSize: 16, color: PINK.light, flexShrink: 0 }}
                />
              )}
            </button>

            <div
              style={{
                ...glassCard,
                border: `1px solid ${PINK.border}`,
                padding: '14px 20px',
                textAlign: 'center',
                minWidth: 80,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: PINK.light,
                  lineHeight: 1,
                }}
              >
                {rows.length}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {rows.length === 1 ? 'Song' : 'Songs'}
              </div>
            </div>
          </div>

          {/* Song List */}
          <div
            style={{
              ...glassCard,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          </div>

          {/* Replace setlist button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                void ensureTemplatesLoaded();
              }}
              disabled={loadingTemplates || applyingTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                marginTop: 16,
                padding: '14px 20px',
                borderRadius: 12,
                background: PINK.subtle,
                border: `1px solid ${PINK.border}`,
                color: PINK.light,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loadingTemplates || applyingTemplate ? 0.6 : 1,
              }}
            >
              <IonIcon icon={gridOutline} style={{ fontSize: 18 }} />
              {applyingTemplate
                ? 'Applying…'
                : loadingTemplates
                ? 'Loading…'
                : 'Replace Setlist'}
            </button>
          )}
        </>
      )}

      {/* Template Picker Modal */}
      {isAdmin && (
        <IonModal
          isOpen={templatesOpen}
          onDidDismiss={() => {
            if (!applyingTemplate && !loadingTemplates) setTemplatesOpen(false);
          }}
        >
          <IonContent
            style={{
              '--background':
                'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
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
                  ...glassCard,
                  border: `1px solid ${PINK.border}`,
                  padding: 24,
                  boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${PINK.glow}`,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: PINK.subtle,
                      border: `1px solid ${PINK.border}`,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <IonIcon
                      icon={musicalNotesOutline}
                      style={{ fontSize: 22, color: PINK.light }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#f9fafb',
                        marginBottom: 2,
                      }}
                    >
                      Select a Setlist
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      Load songs into this event
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
                      padding: '32px 0',
                      gap: 10,
                    }}
                  >
                    <IonSpinner
                      style={{ '--color': PINK.primary, width: 20, height: 20 }}
                    />
                    <span style={{ fontSize: 14, color: '#6b7280' }}>
                      {applyingTemplate ? 'Applying setlist…' : 'Loading…'}
                    </span>
                  </div>
                ) : templates.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <IonIcon
                      icon={musicalNotesOutline}
                      style={{
                        fontSize: 36,
                        color: '#4b5563',
                        marginBottom: 12,
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#e5e7eb',
                        marginBottom: 6,
                      }}
                    >
                      No saved setlists yet
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#6b7280',
                        lineHeight: 1.5,
                      }}
                    >
                      Create one from your band Library, then come back here to
                      load it.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      maxHeight: 300,
                      overflowY: 'auto',
                    }}
                  >
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          void applyTemplate(t.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: 12,
                          background: PINK.subtle,
                          border: `1px solid ${PINK.border}`,
                          color: '#f9fafb',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          cursor: 'pointer',
                          transition: 'all 100ms ease-out',
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
                          }}
                        >
                          {t.name}
                        </span>
                        <IonIcon
                          icon={chevronForwardOutline}
                          style={{
                            fontSize: 18,
                            color: PINK.light,
                            flexShrink: 0,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setTemplatesOpen(false)}
                  style={{
                    width: '100%',
                    marginTop: 20,
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e5e7eb',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </IonContent>
        </IonModal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row Card Component
// ─────────────────────────────────────────────────────────────

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
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: isClickable ? 'pointer' : 'default',
        textAlign: 'left',
        transition: 'all 100ms ease-out',
      }}
    >
      <div
        style={{
          width: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: PINK.light }}>
          {index + 1}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#f9fafb',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: row.musical_key || row.bpm ? 4 : 0,
          }}
        >
          {row.title}
        </div>

        {(row.musical_key || row.bpm) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            {row.musical_key && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{ fontSize: 13, color: PINK.light, opacity: 0.7 }}
                />
                <span>{row.musical_key}</span>
              </div>
            )}
            {row.bpm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IonIcon
                  icon={speedometerOutline}
                  style={{ fontSize: 13, color: PINK.light, opacity: 0.7 }}
                />
                <span>{row.bpm}</span>
              </div>
            )}
          </div>
        )}

        {row.notes && (
          <div
            style={{
              marginTop: 4,
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

      {isClickable && (
        <IonIcon
          icon={chevronForwardOutline}
          style={{ fontSize: 18, color: PINK.light, flexShrink: 0 }}
        />
      )}
    </button>
  );
}
