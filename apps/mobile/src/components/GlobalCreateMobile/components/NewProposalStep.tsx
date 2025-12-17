/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import type { BandLite } from '../types';

type ProposalFormShape = {
  bandId: string;
  title: string;
  venue: string;

  setBandId: (v: string) => void;
  setTitle: (v: string) => void;
  setVenue: (v: string) => void;
};

export default function NewProposalStep(props: {
  bands: BandLite[];
  loadingBands: boolean;
  currentBandId: string;
  onBandChange: (bandId: string) => void;

  proposalForm: ProposalFormShape;
  onSubmit: () => void;
}) {
  const {
    bands,
    loadingBands,
    currentBandId,
    onBandChange,
    proposalForm,
    onSubmit,
  } = props;

  return (
    <div className="gc-form-card gc-form-card-proposal">
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-proposal">Band</label>
        <div className="gc-select-wrapper">
          <select
            className="gc-select gc-form-input-proposal"
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
        <label className="gc-form-label gc-form-label-proposal">
          Proposal title
        </label>
        <input
          type="text"
          className="gc-form-input gc-form-input-proposal"
          value={proposalForm.title}
          onChange={(e) => proposalForm.setTitle(e.target.value)}
          placeholder="e.g., Friday night at Riverfront"
        />
      </div>

      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-proposal">
          Venue (optional)
        </label>
        <input
          type="text"
          className="gc-form-input gc-form-input-proposal"
          value={proposalForm.venue}
          onChange={(e) => proposalForm.setVenue(e.target.value)}
          placeholder="The Record Bar"
        />
      </div>

      <button
        className="gc-submit-btn gc-submit-btn-proposal"
        onClick={onSubmit}
        disabled={!proposalForm.bandId || !proposalForm.title.trim()}
        type="button"
      >
        Create Proposal
      </button>
    </div>
  );
}
