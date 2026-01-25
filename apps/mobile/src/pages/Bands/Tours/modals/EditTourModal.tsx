import { IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, createOutline } from 'ionicons/icons';
import { glassCard, TEAL } from '../lib/styles';
import type { TourStatus } from '../types/tourTypes';
import { TOUR_STATUS_LABELS } from '../types/tourTypes';

type Props = {
  isOpen: boolean;
  editName: string;
  setEditName: (name: string) => void;
  editDescription: string;
  setEditDescription: (desc: string) => void;
  editStartDate: string;
  setEditStartDate: (date: string) => void;
  editEndDate: string;
  setEditEndDate: (date: string) => void;
  editStatus: TourStatus;
  setEditStatus: (status: TourStatus) => void;
  savingTour: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function EditTourModal({
  isOpen,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editStartDate,
  setEditStartDate,
  editEndDate,
  setEditEndDate,
  editStatus,
  setEditStatus,
  savingTour,
  onClose,
  onSave,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          ...glassCard,
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 0,
          border: `1px solid ${TEAL.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: TEAL.subtle,
                border: `1px solid ${TEAL.border}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IonIcon
                icon={createOutline}
                style={{ fontSize: 18, color: TEAL.light }}
              />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Edit Tour
            </h2>
          </div>
          <button
            onClick={onClose}
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
            <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 20 }}>
          {/* Tour Name */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: 8,
              }}
            >
              Tour Name *
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter tour name"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: 8,
              }}
            >
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Date Range */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#9ca3af',
                  marginBottom: 8,
                }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f9fafb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#9ca3af',
                  marginBottom: 8,
                }}
              >
                End Date
              </label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f9fafb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: 8,
              }}
            >
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as TourStatus)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none',
              }}
            >
              {Object.entries(TOUR_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value} style={{ background: '#1f2937' }}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={savingTour}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
                opacity: savingTour ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={savingTour || !editName.trim()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                background: TEAL.primary,
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: `0 4px 14px ${TEAL.glow}`,
                opacity: savingTour || !editName.trim() ? 0.6 : 1,
              }}
            >
              {savingTour ? (
                <>
                  <IonSpinner
                    style={{ '--color': '#fff', width: 16, height: 16 }}
                  />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
