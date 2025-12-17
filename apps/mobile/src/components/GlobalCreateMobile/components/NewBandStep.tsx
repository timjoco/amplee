import type { MutableRefObject } from 'react';

type BandFormShape = {
  bandName: string;
  setBandName: (v: string) => void;
  avatarPreview: string | null;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  pickAvatar: (e: any) => void;
  creatingBand: boolean;
};

export default function NewBandStep(props: {
  bandForm: BandFormShape;
  onSubmit: () => void;
}) {
  const { bandForm, onSubmit } = props;

  return (
    <div className="gc-form-card gc-form-card-band">
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-band">Band name</label>
        <input
          type="text"
          className="gc-form-input gc-form-input-band"
          value={bandForm.bandName}
          onChange={(e) => bandForm.setBandName(e.target.value)}
          placeholder="e.g., Teem and Tiger"
        />
      </div>

      <label className="gc-form-label gc-form-label-band">
        Avatar (optional)
      </label>
      <div className="gc-avatar-picker">
        <div className="gc-avatar-preview">
          {bandForm.avatarPreview ? (
            <img src={bandForm.avatarPreview} alt="" />
          ) : (
            bandForm.bandName.trim().slice(0, 2).toUpperCase() || '??'
          )}
        </div>

        <button
          className="gc-avatar-btn"
          onClick={() => bandForm.fileInputRef.current?.click()}
          type="button"
        >
          {bandForm.avatarPreview ? 'Change' : 'Add image'}
        </button>

        <input
          ref={bandForm.fileInputRef}
          type="file"
          accept="image/*"
          className="gc-hidden"
          onChange={bandForm.pickAvatar}
        />
      </div>

      <button
        className="gc-submit-btn gc-submit-btn-band"
        onClick={onSubmit}
        disabled={!bandForm.bandName.trim() || bandForm.creatingBand}
        type="button"
      >
        {bandForm.creatingBand ? 'Creating…' : 'Create Band'}
      </button>
    </div>
  );
}
