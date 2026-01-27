import { IonButton, IonIcon } from '@ionic/react';
import { chatbubbleOutline } from 'ionicons/icons';

type Props = {
  inviteLink: string | null;
  onOpenTexting: () => void;
};

export function SmsInviteCard({ inviteLink, onOpenTexting }: Props) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 20,
        padding: 20,
      }}
    >
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 13,
          color: '#9ca3af',
        }}
      >
        Opens your native texting app with the invite link pre-filled.
      </p>

      <IonButton
        expand="block"
        onClick={onOpenTexting}
        disabled={!inviteLink}
        style={{
          '--background': '#9333ea',
          '--border-radius': '14px',
          height: 48,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        <IonIcon icon={chatbubbleOutline} slot="start" />
        Open Messages app
      </IonButton>
    </div>
  );
}
