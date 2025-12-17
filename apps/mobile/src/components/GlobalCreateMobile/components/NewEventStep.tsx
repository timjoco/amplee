/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import { useEffect } from 'react';
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

const FULL_ROSTER_ID = '__full__';

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

  const inviteMode = (eventForm.inviteMode as InviteMode) ?? 'full';

  // Keep eventForm.bandId in sync with the selected band
  useEffect(() => {
    const id = String(currentBandId ?? '').trim();
    if (id && eventForm.bandId !== id) eventForm.setBandId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBandId]);

  // If user switches to roster mode, ensure we have a real roster id selected
  useEffect(() => {
    if (inviteMode !== 'roster') return;
    if (loadingInviteData) return;
    if (!availableRosters.length) return;

    const current = String(eventForm.selectedRosterId ?? '').trim();

    // if empty OR currently set to "__full__", default to first roster
    if (!current || current === FULL_ROSTER_ID) {
      eventForm.setSelectedRosterId(String(availableRosters[0].id));
    }
  }, [
    inviteMode,
    loadingInviteData,
    availableRosters,
    eventForm.selectedRosterId,
    eventForm.setSelectedRosterId,
  ]);

  // Require roster ALWAYS (FULL_ROSTER_ID counts as “selected”)
  const missingRoster = !String(eventForm.selectedRosterId ?? '').trim();

  // Keep disabled while rosters are loading (prevents “looks enabled but can’t submit”)
  const inviteNotReady = loadingInviteData;

  const totalWarnings =
    (eventForm.conflicts?.length || 0) + (eventForm.sameDayEvents?.length || 0);
  const hasWarnings = totalWarnings > 0;

  const isSubmitDisabled =
    eventForm.checkingConflicts ||
    !eventForm.bandId ||
    !eventForm.title.trim() ||
    !eventForm.starts ||
    missingRoster ||
    inviteNotReady;

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
              inviteMode === 'full'
                ? 'gc-toggle-btn-active-event'
                : 'gc-toggle-btn-inactive'
            }`}
            onClick={() => {
              triggerHaptic();
              eventForm.setInviteMode('full');

              // ✅ Full band: always populate selectedRosterId
              eventForm.setSelectedRosterId(FULL_ROSTER_ID);

              eventForm.setSelectedUserIds([]);
            }}
          >
            Full band
          </button>

          <button
            type="button"
            className={`gc-toggle-btn ${
              inviteMode === 'roster'
                ? 'gc-toggle-btn-active-event'
                : 'gc-toggle-btn-inactive'
            }`}
            onClick={() => {
              triggerHaptic();
              eventForm.setInviteMode('roster');
              eventForm.setSelectedUserIds([]);

              // Optional: if rosters already loaded, preselect first immediately
              if (!loadingInviteData && availableRosters.length) {
                const current = String(eventForm.selectedRosterId ?? '').trim();
                if (!current || current === FULL_ROSTER_ID) {
                  eventForm.setSelectedRosterId(String(availableRosters[0].id));
                }
              }
            }}
          >
            Roster
          </button>
        </div>

        {inviteMode === 'full' && (
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

        {/* ✅ Always show roster picker; in "full" it’s informational / optional */}
        <div style={{ marginTop: 10 }}>
          <div className="gc-select-wrapper">
            <select
              className="gc-select gc-form-input-event"
              value={String(eventForm.selectedRosterId ?? '')}
              onChange={(e) =>
                eventForm.setSelectedRosterId(
                  String(e.target.value ?? '').trim()
                )
              }
              disabled={loadingInviteData}
            >
              {/* placeholder */}
              <option value="" disabled>
                {loadingInviteData ? 'Loading rosters…' : 'Select roster…'}
              </option>

              {/* special "full" sentinel */}
              <option value={FULL_ROSTER_ID}>Full band (everyone)</option>

              {availableRosters.map((r) => {
                const id = String(r.id ?? '').trim();
                return (
                  <option key={id || r.name} value={id}>
                    {r.name}
                  </option>
                );
              })}
            </select>

            <IonIcon
              icon={chevronForwardOutline}
              className="gc-select-chevron"
            />
          </div>

          {inviteMode === 'roster' &&
            availableRosters.length === 0 &&
            !loadingInviteData && (
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

          {!!eventForm.selectedRosterId && (
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
              {eventForm.selectedRosterId === FULL_ROSTER_ID
                ? 'All band members will be invited.'
                : 'Members from this roster will be invited.'}
            </div>
          )}
        </div>
      </div>

      <EventWarnings
        conflicts={eventForm.conflicts || []}
        sameDayEvents={eventForm.sameDayEvents || []}
      />

      <button
        className="gc-submit-btn gc-submit-btn-event"
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        type="button"
      >
        {eventForm.checkingConflicts
          ? 'Checking availability…'
          : inviteNotReady
          ? 'Loading invite options…'
          : missingRoster
          ? 'Select a roster to continue'
          : hasWarnings
          ? `Create Event · ${totalWarnings} warning${
              totalWarnings > 1 ? 's' : ''
            }`
          : 'Create Event'}
      </button>
    </div>
  );
}
