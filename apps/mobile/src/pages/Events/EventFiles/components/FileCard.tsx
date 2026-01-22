import { IonIcon } from '@ionic/react';
import { ellipsisVertical } from 'ionicons/icons';

import type { EventFile } from '../types';
import { formatDate, formatFileSize, getFileIcon } from '../utils';

type Props = {
  file: EventFile;
  onOpenActions: (file: EventFile) => void;
};

export function FileCard({ file, onOpenActions }: Props) {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* File Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          background:
            'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.08) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <IonIcon
          icon={getFileIcon(file.mime_type)}
          style={{ fontSize: 20, color: '#6ee7b7' }}
        />
      </div>

      {/* File Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#F9FAFB',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.file_name}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          {formatDate(file.created_at)} • {formatFileSize(file.file_size)}
        </p>
      </div>

      {/* Actions */}
      <button
        type="button"
        onClick={() => onOpenActions(file)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IonIcon
          icon={ellipsisVertical}
          style={{ fontSize: 20, color: '#9ca3af' }}
        />
      </button>
    </div>
  );
}
