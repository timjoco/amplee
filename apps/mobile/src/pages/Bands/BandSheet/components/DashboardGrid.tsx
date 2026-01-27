import { IonIcon } from '@ionic/react';
import {
  calendarOutline,
  chevronForwardOutline,
  clipboardOutline,
  globeOutline,
  musicalNotesOutline,
  peopleOutline,
  timeOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import BandAvailabilityWidget from '../../../../components/Bands/BandAvailabilityWidget';
import type { NextEvent, RosterMember } from '../types';
import { computeTimeUntilEvent, formatEventDate, formatEventTime } from '../utils';

// Hook to detect screen size for responsive layouts
// Large = 1026px+ (desktop layout), Medium = 768-1025px, Small = <768px
function useScreenSize() {
  const [size, setSize] = React.useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window === 'undefined') return 'small';
    if (window.innerWidth >= 1026) return 'large';
    if (window.innerWidth >= 768) return 'medium';
    return 'small';
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1026) setSize('large');
      else if (window.innerWidth >= 768) setSize('medium');
      else setSize('small');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

type Props = {
  bandId: string;
  eventsCount: number;
  proposalsCount: number;
  rosterMembers: RosterMember[];
  pressedButton: string | null;
  handleButtonPress: (buttonId: string, action: () => void) => void;
  nextEvent?: NextEvent | null;
};

const getCardBaseStyle = (isLarge: boolean) => ({
  background:
    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  borderRadius: isLarge ? 24 : 20,
  padding: isLarge ? '22px 20px' : '16px 14px',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  cursor: 'pointer',
  textAlign: 'left' as const,
  minHeight: isLarge ? 160 : 130,
  position: 'relative' as const,
  transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
});

const getChevronStyle = (isLarge: boolean) => ({
  position: 'absolute' as const,
  top: isLarge ? 22 : 16,
  right: isLarge ? 20 : 14,
  fontSize: isLarge ? 20 : 18,
  color: 'rgba(148, 163, 184, 0.6)',
  opacity: 0.7,
});

const getLabelStyle = (isLarge: boolean) => ({
  fontSize: isLarge ? 12 : 11,
  color: '#9ca3af',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  fontWeight: 700,
});

const getDescriptionStyle = (isLarge: boolean) => ({
  fontSize: isLarge ? 14 : 12,
  color: 'rgba(203, 213, 225, 0.8)',
  opacity: 0.9,
});

export function DashboardGrid({
  bandId,
  eventsCount,
  proposalsCount,
  rosterMembers,
  pressedButton,
  handleButtonPress,
  nextEvent,
}: Props) {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const isLarge = screenSize === 'large';
  const isMedium = screenSize === 'medium';

  const cardBaseStyle = getCardBaseStyle(isLarge);
  const chevronStyle = getChevronStyle(isLarge);
  const labelStyle = getLabelStyle(isLarge);
  const descriptionStyle = getDescriptionStyle(isLarge);

  // 3 columns on large, 2 on medium/small
  const gridColumns = isLarge ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)';

  const timeUntil = nextEvent ? computeTimeUntilEvent(nextEvent.starts_at) : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: isLarge ? '20px' : isMedium ? '16px' : '12px',
        marginBottom: '16px',
      }}
    >
      {/* NEXT EVENT CARD - shown in grid on large screens */}
      {nextEvent && (
        <button
          type="button"
          onClick={() =>
            handleButtonPress('nextEvent', () =>
              navigate(`/bands/${bandId}/events/${nextEvent.id}`)
            )
          }
          style={{
            ...cardBaseStyle,
            transform: pressedButton === 'nextEvent' ? 'scale(0.97)' : 'scale(1)',
          }}
        >
          <IonIcon icon={chevronForwardOutline} style={chevronStyle} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isLarge ? 10 : 8,
              marginBottom: isLarge ? 10 : 8,
            }}
          >
            <IonIcon
              icon={calendarOutline}
              style={{ fontSize: isLarge ? 24 : 20, color: '#34d399' }}
            />
            <span style={labelStyle}>Next Event</span>
            {timeUntil && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(15, 118, 110, 0.4)',
                  marginLeft: 'auto',
                }}
              >
                <IonIcon
                  icon={timeOutline}
                  style={{ fontSize: 10, color: '#A7F3D0' }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#ECFDF5',
                  }}
                >
                  {timeUntil}
                </span>
              </div>
            )}
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                fontSize: isLarge ? 18 : 16,
                fontWeight: 700,
                color: '#F9FAFB',
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {nextEvent.title}
            </div>
            <div style={{ fontSize: isLarge ? 13 : 12, color: '#9ca3af' }}>
              {formatEventDate(nextEvent.starts_at)}
            </div>
          </div>
        </button>
      )}

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
              gap: isLarge ? 10 : 8,
              marginBottom: isLarge ? 10 : 8,
            }}
          >
            <IonIcon
              icon={calendarOutline}
              style={{ fontSize: isLarge ? 24 : 20, color: '#34d399' }}
            />
            <span style={labelStyle}>Events</span>
          </div>
          {eventsCount > 0 ? (
            <div style={{ marginTop: 'auto' }}>
              <div
                style={{
                  fontSize: isLarge ? 34 : 28,
                  fontWeight: 700,
                  color: '#34d399',
                  lineHeight: 1,
                  marginBottom: 2,
                }}
              >
                {eventsCount}
              </div>
              <div style={{ fontSize: isLarge ? 14 : 12, color: '#9ca3af' }}>
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
            gap: isLarge ? 10 : 8,
            marginBottom: isLarge ? 10 : 8,
          }}
        >
          <IonIcon
            icon={clipboardOutline}
            style={{ fontSize: isLarge ? 24 : 20, color: '#f59e0b' }}
          />
          <span style={labelStyle}>Proposals</span>
        </div>
        {proposalsCount > 0 ? (
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                fontSize: isLarge ? 34 : 28,
                fontWeight: 700,
                color: '#f59e0b',
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {proposalsCount}
            </div>
            <div style={{ fontSize: isLarge ? 14 : 12, color: '#9ca3af' }}>
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
            gap: isLarge ? 10 : 8,
            marginBottom: isLarge ? 10 : 8,
          }}
        >
          <IonIcon
            icon={musicalNotesOutline}
            style={{ fontSize: isLarge ? 24 : 20, color: '#f472b6' }}
          />
          <span style={labelStyle}>Library</span>
        </div>
        <div style={descriptionStyle}>Songs & Setlists</div>
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
            gap: isLarge ? 10 : 8,
            marginBottom: isLarge ? 10 : 8,
          }}
        >
          <IonIcon
            icon={peopleOutline}
            style={{ fontSize: isLarge ? 24 : 20, color: '#38bdf8' }}
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
            gap: isLarge ? 10 : 8,
            marginBottom: isLarge ? 10 : 8,
          }}
        >
          <IonIcon
            icon={globeOutline}
            style={{ fontSize: isLarge ? 24 : 20, color: '#a78bfa' }}
          />
          <span style={labelStyle}>Public Profile</span>
        </div>
        <div style={descriptionStyle}>Bio, socials & links</div>
      </button>
    </div>
  );
}
