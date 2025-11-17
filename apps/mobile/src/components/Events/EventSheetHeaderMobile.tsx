// src/components/Events/EventSheetHeaderMobile.tsx
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '../../hooks/useAttendance';

type Props = {
  eventId: string;
  title?: string;
};

export default function EventSheetHeaderMobile({ eventId, title }: Props) {
  const nav = useNavigate();
  const { mine, update, saving } = useAttendance(eventId);

  const isYes = mine === 'accepted';
  const isPending = mine === 'pending' || mine == null;

  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton fill="clear" onClick={() => nav(-1)} aria-label="Back">
            <IonIcon icon={chevronBackOutline} />
          </IonButton>
        </IonButtons>

        <IonTitle className="event-sheet-title">{title || 'Event'}</IonTitle>

        <IonButtons slot="end" className="event-attendance-buttons">
          <IonButton
            size="small"
            shape="round"
            disabled={saving}
            onClick={() => update('accepted')}
            className={isYes ? 'att-btn att-btn--active' : 'att-btn'}
          >
            Yes
          </IonButton>
          <IonButton
            size="small"
            shape="round"
            disabled={saving}
            onClick={() => update('pending')}
            className={isPending ? 'att-btn att-btn--active' : 'att-btn'}
          >
            Pending
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}
