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
        background: 'rgba(17, 24, 39, 0.6)',
        border: '1px solid rgba(55, 65, 81, 0.6)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      {/* File Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          background: 'rgba(22, 163, 74, 0.1)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IonIcon
          icon={getFileIcon(file.mime_type)}
          style={{ fontSize: 20, color: '#16a34a' }}
        />
      </div>

      {/* File Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
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
            color: '#6b7280',
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
