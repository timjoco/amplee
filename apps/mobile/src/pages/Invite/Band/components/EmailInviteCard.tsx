import { IonButton, IonInput } from '@ionic/react';

type Props = {
  emailInput: string;
  emails: string[];
  sendingInvites: boolean;
  onEmailInputChange: (value: string) => void;
  onAddEmail: () => void;
  onRemoveEmail: (email: string) => void;
  onSendInvites: () => void;
};

export function EmailInviteCard({
  emailInput,
  emails,
  sendingInvites,
  onEmailInputChange,
  onAddEmail,
  onRemoveEmail,
  onSendInvites,
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
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 13,
          color: '#9ca3af',
        }}
      >
        Enter email addresses to send invites.
      </p>

      <div
        style={{
          background: 'rgba(15,23,42,0.96)',
          borderRadius: 10,
          padding: '4px 12px',
          marginBottom: 12,
          border: '1px solid rgba(148,163,184,0.35)',
        }}
      >
        <IonInput
          type="email"
          value={emailInput}
          placeholder="friend@example.com"
          onIonChange={(e) => onEmailInputChange(e.detail.value ?? '')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddEmail();
            }
          }}
          style={{
            '--color': '#e5e7eb',
            '--placeholder-color': 'rgba(156,163,175,0.7)',
          }}
        />
      </div>

      <IonButton
        expand="block"
        fill="outline"
        onClick={onAddEmail}
        disabled={!emailInput.trim()}
        style={{
          '--border-color': 'rgba(168,85,247,0.8)',
          '--color': '#a855f7',
          '--border-radius': '10px',
          height: 44,
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        Add email
      </IonButton>

      {emails.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {emails.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => onRemoveEmail(em)}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(168,85,247,0.6)',
                padding: '6px 12px',
                fontSize: 13,
                background: 'rgba(147,51,234,0.2)',
                color: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 500,
              }}
            >
              <span>{em}</span>
              <span style={{ fontSize: 16, opacity: 0.8 }}>×</span>
            </button>
          ))}
        </div>
      )}

      <IonButton
        expand="block"
        onClick={onSendInvites}
        disabled={emails.length === 0 || sendingInvites}
        style={{
          '--background':
            'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
          '--border-radius': '14px',
          height: 48,
          fontWeight: 700,
          fontSize: 15,
          marginTop: 4,
        }}
      >
        {sendingInvites
          ? 'Sending…'
          : `Send ${emails.length} invite${emails.length !== 1 ? 's' : ''}`}
      </IonButton>
    </div>
  );
}
