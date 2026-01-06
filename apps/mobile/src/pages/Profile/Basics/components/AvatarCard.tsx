import { IonSpinner } from '@ionic/react';
import { LuPencil } from 'react-icons/lu';
import { RefObject } from 'react';

import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import { AVATAR_BUCKET } from '../constants';

type Props = {
  computedDisplayName: string;
  avatarUrl: string | null;
  uploadingAvatar: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onPickFile: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function AvatarCard({
  computedDisplayName,
  avatarUrl,
  uploadingAvatar,
  fileInputRef,
  onPickFile,
  onFileChange,
}: Props) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '28px 24px',
        marginTop: 16,
        textAlign: 'center',
      }}
    >
      {/* Avatar with glow */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 16,
          position: 'relative',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        {/* Avatar ring */}
        <div
          style={{
            position: 'relative',
            padding: 3,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(168, 85, 247, 0.3) 100%)',
          }}
        >
          <AvatarImageMobile
            name={computedDisplayName}
            bucket={AVATAR_BUCKET}
            avatarPath={avatarUrl ?? undefined}
            size={110}
          />
        </div>
      </div>

      {/* Display name */}
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 18,
          fontWeight: 700,
          color: '#f9fafb',
          letterSpacing: '-0.3px',
        }}
      >
        {computedDisplayName}
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      {/* Change photo button */}
      <button
        type="button"
        onClick={onPickFile}
        disabled={uploadingAvatar}
        style={{
          padding: '10px 20px',
          borderRadius: 10,
          background: uploadingAvatar
            ? 'rgba(139, 92, 246, 0.2)'
            : 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#c4b5fd',
          fontSize: 13,
          fontWeight: 600,
          cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.2s ease',
          opacity: uploadingAvatar ? 0.7 : 1,
        }}
      >
        {uploadingAvatar ? (
          <>
            <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
            Uploading…
          </>
        ) : (
          <>
            <LuPencil size={14} />
            Change photo
          </>
        )}
      </button>

      <p
        style={{
          marginTop: 14,
          marginBottom: 0,
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.35)',
        }}
      >
        This is how you appear across Amplee
      </p>
    </div>
  );
}
