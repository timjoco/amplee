/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonModal,
  IonSpinner,
} from '@ionic/react';
import {
  alertCircleOutline,
  archiveOutline,
  calendarOutline,
  closeOutline,
  hammerOutline,
  locationOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import { useMemo } from 'react';
import { EventRow } from '../types';

export default function ArchivedSummaryModal({
  isOpen,
  onClose,
  row,
  loading,
  summary,
}: {
  isOpen: boolean;
  onClose: () => void;
  row: EventRow | null;
  loading: boolean;
  summary: any;
}) {
  const isNative = Capacitor.isNativePlatform();
  const isIOS = isNative && Capacitor.getPlatform() === 'ios';

  const presenting = useMemo(
    () => document.querySelector('ion-router-outlet') ?? undefined,
    []
  );

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      breakpoints={isIOS ? [0, 0.6, 0.92] : undefined}
      initialBreakpoint={isIOS ? 0.92 : undefined}
      backdropBreakpoint={isIOS ? 0.6 : undefined}
      presentingElement={presenting}
      className="amplee-modal"
    >
      <IonContent
        className="ion-padding"
        fullscreen
        style={{
          '--background': '#0c0a14',
          '--padding-top': 'calc(env(safe-area-inset-top) + 3px)',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 16px)',
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
            {row?.title ?? 'Event Summary'}
          </h2>
          <IonButton
            fill="clear"
            onClick={onClose}
            style={{
              '--color': 'rgba(156,163,175,0.9)',
              '--padding-end': '0',
              margin: 0,
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 22 }} />
          </IonButton>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}
          >
            <IonSpinner name="dots" color="primary" />
            <span style={{ color: 'rgba(156,163,175,0.7)', fontSize: 13 }}>
              Loading summary…
            </span>
          </div>
        ) : !summary ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: 'rgba(156,163,175,0.7)',
            }}
          >
            <IonIcon
              icon={alertCircleOutline}
              style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}
            />
            <p style={{ margin: 0 }}>Couldn't load this summary.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  fontSize: 13,
                  color: 'rgba(203,213,225,0.9)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon
                    icon={calendarOutline}
                    style={{ color: '#22c55e', fontSize: 16 }}
                  />
                  <span>
                    {summary.starts_at
                      ? new Date(summary.starts_at).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon
                    icon={
                      summary.type === 'show'
                        ? musicalNotesOutline
                        : hammerOutline
                    }
                    style={{
                      color:
                        summary.type === 'show'
                          ? 'rgba(192,132,252,0.9)'
                          : 'rgba(96,165,250,0.9)',
                      fontSize: 16,
                    }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>
                    {summary.type ?? '—'}
                  </span>
                </div>

                {summary.location && (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <IonIcon
                      icon={locationOutline}
                      style={{ color: '#8b5cf6', fontSize: 16 }}
                    />
                    <span>{summary.location}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon
                    icon={archiveOutline}
                    style={{ color: 'rgba(156,163,175,0.7)', fontSize: 16 }}
                  />
                  <span style={{ color: 'rgba(156,163,175,0.7)' }}>
                    Archived{' '}
                    {summary.archived_at
                      ? new Date(summary.archived_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {summary.type === 'show' && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'rgba(139,92,246,0.9)',
                    marginBottom: 12,
                  }}
                >
                  Show Stats
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#22c55e',
                      }}
                    >
                      {summary.merch_gross ? `$${summary.merch_gross}` : '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(156,163,175,0.7)',
                        marginTop: 2,
                      }}
                    >
                      Merch
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#22c55e',
                      }}
                    >
                      {summary.payout_total ? `$${summary.payout_total}` : '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(156,163,175,0.7)',
                        marginTop: 2,
                      }}
                    >
                      Payout
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#e5e7eb',
                      }}
                    >
                      {summary.attendance ?? '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(156,163,175,0.7)',
                        marginTop: 2,
                      }}
                    >
                      Attendance
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(156,163,175,0.7)',
                  marginBottom: 10,
                }}
              >
                Notes
              </div>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  color: 'rgba(203,213,225,0.9)',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {summary.archive_notes || (
                  <span
                    style={{
                      color: 'rgba(156,163,175,0.5)',
                      fontStyle: 'italic',
                    }}
                  >
                    No notes added
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
}
