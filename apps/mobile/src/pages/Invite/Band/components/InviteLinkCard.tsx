import { IonButton, IonIcon } from '@ionic/react';
import {
  checkmarkOutline,
  copyOutline,
  personAddOutline,
  refreshOutline,
} from 'ionicons/icons';

type Props = {
  bandName: string;
  inviteLink: string | null;
  generatingLink: boolean;
  copied: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
};

export function InviteLinkCard({
  bandName,
  inviteLink,
  generatingLink,
  copied,
  onCopy,
  onRegenerate,
}: Props) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 20,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <IonIcon
          icon={personAddOutline}
          style={{ fontSize: 20, color: '#a855f7' }}
        />
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: '#e5e7eb',
          }}
        >
          Share invite link
        </p>
      </div>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 13,
          color: '#9ca3af',
        }}
      >
        Send a link for friends to join {bandName} directly.
      </p>

      <div
        style={{
          background: 'rgba(15,23,42,0.96)',
          borderRadius: 12,
          padding: 10,
          marginBottom: 12,
          border: '1px solid rgba(148,163,184,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            color: '#a78bfa',
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {generatingLink
            ? 'Generating link…'
            : inviteLink || 'No link generated'}
        </span>
        {inviteLink && !generatingLink && (
          <IonButton
            fill="clear"
            size="small"
            onClick={onRegenerate}
            style={{
              '--padding-start': '6px',
              '--padding-end': '6px',
              minHeight: 28,
            }}
          >
            <IonIcon
              icon={refreshOutline}
              style={{ fontSize: 16, color: '#9ca3af' }}
            />
          </IonButton>
        )}
      </div>

      <IonButton
        expand="block"
        onClick={onCopy}
        disabled={!inviteLink || generatingLink}
        style={{
          '--background': copied ? 'rgba(34,197,94,0.9)' : '#9333ea',
          '--border-radius': '14px',
          height: 48,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        <IonIcon icon={copied ? checkmarkOutline : copyOutline} slot="start" />
        {copied ? 'Copied!' : 'Copy link'}
      </IonButton>
    </div>
  );
}
