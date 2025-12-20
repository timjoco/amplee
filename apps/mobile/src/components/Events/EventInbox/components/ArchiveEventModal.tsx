/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonActionSheet,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  IonTextarea,
} from '@ionic/react';
import { archiveOutline, closeOutline, hammerOutline } from 'ionicons/icons';
import { EventRow } from '../types';

export default function ArchiveEventModal({
  showActions,
  setShowActions,
  actionTarget,
  showArchive,
  setShowArchive,
  archiving,

  archiveNotes,
  setArchiveNotes,
  archiveAttendance,
  setArchiveAttendance,
  archiveMerch,
  setArchiveMerch,
  archivePayout,
  setArchivePayout,

  onArchive,
  onRequestArchive,
}: {
  showActions: boolean;
  setShowActions: (v: boolean) => void;
  actionTarget: EventRow | null;

  showArchive: boolean;
  setShowArchive: (v: boolean) => void;
  archiving: boolean;

  archiveNotes: string;
  setArchiveNotes: (v: string) => void;
  archiveAttendance: string;
  setArchiveAttendance: (v: string) => void;
  archiveMerch: string;
  setArchiveMerch: (v: string) => void;
  archivePayout: string;
  setArchivePayout: (v: string) => void;

  onArchive: (ev: EventRow) => Promise<void>;
  onRequestArchive: () => void;
}) {
  const closeArchiveModal = () => {
    setShowArchive(false);
  };

  const isPast = (() => {
    const ts = actionTarget?.starts_at
      ? new Date(actionTarget.starts_at).getTime()
      : 0;
    return ts > 0 && ts < Date.now();
  })();

  return (
    <>
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        header={actionTarget?.title ?? 'Event'}
        cssClass="amplee-action-sheet"
        buttons={[
          {
            text: 'Archive',
            icon: archiveOutline,
            handler: () => {
              if (!isPast) return;
              setShowActions(false);
              onRequestArchive();
            },
            cssClass: isPast ? '' : 'action-disabled',
          },
          {
            text: 'Cancel',
            icon: closeOutline,
            role: 'cancel',
            handler: () => setShowActions(false),
          },
        ]}
      />

      <IonModal
        isOpen={showArchive}
        onDidDismiss={closeArchiveModal}
        className="amplee-modal"
      >
        <IonContent
          className="ion-padding"
          style={{
            '--background': '#0c0a14',
            '--padding-top': 'calc(env(safe-area-inset-top) + 16px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#e5e7eb',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Archive {actionTarget?.type === 'show' ? 'Show' : 'Practice'}
            </h2>
            <IonButton
              fill="clear"
              onClick={closeArchiveModal}
              style={{
                '--color': 'rgba(156,163,175,0.9)',
                '--padding-end': '0',
                margin: 0,
              }}
            >
              <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
            </IonButton>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {actionTarget?.type === 'show' && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'rgba(139,92,246,0.9)',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IonIcon icon={hammerOutline} style={{ opacity: 0.9 }} />
                  Show Stats
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'rgba(156,163,175,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      Merch Sales
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '0 12px',
                      }}
                    >
                      <span style={{ color: 'rgba(156,163,175,0.7)' }}>$</span>
                      <IonInput
                        inputMode="decimal"
                        value={archiveMerch}
                        onIonInput={(e) =>
                          setArchiveMerch(String(e.detail.value ?? ''))
                        }
                        placeholder="0.00"
                        style={{
                          '--color': '#e5e7eb',
                          '--placeholder-color': 'rgba(156,163,175,0.5)',
                          '--padding-start': '8px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'rgba(156,163,175,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      Payout
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '0 12px',
                      }}
                    >
                      <span style={{ color: 'rgba(156,163,175,0.7)' }}>$</span>
                      <IonInput
                        inputMode="decimal"
                        value={archivePayout}
                        onIonInput={(e) =>
                          setArchivePayout(String(e.detail.value ?? ''))
                        }
                        placeholder="0.00"
                        style={{
                          '--color': '#e5e7eb',
                          '--placeholder-color': 'rgba(156,163,175,0.5)',
                          '--padding-start': '8px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'rgba(156,163,175,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      Attendance
                    </label>
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '0 12px',
                      }}
                    >
                      <IonInput
                        inputMode="numeric"
                        value={archiveAttendance}
                        onIonInput={(e) =>
                          setArchiveAttendance(String(e.detail.value ?? ''))
                        }
                        placeholder="0"
                        style={{
                          '--color': '#e5e7eb',
                          '--placeholder-color': 'rgba(156,163,175,0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'rgba(156,163,175,0.9)',
                  marginBottom: 6,
                }}
              >
                Notes
              </label>
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                }}
              >
                <IonTextarea
                  value={archiveNotes}
                  onIonInput={(e) =>
                    setArchiveNotes(String(e.detail.value ?? ''))
                  }
                  placeholder="How did it go? Any memorable moments?"
                  autoGrow
                  rows={3}
                  style={{
                    '--color': '#e5e7eb',
                    '--placeholder-color': 'rgba(156,163,175,0.5)',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    '--padding-top': '12px',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 24,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <IonButton
              fill="outline"
              expand="block"
              disabled={archiving}
              onClick={closeArchiveModal}
              style={{
                '--border-color': 'rgba(255,255,255,0.12)',
                '--color': 'rgba(156,163,175,0.9)',
                '--border-radius': '10px',
                flex: 1,
              }}
            >
              Cancel
            </IonButton>

            <IonButton
              expand="block"
              disabled={!actionTarget || archiving}
              onClick={async () => {
                if (!actionTarget) return;
                await onArchive(actionTarget);
                closeArchiveModal();
              }}
              style={{
                '--background': '#7c3aed',
                '--background-hover': '#6d28d9',
                '--border-radius': '10px',
                flex: 1,
              }}
            >
              {archiving ? (
                <>
                  <IonSpinner name="dots" style={{ marginRight: 8 }} />
                  Archiving
                </>
              ) : (
                'Archive'
              )}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
}
