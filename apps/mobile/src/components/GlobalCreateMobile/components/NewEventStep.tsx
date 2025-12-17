/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import type { BandLite, InviteMode } from '../types';
import EventWarnings from './EventWarnings';

type RosterLite = { id: string; name: string };

// Keep this loose so you don’t fight TS while refactoring
type EventFormShape = {
  bandId: string;
  title: string;
  type: 'show' | 'practice' | string;
  starts: string;
  location: string;

  inviteMode: InviteMode | string;
  selectedRosterId: string;

  conflicts?: any[];
  sameDayEvents?: any[];
  checkingConflicts: boolean;

  setBandId: (v: string) => void;
  setTitle: (v: string) => void;
  setType: (v: any) => void;
  setShowStartsPicker: (v: boolean) => void;
  setLocation: (v: string) => void;

  setInviteMode: (v: InviteMode) => void;
  setSelectedRosterId: (v: string) => void;
  setSelectedUserIds: (v: string[]) => void;
};

export default function NewEventStep(props: {
  bands: BandLite[];
  loadingBands: boolean;

  currentBandId: string;
  onBandChange: (bandId: string) => void;

  eventForm: EventFormShape;

  availableRosters: RosterLite[];
  loadingInviteData: boolean;

  triggerHaptic: () => void;
  onSubmit: () => void;
}) {
  const {
    bands,
    loadingBands,
    currentBandId,
    onBandChange,
    eventForm,
    availableRosters,
    loadingInviteData,
    triggerHaptic,
    onSubmit,
  } = props;

  const totalWarnings =
    (eventForm.conflicts?.length || 0) + (eventForm.sameDayEvents?.length || 0);
  const hasWarnings = totalWarnings > 0;

  const missingInviteSelection =
    (eventForm.inviteMode as InviteMode) === 'roster'
      ? !eventForm.selectedRosterId
      : false;

  return (
    <div className="gc-form-card gc-form-card-event">
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-event">Band</label>
        <div className="gc-select-wrapper">
          <select
            className="gc-select gc-form-input-event"
            value={currentBandId}
            onChange={(e) => onBandChange(e.target.value)}
          >
            {loadingBands && <option value="">Loading…</option>}
            {!loadingBands &&
              bands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>

          <IonIcon icon={chevronForwardOutline} className="gc-select-chevron" />
        </div>
      </div>

      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-event">Title</label>
        <input
          type="text"
          className="gc-form-input gc-form-input-event"
          value={eventForm.title}
          onChange={(e) => eventForm.setTitle(e.target.value)}
          placeholder="e.g., Show @ The Rino"
        />
      </div>

      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-event">Type</label>
        <div className="gc-toggle-group">
          {['show', 'practice'].map((t) => (
            <button
              key={t}
              className={`gc-toggle-btn ${
                eventForm.type === t
                  ? 'gc-toggle-btn-active-event'
                  : 'gc-toggle-btn-inactive'
              }`}
              onClick={() => eventForm.setType(t as any)}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-event">Starts</label>
        <button
          className={`gc-date-btn gc-date-btn-event ${
            eventForm.starts ? 'gc-date-btn-filled' : 'gc-date-btn-empty'
          }`}
          onClick={() => eventForm.setShowStartsPicker(true)}
          type="button"
        >
          {eventForm.starts
            ? new Date(eventForm.starts).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'Select date & time'}
        </button>
      </div>

      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-event">
          Location (optional)
        </label>
        <input
          type="text"
          className="gc-form-input gc-form-input-event"
          value={eventForm.location}
          onChange={(e) => eventForm.setLocation(e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      {/* Invite */}
      <div className="gc-form-group">
        <label className="gc-form-label gc-form-label-event">Invite</label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`gc-toggle-btn ${
              (eventForm.inviteMode as InviteMode) === 'full'
                ? 'gc-toggle-btn-active-event'
                : 'gc-toggle-btn-inactive'
            }`}
            onClick={() => {
              triggerHaptic();
              eventForm.setInviteMode('full');
              eventForm.setSelectedRosterId('');
              eventForm.setSelectedUserIds([]);
            }}
          >
            Full band
          </button>

          <button
            type="button"
            className={`gc-toggle-btn ${
              (eventForm.inviteMode as InviteMode) === 'roster'
                ? 'gc-toggle-btn-active-event'
                : 'gc-toggle-btn-inactive'
            }`}
            onClick={() => {
              triggerHaptic();
              eventForm.setInviteMode('roster');
              eventForm.setSelectedUserIds([]);
            }}
          >
            Roster
          </button>
        </div>

        {(eventForm.inviteMode as InviteMode) === 'full' && (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 14,
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              color: '#6ee7b7',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            All band members will be invited.
          </div>
        )}

        {(eventForm.inviteMode as InviteMode) === 'roster' && (
          <div style={{ marginTop: 10 }}>
            <div className="gc-select-wrapper">
              <select
                className="gc-select gc-form-input-event"
                value={eventForm.selectedRosterId}
                onChange={(e) => eventForm.setSelectedRosterId(e.target.value)}
                disabled={loadingInviteData}
              >
                <option value="">
                  {loadingInviteData ? 'Loading rosters…' : 'Select roster…'}
                </option>
                {availableRosters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <IonIcon
                icon={chevronForwardOutline}
                className="gc-select-chevron"
              />
            </div>

            {availableRosters.length === 0 && !loadingInviteData && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  color: '#fde68a',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                No saved rosters yet. Create one at your band page.
              </div>
            )}

            {eventForm.selectedRosterId && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#9ca3af',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Members from this roster will be invited.
              </div>
            )}
          </div>
        )}
      </div>

      <EventWarnings
        conflicts={eventForm.conflicts || []}
        sameDayEvents={eventForm.sameDayEvents || []}
      />

      <button
        className={`gc-submit-btn ${
          hasWarnings ? 'gc-submit-btn-warning' : 'gc-submit-btn-event'
        }`}
        onClick={onSubmit}
        disabled={
          eventForm.checkingConflicts ||
          !eventForm.bandId ||
          !eventForm.title.trim() ||
          !eventForm.starts ||
          missingInviteSelection
        }
        style={{
          marginTop: hasWarnings ? 8 : undefined,
          ...(hasWarnings
            ? {
                background:
                  'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)',
                boxShadow: '0 4px 14px rgba(251, 191, 36, 0.3)',
              }
            : {}),
        }}
        type="button"
      >
        {eventForm.checkingConflicts
          ? 'Checking availability…'
          : hasWarnings
          ? `Create anyway · ${totalWarnings} warning${
              totalWarnings > 1 ? 's' : ''
            }`
          : missingInviteSelection
          ? 'Select invitees to continue'
          : 'Create Event'}
      </button>
    </div>
  );
}
