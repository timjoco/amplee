import { IonIcon } from '@ionic/react';
import {
  calendarOutline,
  chevronForwardOutline,
  clipboardOutline,
  gridOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import type { BandLite, Step } from '../types';

export default function MenuStep(props: {
  bands: BandLite[];
  loadingBands?: boolean;
  pressedButton: string | null;
  onPress: (buttonId: string, next: Step) => void;
}) {
  const { bands, loadingBands, pressedButton, onPress } = props;

  const hasBands = bands.length > 0;
  const canCreate = hasBands && !loadingBands;

  // DEBUG: quick visibility into the actual state
  // eslint-disable-next-line no-console
  console.log('[MenuStep]', {
    hasBands,
    bandCount: bands.length,
    loadingBands,
  });

  return (
    <div className="gc-menu-container">
      <button
        className={`gc-menu-card gc-menu-card-band ${
          pressedButton === 'newBand' ? 'pressed' : ''
        }`}
        onClick={() => onPress('newBand', 'newBand')}
      >
        <div className="gc-menu-card-icon">
          <IonIcon icon={gridOutline} />
        </div>
        <div className="gc-menu-card-content">
          <div className="gc-menu-card-title">New Band</div>
          <div className="gc-menu-card-description">
            Create a new project or solo act
          </div>
        </div>
        <IonIcon
          icon={chevronForwardOutline}
          className="gc-menu-card-chevron"
        />
      </button>

      <button
        className={`gc-menu-card gc-menu-card-event ${
          pressedButton === 'newEvent' ? 'pressed' : ''
        } ${!canCreate ? 'gc-menu-card-disabled' : ''}`}
        disabled={!canCreate}
        onClick={() => onPress('newEvent', 'newEvent')}
        title={
          loadingBands
            ? 'Loading bands…'
            : !hasBands
            ? 'Create a band first'
            : undefined
        }
      >
        <div className="gc-menu-card-icon">
          <IonIcon icon={calendarOutline} />
        </div>
        <div className="gc-menu-card-content">
          <div className="gc-menu-card-title">New Event</div>
          <div className="gc-menu-card-description">
            {loadingBands
              ? 'Loading bands…'
              : !hasBands
              ? 'Create a band first'
              : 'Schedule a show or rehearsal'}
          </div>
        </div>
        <IonIcon
          icon={chevronForwardOutline}
          className="gc-menu-card-chevron"
        />
      </button>

      <button
        className={`gc-menu-card gc-menu-card-proposal ${
          pressedButton === 'newProposal' ? 'pressed' : ''
        } ${!canCreate ? 'gc-menu-card-disabled' : ''}`}
        disabled={!canCreate}
        onClick={() => onPress('newProposal', 'newProposal')}
      >
        <div className="gc-menu-card-icon">
          <IonIcon icon={clipboardOutline} />
        </div>
        <div className="gc-menu-card-content">
          <div className="gc-menu-card-title">New Proposal</div>
          <div className="gc-menu-card-description">
            {loadingBands
              ? 'Loading bands…'
              : !hasBands
              ? 'Create a band first'
              : 'Pitch a gig idea for your band'}
          </div>
        </div>
        <IonIcon
          icon={chevronForwardOutline}
          className="gc-menu-card-chevron"
        />
      </button>

      <button
        className={`gc-menu-card gc-menu-card-song ${
          pressedButton === 'newSong' ? 'pressed' : ''
        } ${!canCreate ? 'gc-menu-card-disabled' : ''}`}
        disabled={!canCreate}
        onClick={() => onPress('newSong', 'newSong')}
      >
        <div className="gc-menu-card-icon">
          <IonIcon icon={musicalNotesOutline} />
        </div>
        <div className="gc-menu-card-content">
          <div className="gc-menu-card-title">New Song</div>
          <div className="gc-menu-card-description">
            {loadingBands
              ? 'Loading bands…'
              : !hasBands
              ? 'Create a band first'
              : "Add a song to your band's library"}
          </div>
        </div>
        <IonIcon
          icon={chevronForwardOutline}
          className="gc-menu-card-chevron"
        />
      </button>
    </div>
  );
}
