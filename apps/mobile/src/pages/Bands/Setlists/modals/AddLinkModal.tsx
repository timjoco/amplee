import { IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, linkOutline } from 'ionicons/icons';
import { glassCard, PINK, RED } from '../lib/styles';

export function AddLinkModal({
  newLinkUrl,
  newLinkLabel,
  setNewLinkUrl,
  setNewLinkLabel,
  savingLink,
  linkError,
  onClose,
  onSubmit,
}: {
  newLinkUrl: string;
  newLinkLabel: string;
  setNewLinkUrl: (v: string) => void;
  setNewLinkLabel: (v: string) => void;
  savingLink: boolean;
  linkError: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={() => !savingLink && onClose()}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          ...glassCard,
          border: `1px solid ${PINK.border}`,
          padding: 24,
          boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 40px ${PINK.glow}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: PINK.subtle,
                border: `1px solid ${PINK.border}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IonIcon
                icon={linkOutline}
                style={{ fontSize: 20, color: PINK.light }}
              />
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Add Link
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={savingLink}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
          </button>
        </div>

        <p
          style={{
            margin: '0 0 20px',
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          Link to Spotify, Apple Music, YouTube, or any other streaming service
        </p>

        {/* URL Input */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            URL
          </label>
          <input
            type="url"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: linkError
                ? `1px solid ${RED.border}`
                : `1px solid ${
                    newLinkUrl ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
              color: '#f9fafb',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {/* Label Input */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Label (optional)
          </label>
          <input
            type="text"
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            placeholder="e.g. Practice Playlist"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f9fafb',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {linkError && (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13,
              color: RED.light,
              textAlign: 'center',
            }}
          >
            {linkError}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={savingLink}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e5e7eb',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={savingLink || !newLinkUrl.trim()}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 12,
              background: PINK.primary,
              border: 'none',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              opacity: savingLink || !newLinkUrl.trim() ? 0.5 : 1,
              boxShadow: `0 4px 12px ${PINK.glow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {savingLink ? (
              <>
                <IonSpinner
                  style={{ '--color': '#fff', width: 16, height: 16 }}
                />
                Adding...
              </>
            ) : (
              'Add Link'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
