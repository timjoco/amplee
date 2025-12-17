import { IonIcon, IonSpinner } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import * as React from 'react';
import { MdOutlineEventAvailable } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

type Member = {
  id: string;
  name: string;
  role: string | null;
};

type Props = {
  bandId: string;
  members: Member[];
  pressedButton?: string | null;
  handleButtonPress?: (key: string, callback: () => void) => void;
};

export default function BandAvailabilityWidget({
  bandId,
  members: _members,
  pressedButton,
  handleButtonPress,
}: Props) {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(false);
  }, []);

  const handleClick = () => {
    if (handleButtonPress) {
      handleButtonPress('availability', () =>
        nav(`/bands/${bandId}/availability`)
      );
    } else {
      nav(`/bands/${bandId}/availability`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background:
          'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        borderRadius: 20,
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 130,
        position: 'relative',
        transform:
          pressedButton === 'availability' ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
      }}
    >
      <IonIcon
        icon={chevronForwardOutline}
        style={{
          position: 'absolute',
          top: 16,
          right: 14,
          fontSize: 18,
          color: 'rgba(148, 163, 184, 0.6)',
          opacity: 0.7,
        }}
      />

      {/* Header – same style as other cards, with new icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <MdOutlineEventAvailable
          style={{ fontSize: 20, color: '#14b8a6' }} // teal
        />{' '}
        <span
          style={{
            fontSize: 11,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 700,
          }}
        >
          Availability
        </span>
      </div>

      {/* Body – exact same text styling as other tiles */}
      {loading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IonSpinner style={{ '--color': '#a78bfa' } as React.CSSProperties} />
        </div>
      ) : (
        <div
          style={{
            fontSize: 12,
            color: 'rgba(203, 213, 225, 0.8)',
            opacity: 0.9,
          }}
        >
          Tap to see who&apos;s free and when
        </div>
      )}
    </button>
  );
}
