/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import type { BandLite } from '../types';

type SongFormShape = {
  bandId: string;
  title: string;
  origin: 'original' | 'cover';
  originalArtist: string;
  key: string;
  bpm: string | number;

  setBandId: (v: string) => void;
  setTitle: (v: string) => void;
  setOrigin: (v: 'original' | 'cover') => void;
  setOriginalArtist: (v: string) => void;
  setKey: (v: string) => void;
  setBpm: (v: any) => void;
};

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

  return (
    <div className="gc-form-card gc-form-card-song">
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

      <div className="gc-form-row">
        <div className="gc-form-group">
          <label className="gc-form-label gc-form-label-song">
            Key (optional)
          </label>
          <input
            type="text"
            className="gc-form-input gc-form-input-song"
            value={songForm.key}
            onChange={(e) => songForm.setKey(e.target.value)}
            placeholder="e.g., G, B♭"
          />
        </div>

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
          />
        </div>
      </div>

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
