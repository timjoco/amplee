import { IonIcon, IonModal } from '@ionic/react';
import { downloadOutline, trashOutline } from 'ionicons/icons';

import type { EventFile } from '../types';

type Props = {
  isOpen: boolean;
  selectedFile: EventFile | null;
  isAdmin: boolean;
  onDismiss: () => void;
  onDownload: (file: EventFile) => void;
  onDelete: (file: EventFile) => void;
};

export function FileActionsModal({
  isOpen,
  selectedFile,
  isAdmin,
  onDismiss,
  onDownload,
  onDelete,
}: Props) {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      initialBreakpoint={0.35}
      breakpoints={[0, 0.35]}
      style={
        {
          '--background': '#11121a',
          '--border-radius': '16px 16px 0 0',
        } as any
      }
    >
      <div
        style={{
          background: '#11121a',
          padding: '16px',
          paddingTop: '24px',
          minHeight: '100%',
        }}
      >
        {/* File name header */}
        {selectedFile && (
          <p
            style={{
              margin: '0 0 20px',
              fontSize: 14,
              color: '#9ca3af',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 16px',
            }}
          >
            {selectedFile.file_name}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              if (selectedFile) {
                onDownload(selectedFile);
              }
              onDismiss();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={downloadOutline}
              style={{ fontSize: 22, color: '#f9fafb' }}
            />
            <span style={{ fontSize: 16, fontWeight: 500, color: '#f9fafb' }}>
              Download
            </span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (selectedFile) onDelete(selectedFile);
                onDismiss();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              <IonIcon
                icon={trashOutline}
                style={{ fontSize: 22, color: '#ef4444' }}
              />
              <span style={{ fontSize: 16, fontWeight: 500, color: '#ef4444' }}>
                Delete
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            style={{
              width: '100%',
              padding: '14px 16px',
              marginTop: 8,
              background: '#1f2937',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600,
              color: '#9ca3af',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </IonModal>
  );
}
