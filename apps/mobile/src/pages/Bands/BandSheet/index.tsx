import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { calendarOutline, clipboardOutline, peopleOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import AvatarImageMobile from '../../../components/ui/AvatarImageMobile';
import { BandHeader } from './components/BandHeader';
import { DashboardGrid } from './components/DashboardGrid';
import { NextEventCard } from './components/NextEventCard';
import { useBandSheet } from './hooks/useBandSheet';

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

export default function BandSheetMobile() {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const isLarge = screenSize === 'large';
  const isMedium = screenSize === 'medium';
  const {
    bandId,
    loading,
    error,
    bandName,
    bandAvatarUrl,
    bandAvatarUpdatedAt,
    myRole,
    showBandSettings,
    setShowBandSettings,
    nextEvent,
    pressedButton,
    eventsCount,
    proposalsCount,
    rosterMembers,
    isAndroid,
    handleButtonPress,
  } = useBandSheet();

  if (!bandId) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Band</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <BandHeader
        bandId={bandId}
        bandName={bandName}
        bandAvatarUrl={bandAvatarUrl}
        bandAvatarUpdatedAt={bandAvatarUpdatedAt}
        isAdmin={myRole === 'admin'}
        showSettings={showBandSettings}
        onShowSettings={() => setShowBandSettings(true)}
        onHideSettings={() => setShowBandSettings(false)}
        isLarge={isLarge}
      />

      <IonContent
        fullscreen
        scrollY={true}
        style={
          {
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
            '--padding-bottom': isAndroid
              ? 'calc(env(safe-area-inset-bottom) + 110px)'
              : 'calc(env(safe-area-inset-bottom) + 72px)',
          } as React.CSSProperties
        }
      >
        {loading ? (
          <div
            style={{
              padding: 24,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <IonSpinner />
          </div>
        ) : error ? (
          <div style={{ padding: 16 }}>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        ) : isLarge ? (
          /* Large screen: two-column layout with sidebar */
          <div
            style={{
              padding: '28px 48px 32px',
              display: 'flex',
              gap: 32,
            }}
          >
            {/* Main content - widgets grid */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <DashboardGrid
                bandId={bandId}
                eventsCount={eventsCount}
                proposalsCount={proposalsCount}
                rosterMembers={rosterMembers}
                pressedButton={pressedButton}
                handleButtonPress={handleButtonPress}
                nextEvent={nextEvent}
              />
            </div>

            {/* Sidebar - stats and members */}
            <div
              style={{
                width: 320,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* Stats cards */}
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: 20,
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 16,
                  }}
                >
                  Band Stats
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <IonIcon
                      icon={peopleOutline}
                      style={{ fontSize: 20, color: '#38bdf8', marginBottom: 4 }}
                    />
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#F9FAFB',
                      }}
                    >
                      {rosterMembers.length}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Members</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 20, color: '#34d399', marginBottom: 4 }}
                    />
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#F9FAFB',
                      }}
                    >
                      {eventsCount}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Events</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <IonIcon
                      icon={clipboardOutline}
                      style={{ fontSize: 20, color: '#f59e0b', marginBottom: 4 }}
                    />
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#F9FAFB',
                      }}
                    >
                      {proposalsCount}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Proposals</div>
                  </div>
                </div>
              </div>

              {/* Members list */}
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: 20,
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 16,
                  }}
                >
                  Band Members
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rosterMembers.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <AvatarImageMobile
                        name={member.display_name || member.full_name}
                        bucket="avatars"
                        avatarPath={member.avatar_url || undefined}
                        size={40}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#F9FAFB',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {member.display_name || member.full_name}
                        </div>
                        {member.role === 'admin' && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#a78bfa',
                              fontWeight: 600,
                            }}
                          >
                            Admin
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Small/medium screens: single column */
          <div
            style={{
              padding: isMedium ? '24px 28px 28px' : '20px 16px 24px',
              maxWidth: isMedium ? '900px' : '600px',
              margin: '0 auto',
            }}
          >
            {nextEvent && (
              <NextEventCard
                event={nextEvent}
                isPressed={pressedButton === 'nextEvent'}
                onPress={() =>
                  handleButtonPress('nextEvent', () =>
                    navigate(`/bands/${bandId}/events/${nextEvent.id}`)
                  )
                }
              />
            )}

            <DashboardGrid
              bandId={bandId}
              eventsCount={eventsCount}
              proposalsCount={proposalsCount}
              rosterMembers={rosterMembers}
              pressedButton={pressedButton}
              handleButtonPress={handleButtonPress}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
