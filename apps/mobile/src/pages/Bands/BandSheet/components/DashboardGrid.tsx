import { IonIcon } from '@ionic/react';
import {
  airplaneOutline,
  calendarOutline,
  chevronForwardOutline,
  clipboardOutline,
  globeOutline,
  musicalNotesOutline,
  peopleOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import BandAvailabilityWidget from '../../../../components/Bands/BandAvailabilityWidget';
import type { RosterMember } from '../types';

type Props = {
  bandId: string;
  eventsCount: number;
  proposalsCount: number;
  rosterMembers: RosterMember[];
  pressedButton: string | null;
  handleButtonPress: (buttonId: string, action: () => void) => void;
};

const cardBaseStyle = {
  background:
    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  borderRadius: 20,
  padding: '16px 14px',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  cursor: 'pointer',
  textAlign: 'left' as const,
  minHeight: 130,
  position: 'relative' as const,
  transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
};

const chevronStyle = {
  position: 'absolute' as const,
  top: 16,
  right: 14,
  fontSize: 18,
  color: 'rgba(148, 163, 184, 0.6)',
  opacity: 0.7,
};

const labelStyle = {
  fontSize: 11,
  color: '#9ca3af',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  fontWeight: 700,
};

const descriptionStyle = {
  fontSize: 12,
  color: 'rgba(203, 213, 225, 0.8)',
  opacity: 0.9,
};

export function DashboardGrid({
  bandId,
  eventsCount,
  proposalsCount,
  rosterMembers,
  pressedButton,
  handleButtonPress,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      {/* EVENTS CARD */}
      <button
        type="button"
        onClick={() =>
          handleButtonPress('events', () => navigate(`/bands/${bandId}/events`))
        }
        style={{
          ...cardBaseStyle,
          gap: eventsCount > 0 ? undefined : 10,
          transform: pressedButton === 'events' ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={chevronForwardOutline} style={chevronStyle} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <IonIcon
            icon={calendarOutline}
            style={{ fontSize: 20, color: '#34d399' }}
          />
          <span style={labelStyle}>Events</span>
        </div>
        {eventsCount > 0 ? (
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#34d399',
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {eventsCount}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {eventsCount === 1 ? 'event' : 'events'}
            </div>
          </div>
        ) : (
          <div style={descriptionStyle}>Shows & practices</div>
        )}
      </button>

      {/* PROPOSALS CARD */}
      <button
        type="button"
        onClick={() =>
          handleButtonPress('proposals', () =>
            navigate(`/bands/${bandId}/proposals`)
          )
        }
        style={{
          ...cardBaseStyle,
          gap: proposalsCount > 0 ? undefined : 10,
          transform: pressedButton === 'proposals' ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={chevronForwardOutline} style={chevronStyle} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <IonIcon
            icon={clipboardOutline}
            style={{ fontSize: 20, color: '#f59e0b' }}
          />
          <span style={labelStyle}>Proposals</span>
        </div>
        {proposalsCount > 0 ? (
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#f59e0b',
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {proposalsCount}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {proposalsCount === 1 ? 'proposal' : 'proposals'}
            </div>
          </div>
        ) : (
          <div style={descriptionStyle}>Vote on gigs</div>
        )}
      </button>

      {/* AVAILABILITY WIDGET */}
      <BandAvailabilityWidget
        bandId={bandId}
        members={rosterMembers.map((m) => ({
          id: m.id,
          name: m.display_name || m.full_name,
          role: null,
        }))}
        pressedButton={pressedButton}
        handleButtonPress={handleButtonPress}
      />

      {/* LIBRARY CARD */}
      <button
        type="button"
        onClick={() =>
          handleButtonPress('library', () =>
            navigate(`/bands/${bandId}/library`)
          )
        }
        style={{
          ...cardBaseStyle,
          gap: 10,
          transform: pressedButton === 'library' ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={chevronForwardOutline} style={chevronStyle} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <IonIcon
            icon={musicalNotesOutline}
            style={{ fontSize: 20, color: '#f472b6' }}
          />
          <span style={labelStyle}>Library</span>
        </div>
        <div style={descriptionStyle}>Songs & Setlists</div>
      </button>

      {/* TOURS CARD */}
      <button
        type="button"
        onClick={() =>
          handleButtonPress('tours', () =>
            navigate(`/bands/${bandId}/tours`)
          )
        }
        style={{
          ...cardBaseStyle,
          gap: 10,
          transform: pressedButton === 'tours' ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={chevronForwardOutline} style={chevronStyle} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <IonIcon
            icon={airplaneOutline}
            style={{ fontSize: 20, color: '#d97757' }}
          />
          <span style={labelStyle}>Tours</span>
        </div>
        <div style={descriptionStyle}>Manage itineraries</div>
      </button>

      {/* ROSTER CARD */}
      <button
        type="button"
        onClick={() =>
          handleButtonPress('roster', () => navigate(`/bands/${bandId}/roster`))
        }
        style={{
          ...cardBaseStyle,
          gap: 10,
          transform: pressedButton === 'roster' ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={chevronForwardOutline} style={chevronStyle} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <IonIcon
            icon={peopleOutline}
            style={{ fontSize: 20, color: '#38bdf8' }}
          />
          <span style={labelStyle}>Roster</span>
        </div>
        <div style={descriptionStyle}>Band members</div>
      </button>

      {/* PUBLIC PROFILE CARD */}
      <button
        type="button"
        onClick={() =>
          handleButtonPress('publicPage', () =>
            navigate(`/bands/${bandId}/public`)
          )
        }
        style={{
          ...cardBaseStyle,
          gap: 10,
          transform: pressedButton === 'publicPage' ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={chevronForwardOutline} style={chevronStyle} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <IonIcon
            icon={globeOutline}
            style={{ fontSize: 20, color: '#a78bfa' }}
          />
          <span style={labelStyle}>Public Profile</span>
        </div>
        <div style={descriptionStyle}>Bio, socials & links</div>
      </button>
    </div>
  );
}
