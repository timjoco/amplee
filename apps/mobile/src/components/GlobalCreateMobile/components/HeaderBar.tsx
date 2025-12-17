import { IonHeader, IonIcon, IonToolbar } from '@ionic/react';
import { chevronBackOutline, closeOutline } from 'ionicons/icons';
import type { Step } from '../types';

const TITLES: Record<Step, string> = {
  menu: 'Create',
  newBand: 'New Band',
  newEvent: 'New Event',
  newSong: 'New Song',
  newProposal: 'New Proposal',
};

export default function HeaderBar(props: {
  step: Step;
  onBack: () => void;
  onClose: () => void;
}) {
  const { step, onBack, onClose } = props;

  return (
    <IonHeader translucent className="gc-header">
      <IonToolbar className="gc-header">
        <div className="gc-header-content">
          {step !== 'menu' ? (
            <button className="gc-header-back" onClick={onBack}>
              <IonIcon icon={chevronBackOutline} />
            </button>
          ) : (
            <div className="gc-header-spacer" />
          )}

          <h1 className="gc-header-title">{TITLES[step]}</h1>

          <button className="gc-header-close" onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </button>
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
