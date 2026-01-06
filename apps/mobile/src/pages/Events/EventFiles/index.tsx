import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, folderOpenOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyFilesState } from './components/EmptyFilesState';
import { FileActionsModal } from './components/FileActionsModal';
import { FileCard } from './components/FileCard';
import { FileUploadButton } from './components/FileUploadButton';
import { useEventFiles } from './hooks/useEventFiles';
import type { EventFile } from './types';

export default function EventFilesPage() {
  const nav = useNavigate();
  const {
    eventId,
    title,
    files,
    loading,
    filesLoading,
    uploading,
    isAdmin,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
    handleDownload,
    handleDelete,
  } = useEventFiles();

  const [selectedFile, setSelectedFile] = useState<EventFile | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const openFileActions = (file: EventFile) => {
    setSelectedFile(file);
    setShowActionSheet(true);
  };

  const closeActionSheet = () => {
    setShowActionSheet(false);
    setSelectedFile(null);
  };

  return (
    <IonPage>
      <IonHeader
        className="ion-no-border"
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      >
        <IonToolbar
          style={{
            '--background': 'rgba(5, 5, 9, 0.95)',
            '--border-width': '0',
            borderBottom: '1px solid rgba(31, 41, 55, 0.9)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => nav(-1)}
              style={{
                flex: '0 0 auto',
                background: 'transparent',
                border: 'none',
                padding: 6,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </button>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background:
                  'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IonIcon
                icon={folderOpenOutline}
                style={{ fontSize: 16, color: '#34D399' }}
              />
            </div>
            <IonText style={{ flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#F9FAFB',
                  letterSpacing: -0.2,
                }}
              >
                Files
              </h2>
              <p
                style={{
                  margin: 0,
                  marginTop: 2,
                  fontSize: 12,
                  color: '#9ca3af',
                }}
              >
                {title}
              </p>
            </IonText>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': '#050509',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {loading || filesLoading || !eventId ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            <IonSpinner name="crescent" style={{ marginRight: 8 }} />
            Loading files…
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {/* Upload Button (Admin only) */}
            {isAdmin && (
              <FileUploadButton
                uploading={uploading}
                fileInputRef={fileInputRef}
                onUploadClick={handleUploadClick}
                onFileChange={handleFileChange}
              />
            )}

            {/* Files List */}
            {files.length === 0 ? (
              <EmptyFilesState isAdmin={isAdmin} />
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onOpenActions={openFileActions}
                  />
                ))}

                {/* Admin hint */}
                {isAdmin && (
                  <div
                    style={{
                      background: 'rgba(17, 24, 39, 0.4)',
                      border: '1px solid rgba(55, 65, 81, 0.4)',
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 4,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                      Only band admins can upload and delete files
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </IonContent>

      <FileActionsModal
        isOpen={showActionSheet}
        selectedFile={selectedFile}
        isAdmin={isAdmin}
        onDismiss={closeActionSheet}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </IonPage>
  );
}
