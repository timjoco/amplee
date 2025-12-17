/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonModal } from '@ionic/react';
import {
  chevronForwardOutline,
  closeOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import { useMemo, useState } from 'react';
import { MAJOR_KEYS, MINOR_KEYS } from '../../../lib/music/musicalKeys';
import type { BandLite } from '../types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SongFormShape = {
  bandId: string;
  title: string;
  origin: 'original' | 'cover';
  originalArtist: string;
  key: string;
  bpm: string | number;
  durationSeconds: number | null;

  setBandId: (v: string) => void;
  setTitle: (v: string) => void;
  setOrigin: (v: 'original' | 'cover') => void;
  setOriginalArtist: (v: string) => void;
  setKey: (v: string) => void;
  setBpm: (v: any) => void;
  setDurationSeconds: (v: number | null) => void;
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  // Key picker modal
  modalOverlay: {
    padding: 0,
    '--background': 'transparent',
    '--backdrop-opacity': 0.7,
  } as React.CSSProperties,

  modalContent: {
    background:
      'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 20,
    border: '1px solid rgba(236, 72, 153, 0.2)',
    margin: 16,
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(236, 72, 153, 0.15)',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  modalCloseBtn: {
    background: 'rgba(236, 72, 153, 0.1)',
    border: 'none',
    borderRadius: 10,
    padding: 8,
    color: '#f9a8d4',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px 20px 20px',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'rgba(249, 168, 212, 0.7)',
    marginBottom: 10,
    marginTop: 16,
  },

  keyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },

  keyBtn: (active: boolean) => ({
    background: active
      ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.4))'
      : 'rgba(30, 41, 59, 0.6)',
    border: active
      ? '1px solid rgba(236, 72, 153, 0.6)'
      : '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: 10,
    padding: '10px 8px',
    color: active ? '#fdf2f8' : '#cbd5e1',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center' as const,
  }),

  noneBtn: (active: boolean) => ({
    background: active ? 'rgba(100, 116, 139, 0.3)' : 'rgba(30, 41, 59, 0.6)',
    border: active
      ? '1px solid rgba(148, 163, 184, 0.4)'
      : '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: 10,
    padding: '10px 12px',
    color: active ? '#e2e8f0' : '#94a3b8',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
  }),

  // Duration picker
  durationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  durationSeparator: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f9a8d4',
  },

  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: '#f9a8d4',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 8px',
    marginLeft: 8,
  },

  // Picker button - matches gc-form-input-song styles
  pickerBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    cursor: 'pointer',
  },

  pickerBtnIcon: {
    fontSize: 18,
    color: '#f9a8d4',
  },
};

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function NewSongStep(props: {
  bands: BandLite[];
  loadingBands: boolean;
  currentBandId: string;
  onBandChange: (bandId: string) => void;
  songForm: SongFormShape;
  onSubmit: () => void;
}) {
  const {
    bands,
    loadingBands,
    currentBandId,
    onBandChange,
    songForm,
    onSubmit,
  } = props;

  // Key picker modal state
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Duration UI state
  const { durMin, durSec } = useMemo(() => {
    const total = songForm.durationSeconds ?? 0;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return { durMin: m, durSec: s };
  }, [songForm.durationSeconds]);

  const setDurationParts = (m: number, s: number) => {
    const mm = Math.max(0, Math.min(59, Number.isFinite(m) ? m : 0));
    const ss = Math.max(0, Math.min(59, Number.isFinite(s) ? s : 0));
    const total = mm * 60 + ss;
    songForm.setDurationSeconds(total > 0 ? total : null);
  };

  const keyLabel = songForm.key?.trim() ? songForm.key : 'Select key…';

  return (
    <div className="gc-form-card gc-form-card-song">
      {/* Band */}
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-song">Band</label>
        <div className="gc-select-wrapper">
          <select
            className="gc-select gc-form-input-song"
            value={currentBandId}
            onChange={(e) => onBandChange(e.target.value)}
          >
            {loadingBands && <option value="">Loading…</option>}
            {!loadingBands &&
              bands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
          <IonIcon icon={chevronForwardOutline} className="gc-select-chevron" />
        </div>
      </div>

      {/* Title */}
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-song">Song title</label>
        <input
          type="text"
          className="gc-form-input gc-form-input-song"
          value={songForm.title}
          onChange={(e) => songForm.setTitle(e.target.value)}
          placeholder="e.g., Meadowlark & the Bluebird"
        />
      </div>

      {/* Origin */}
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-song">Origin</label>
        <div className="gc-toggle-group">
          <button
            className={`gc-toggle-btn ${
              songForm.origin === 'original'
                ? 'gc-toggle-btn-active-original'
                : 'gc-toggle-btn-inactive'
            }`}
            onClick={() => songForm.setOrigin('original')}
            type="button"
          >
            Original
          </button>
          <button
            className={`gc-toggle-btn ${
              songForm.origin === 'cover'
                ? 'gc-toggle-btn-active-cover'
                : 'gc-toggle-btn-inactive'
            }`}
            onClick={() => songForm.setOrigin('cover')}
            type="button"
          >
            Cover
          </button>
        </div>
      </div>

      {/* Original artist */}
      {songForm.origin === 'cover' && (
        <div className="gc-form-group">
          <label className="gc-form-label gc-form-label-song">
            Original artist
          </label>
          <input
            type="text"
            className="gc-form-input gc-form-input-song"
            value={songForm.originalArtist}
            onChange={(e) => songForm.setOriginalArtist(e.target.value)}
            placeholder="e.g., Fleetwood Mac"
          />
        </div>
      )}

      {/* Key + BPM */}
      <div className="gc-form-row">
        {/* Key picker */}
        <div className="gc-form-group">
          <label className="gc-form-label gc-form-label-song">
            Key (optional)
          </label>

          <button
            type="button"
            className="gc-form-input gc-form-input-song"
            style={styles.pickerBtn}
            onClick={() => setShowKeyModal(true)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {keyLabel}
            </span>
            <IonIcon icon={musicalNotesOutline} style={styles.pickerBtnIcon} />
          </button>

          {/* Key Picker Modal */}
          <IonModal
            isOpen={showKeyModal}
            onDidDismiss={() => setShowKeyModal(false)}
            className="gc-modal-root"
            style={styles.modalOverlay}
          >
            <div style={styles.modalContent}>
              {/* Header */}
              <div style={styles.modalHeader}>
                <div style={styles.modalTitle}>
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ color: '#f9a8d4' }}
                  />
                  Select Key
                </div>
                <button
                  type="button"
                  style={styles.modalCloseBtn}
                  onClick={() => setShowKeyModal(false)}
                >
                  <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Scrollable content */}
              <div style={styles.modalScrollArea}>
                {/* None option */}
                <button
                  type="button"
                  style={styles.noneBtn(!songForm.key)}
                  onClick={() => {
                    songForm.setKey('');
                    setShowKeyModal(false);
                  }}
                >
                  None
                </button>

                {/* Major keys */}
                <div style={styles.sectionLabel}>Major Keys</div>
                <div style={styles.keyGrid}>
                  {MAJOR_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      style={styles.keyBtn(songForm.key === k)}
                      onClick={() => {
                        songForm.setKey(k);
                        setShowKeyModal(false);
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Minor keys */}
                <div style={styles.sectionLabel}>Minor Keys</div>
                <div style={styles.keyGrid}>
                  {MINOR_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      style={styles.keyBtn(songForm.key === k)}
                      onClick={() => {
                        songForm.setKey(k);
                        setShowKeyModal(false);
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </IonModal>
        </div>

        {/* BPM */}
        <div className="gc-form-group">
          <label className="gc-form-label gc-form-label-song">
            BPM (optional)
          </label>
          <input
            type="number"
            className="gc-form-input gc-form-input-song"
            value={songForm.bpm}
            onChange={(e) => songForm.setBpm(e.target.value)}
            placeholder="e.g., 120"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Duration picker - unified box */}
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-song">
          Duration (optional)
        </label>

        <div
          className="gc-form-input gc-form-input-song"
          style={styles.durationRow}
        >
          {/* Minutes */}
          <select
            className="gc-select gc-form-input-song"
            style={{ flex: 1, border: 'none', background: 'transparent' }}
            value={durMin}
            onChange={(e) => setDurationParts(Number(e.target.value), durSec)}
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>
                {pad2(i)}
              </option>
            ))}
          </select>

          <span style={styles.durationSeparator}>:</span>

          {/* Seconds */}
          <select
            className="gc-select gc-form-input-song"
            style={{ flex: 1, border: 'none', background: 'transparent' }}
            value={durSec}
            onChange={(e) => setDurationParts(durMin, Number(e.target.value))}
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>
                {pad2(i)}
              </option>
            ))}
          </select>

          {songForm.durationSeconds ? (
            <button
              type="button"
              style={styles.clearBtn}
              onClick={() => songForm.setDurationSeconds(null)}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* Submit */}
      <button
        className="gc-submit-btn gc-submit-btn-song"
        onClick={onSubmit}
        disabled={!songForm.bandId || !songForm.title.trim()}
        type="button"
      >
        Create Song
      </button>
    </div>
  );
}
