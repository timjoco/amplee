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
  pressedButton: string | null;
  onPress: (buttonId: string, next: Step) => void;
}) {
  const { bands, pressedButton, onPress } = props;

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

      {bands.length > 0 && (
        <>
          <button
            className={`gc-menu-card gc-menu-card-event ${
              pressedButton === 'newEvent' ? 'pressed' : ''
            }`}
            onClick={() => onPress('newEvent', 'newEvent')}
          >
            <div className="gc-menu-card-icon">
              <IonIcon icon={calendarOutline} />
            </div>
            <div className="gc-menu-card-content">
              <div className="gc-menu-card-title">New Event</div>
              <div className="gc-menu-card-description">
                Schedule a show or rehearsal
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
            }`}
            onClick={() => onPress('newProposal', 'newProposal')}
          >
            <div className="gc-menu-card-icon">
              <IonIcon icon={clipboardOutline} />
            </div>
            <div className="gc-menu-card-content">
              <div className="gc-menu-card-title">New Proposal</div>
              <div className="gc-menu-card-description">
                Pitch a gig idea for your band
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
            }`}
            onClick={() => onPress('newSong', 'newSong')}
          >
            <div className="gc-menu-card-icon">
              <IonIcon icon={musicalNotesOutline} />
            </div>
            <div className="gc-menu-card-content">
              <div className="gc-menu-card-title">New Song</div>
              <div className="gc-menu-card-description">
                Add a song to your band's library
              </div>
            </div>
            <IonIcon
              icon={chevronForwardOutline}
              className="gc-menu-card-chevron"
            />
          </button>
        </>
      )}
    </div>
  );
}
