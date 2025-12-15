/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  cloudUploadOutline,
  documentOutline,
  downloadOutline,
  ellipsisVertical,
  folderOpenOutline,
  imageOutline,
  trashOutline,
} from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventShell } from '../../hooks/useEventShell';
import { supabase } from '../../lib/supabase';

type RouteParams = {
  eventId: string;
};

type EventFile = {
  id: string;
  event_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
};

export default function EventFilesPageMobile() {
  const nav = useNavigate();
  const { eventId } = useParams<RouteParams>();
  const { event, isAdmin, loading } = useEventShell(eventId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<EventFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EventFile | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const title = event?.title ?? 'Event';

  // Load files for this event
  useEffect(() => {
    if (!eventId) return;

    let alive = true;

    (async () => {
      const { data, error } = await supabase
        .from('event_files')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!alive) return;

      if (error) {
        console.error('Failed to load files:', error);
      } else {
        setFiles((data as EventFile[]) || []);
      }
      setFilesLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId || !event?.band_id) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('event-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: newFile, error: dbError } = await supabase
        .from('event_files')
        .insert({
          event_id: eventId,
          band_id: event.band_id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select('*')
        .single();

      if (dbError) throw dbError;

      setFiles((prev) => [newFile as EventFile, ...prev]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (file: EventFile) => {
    try {
      // Get a signed URL for the file (valid for 60 seconds)
      const { data, error } = await supabase.storage
        .from('event-files')
        .createSignedUrl(file.file_path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      // Open in new tab / trigger download
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (file: EventFile) => {
    if (!confirm(`Delete "${file.file_name}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('event-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('event_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return imageOutline;
    }
    return documentOutline;
  };

  const openFileActions = (file: EventFile) => {
    setSelectedFile(file);
    setShowActionSheet(true);
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
          ['--background' as any]: '#050509',
        }}
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
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploading}
                  style={{
                    width: '100%',
                    background: 'rgba(17, 24, 39, 0.6)',
                    border: '2px dashed rgba(55, 65, 81, 0.8)',
                    borderRadius: 12,
                    padding: '32px 24px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1,
                    transition: 'all 0.15s ease',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: 'rgba(22, 163, 74, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {uploading ? (
                        <IonSpinner
                          name="crescent"
                          style={{ width: 24, height: 24, color: '#16a34a' }}
                        />
                      ) : (
                        <IonIcon
                          icon={cloudUploadOutline}
                          style={{ fontSize: 24, color: '#16a34a' }}
                        />
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#F9FAFB',
                        }}
                      >
                        {uploading ? 'Uploading…' : 'Upload File'}
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 13,
                          color: '#6b7280',
                        }}
                      >
                        PDF, JPG, PNG, DOC (Max 10MB)
                      </p>
                    </div>
                  </div>
                </button>
              </>
            )}

            {/* Files List */}
            {files.length === 0 ? (
              /* Empty State */
              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.6)',
                  border: '1px solid rgba(55, 65, 81, 0.6)',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: '0 auto 16px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon
                    icon={folderOpenOutline}
                    style={{ fontSize: 28, color: '#4b5563' }}
                  />
                </div>

                <h3
                  style={{
                    margin: '0 0 8px',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#9ca3af',
                  }}
                >
                  No files yet
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.5,
                  }}
                >
                  {isAdmin
                    ? 'Upload stage plots, contracts, or other event files'
                    : 'No files have been uploaded for this event yet'}
                </p>
              </div>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {files.map((file) => (
                  <div
                    key={file.id}
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
                        {formatDate(file.created_at)} •{' '}
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>

                    {/* Actions */}
                    <button
                      type="button"
                      onClick={() => openFileActions(file)}
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
                      💡 Only band admins can upload and delete files
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </IonContent>

      {/* File Actions Modal */}
      <IonModal
        isOpen={showActionSheet}
        onDidDismiss={() => {
          setShowActionSheet(false);
          setSelectedFile(null);
        }}
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
              onClick={async () => {
                if (selectedFile) {
                  try {
                    const { data, error } = await supabase.storage
                      .from('event-files')
                      .createSignedUrl(selectedFile.file_path, 60);

                    if (error) throw error;
                    if (!data?.signedUrl)
                      throw new Error('No signed URL returned');

                    // Use window.location for mobile compatibility
                    window.location.href = data.signedUrl;
                  } catch (err) {
                    console.error('Download failed:', err);
                    alert('Failed to download file');
                  }
                }
                setShowActionSheet(false);
                setSelectedFile(null);
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
                  if (selectedFile) handleDelete(selectedFile);
                  setShowActionSheet(false);
                  setSelectedFile(null);
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
                <span
                  style={{ fontSize: 16, fontWeight: 500, color: '#ef4444' }}
                >
                  Delete
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowActionSheet(false);
                setSelectedFile(null);
              }}
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
    </IonPage>
  );
}
